/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

// POST /api/projects/[projectId]/connect-repository - Connect a repository to a project
export async function POST(
  req: Request, 
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = await params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Get request data
    const { repositoryUrl, provider = 'github' } = await req.json();
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' }, 
        { status: 400 }
      );
    }
    
    // Validate provider
    if (provider !== 'github' && provider !== 'gitlab') {
      return NextResponse.json(
        { error: 'Invalid provider' }, 
        { status: 400 }
      );
    }
    
    // Check if project exists and user has access to it
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        OR: [
          { authorId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Extract repository details
    const repoDetails = extractRepositoryDetails(repositoryUrl, provider);
    if (!repoDetails) {
      return NextResponse.json(
        { error: 'Invalid repository URL' }, 
        { status: 400 }
      );
    }
    
    // Get user's access token for the provider
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: provider,
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
      },
    });
    
    if (!account?.access_token) {
      return NextResponse.json(
        { error: `Please connect your ${provider} account first` },
        { status: 400 }
      );
    }
    
    let webhookUrl = '';
    
    // Set up webhook based on provider
    if (provider === 'github') {
      const octokit = new Octokit({
        auth: account.access_token,
      });
      
      webhookUrl = await setupGitHubWebhook(
        octokit, 
        repoDetails.owner, 
        repoDetails.repo, 
        projectId
      );
    } else if (provider === 'gitlab') {
      // Convert project ID to number for GitLab API
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) {
        return NextResponse.json(
          { error: 'Invalid project ID' },
          { status: 400 }
        );
      }
      
      webhookUrl = await setupGitLabWebhook(
        account.access_token,
        projectIdNum,
        projectId
      );
    }
    
    // Update project with repository information
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        repositoryUrl,
        repositoryProvider: provider,
        webhookUrl,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract repository owner and name from URL
 */
function extractRepositoryDetails(
  url: string, 
  provider: string
): { owner: string; repo: string } | null {
  try {
    let match;
    
    if (provider === 'github') {
      // GitHub URL patterns
      // https://github.com/owner/repo
      // git@github.com:owner/repo.git
      match = url.match(/github\.com[\/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/i);
    } else if (provider === 'gitlab') {
      // GitLab URL patterns
      // https://gitlab.com/owner/repo
      // git@gitlab.com:owner/repo.git
      match = url.match(/gitlab\.com[\/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/i);
    }
    
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
    };
  } catch (error) {
    console.error('Error extracting repository details:', error);
    return null;
  }
}

/**
 * Helper function to set up GitHub webhook
 */
async function setupGitHubWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  projectId: string
): Promise<string> {
  try {
    // Generate a random secret for webhook security
    const crypto = require('crypto');
    const secret = crypto.randomBytes(20).toString('hex');
    
    // Webhook URL for your API
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github/${projectId}`;
    
    // Check if webhook already exists
    const { data: hooks } = await octokit.repos.listWebhooks({
      owner,
      repo,
    });
    
    const existingHook = hooks.find(hook => 
      hook.config.url === webhookUrl
    );
    
    if (existingHook) {
      // Update existing webhook
      await octokit.repos.updateWebhook({
        owner,
        repo,
        hook_id: existingHook.id,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret,
          insecure_ssl: process.env.NODE_ENV === 'development' ? '1' : '0',
        },
        events: ['push', 'pull_request'],
        active: true,
      });
      
      return `https://github.com/${owner}/${repo}/settings/hooks/${existingHook.id}`;
    } else {
      // Create new webhook
      const { data: hook } = await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret,
          insecure_ssl: process.env.NODE_ENV === 'development' ? '1' : '0',
        },
        events: ['push', 'pull_request'],
        active: true,
      });
      
      return `https://github.com/${owner}/${repo}/settings/hooks/${hook.id}`;
    }
  } catch (error) {
    console.error('Error setting up GitHub webhook:', error);
    throw new Error('Failed to set up GitHub webhook');
  }
}

/**
 * Helper function to set up GitLab webhook
 */
async function setupGitLabWebhook(
  accessToken: string,
  projectId: number,
  academyProjectId: string
): Promise<string> {
  try {
    const fetch = require('node-fetch');
    
    // Webhook URL for your API
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gitlab/${academyProjectId}`;
    
    // Generate a random secret for webhook security
    const crypto = require('crypto');
    const secret = crypto.randomBytes(20).toString('hex');
    
    // Check if webhook already exists
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${projectId}/hooks`, 
      {
        headers: {
          'PRIVATE-TOKEN': accessToken,
        },
      }
    );
    
    const hooks = await response.json();
    const existingHook = hooks.find((hook: any) => hook.url === webhookUrl);
    
    if (existingHook) {
      // Update existing webhook
      await fetch(
        `https://gitlab.com/api/v4/projects/${projectId}/hooks/${existingHook.id}`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': accessToken,
          },
          body: JSON.stringify({
            url: webhookUrl,
            push_events: true,
            merge_requests_events: true,
            token: secret,
            enable_ssl_verification: process.env.NODE_ENV !== 'development',
          }),
        }
      );
      
      return `https://gitlab.com/projects/${projectId}/hooks`;
    } else {
      // Create new webhook
      const createResponse = await fetch(
        `https://gitlab.com/api/v4/projects/${projectId}/hooks`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': accessToken,
          },
          body: JSON.stringify({
            url: webhookUrl,
            push_events: true,
            merge_requests_events: true,
            token: secret,
            enable_ssl_verification: process.env.NODE_ENV !== 'development',
          }),
        }
      );
      
      const hook = await createResponse.json();
      return `https://gitlab.com/projects/${projectId}/hooks/${hook.id}`;
    }
  } catch (error) {
    console.error('Error setting up GitLab webhook:', error);
    throw new Error('Failed to set up GitLab webhook');
  }
}
