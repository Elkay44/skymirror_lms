import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

// POST /api/projects/[projectId]/connect-repository - Connect a repository to a project
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request data
    const { repositoryUrl, provider = 'github' } = await req.json();
    
    if (!repositoryUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }
    
    // Validate provider
    if (provider !== 'github' && provider !== 'gitlab') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
    
    // Check if project exists and user has access to it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Students must be enrolled in the course to connect a repository
    if (session.user.role === 'Student' && project.course.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to connect a repository' },
        { status: 403 }
      );
    }
    
    // Get user's tokens for the specified provider
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: provider,
      },
    });
    
    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: `No ${provider} account connected. Please connect your ${provider} account first.` },
        { status: 401 }
      );
    }
    
    // Extract repository owner and name from URL
    const repoDetails = extractRepositoryDetails(repositoryUrl, provider);
    if (!repoDetails) {
      return NextResponse.json({ error: 'Invalid repository URL' }, { status: 400 });
    }
    
    const { owner, repo } = repoDetails;
    
    // Verify repository exists and user has access to it
    let repoExists = false;
    
    if (provider === 'github') {
      // Verify repository with GitHub API
      const octokit = new Octokit({ auth: account.access_token });
      
      try {
        await octokit.repos.get({
          owner,
          repo,
        });
        repoExists = true;
        
        // Set up webhook for automated submissions
        await setupGitHubWebhook(octokit, owner, repo, projectId);
      } catch (error) {
        console.error('Error verifying GitHub repository:', error);
        return NextResponse.json(
          { error: 'Unable to access repository. Make sure you have access to it.' },
          { status: 403 }
        );
      }
    } else if (provider === 'gitlab') {
      // Verify repository with GitLab API
      const encodedPath = encodeURIComponent(`${owner}/${repo}`);
      const response = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}`, {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      });
      
      if (response.ok) {
        repoExists = true;
        
        // Set up webhook for automated submissions
        const projectData = await response.json();
        await setupGitLabWebhook(account.access_token, projectData.id, projectId);
      } else {
        return NextResponse.json(
          { error: 'Unable to access repository. Make sure you have access to it.' },
          { status: 403 }
        );
      }
    }
    
    if (!repoExists) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Find existing project submission or create a new one
    let submission = await prisma.projectSubmission.findFirst({
      where: {
        projectId,
        studentId: session.user.id,
      },
    });
    
    if (submission) {
      // Update existing submission with repository URL
      submission = await prisma.projectSubmission.update({
        where: { id: submission.id },
        data: {
          repositoryUrl,
          repositoryProvider: provider,
        },
      });
    } else {
      // Create new submission with repository URL
      submission = await prisma.projectSubmission.create({
        data: {
          projectId,
          studentId: session.user.id,
          status: 'PENDING',
          repositoryUrl,
          repositoryProvider: provider,
        },
      });
    }
    
    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Error connecting repository:', error);
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    );
  }
}

// Helper function to extract repository owner and name from URL
function extractRepositoryDetails(url: string, provider: string): { owner: string; repo: string } | null {
  try {
    const parsedUrl = new URL(url);
    
    if (provider === 'github' && parsedUrl.hostname === 'github.com') {
      const parts = parsedUrl.pathname.split('/');
      if (parts.length >= 3) {
        return {
          owner: parts[1],
          repo: parts[2],
        };
      }
    } else if (provider === 'gitlab' && parsedUrl.hostname === 'gitlab.com') {
      const parts = parsedUrl.pathname.split('/');
      if (parts.length >= 3) {
        return {
          owner: parts[1],
          repo: parts[2],
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing repository URL:', error);
    return null;
  }
}

// Helper function to set up GitHub webhook
async function setupGitHubWebhook(octokit: Octokit, owner: string, repo: string, projectId: string) {
  try {
    // Check if webhook already exists
    const webhooks = await octokit.repos.listWebhooks({
      owner,
      repo,
    });
    
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`;
    const existingWebhook = webhooks.data.find(webhook => webhook.config.url === webhookUrl);
    
    if (existingWebhook) {
      // Update existing webhook
      await octokit.repos.updateWebhook({
        owner,
        repo,
        hook_id: existingWebhook.id,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.WEBHOOK_SECRET,
        },
      });
    } else {
      // Create new webhook
      await octokit.repos.createWebhook({
        owner,
        repo,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.WEBHOOK_SECRET,
        },
      });
    }
    
    // Store webhook metadata
    await prisma.repositoryWebhook.upsert({
      where: {
        repositoryUrl_projectId: {
          repositoryUrl: `https://github.com/${owner}/${repo}`,
          projectId,
        },
      },
      update: {
        provider: 'github',
        lastSyncedAt: new Date(),
      },
      create: {
        repositoryUrl: `https://github.com/${owner}/${repo}`,
        projectId,
        provider: 'github',
        lastSyncedAt: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error setting up GitHub webhook:', error);
    // We'll continue even if webhook setup fails - user can still manually submit
    return false;
  }
}

// Helper function to set up GitLab webhook
async function setupGitLabWebhook(accessToken: string, projectId: number, academyProjectId: string) {
  try {
    // Check if webhook already exists
    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch GitLab webhooks: ${response.statusText}`);
    }
    
    const webhooks = await response.json();
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gitlab`;
    const existingWebhook = webhooks.find((webhook: any) => webhook.url === webhookUrl);
    
    if (existingWebhook) {
      // Update existing webhook
      await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks/${existingWebhook.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          push_events: true,
          merge_requests_events: true,
          token: process.env.WEBHOOK_SECRET,
        }),
      });
    } else {
      // Create new webhook
      await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          push_events: true,
          merge_requests_events: true,
          token: process.env.WEBHOOK_SECRET,
        }),
      });
    }
    
    // Store webhook metadata
    await prisma.repositoryWebhook.upsert({
      where: {
        repositoryUrl_projectId: {
          repositoryUrl: `https://gitlab.com/api/v4/projects/${projectId}`,
          projectId: academyProjectId,
        },
      },
      update: {
        provider: 'gitlab',
        lastSyncedAt: new Date(),
      },
      create: {
        repositoryUrl: `https://gitlab.com/api/v4/projects/${projectId}`,
        projectId: academyProjectId,
        provider: 'gitlab',
        lastSyncedAt: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error setting up GitLab webhook:', error);
    // We'll continue even if webhook setup fails - user can still manually submit
    return false;
  }
}
