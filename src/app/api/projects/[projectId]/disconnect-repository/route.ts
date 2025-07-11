import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

// POST /api/projects/[projectId]/disconnect-repository - Disconnect a repository from a project
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { projectId } = params;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    // Students must be enrolled in the course to disconnect a repository
    if (session.user.role === 'Student' && project.course.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to manage repository connections' },
        { status: 403 }
      );
    }
    
    // Find the submission with repository URL
    const submission = await prisma.projectSubmission.findFirst({
      where: {
        projectId,
        studentId: session.user.id,
        NOT: {
          repositoryUrl: null,
        },
      },
    });
    
    if (!submission || !submission.repositoryUrl) {
      return NextResponse.json(
        { error: 'No repository connected to this project' },
        { status: 404 }
      );
    }
    
    // Try to remove webhooks if possible
    await removeRepositoryWebhooks(submission.repositoryUrl, submission.repositoryProvider, session.user.id, projectId);
    
    // Update submission to remove repository URL
    await prisma.projectSubmission.update({
      where: { id: submission.id },
      data: {
        repositoryUrl: null,
        repositoryProvider: null,
      },
    });
    
    // Remove webhook metadata
    await prisma.repositoryWebhook.deleteMany({
      where: {
        repositoryUrl: submission.repositoryUrl,
        projectId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect repository' },
      { status: 500 }
    );
  }
}

// Helper function to remove webhooks from repository
async function removeRepositoryWebhooks(repositoryUrl: string, provider: string | null, userId: string, projectId: string) {
  try {
    if (!provider) return false;
    
    // Extract repository details from URL
    const repoDetails = extractRepositoryDetails(repositoryUrl, provider);
    if (!repoDetails) return false;
    
    const { owner, repo, id } = repoDetails;
    
    // Get user's tokens for the provider
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider,
      },
    });
    
    if (!account || !account.access_token) return false;
    
    if (provider === 'github') {
      // Remove GitHub webhook
      const octokit = new Octokit({ auth: account.access_token });
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`;
      
      // List webhooks
      const webhooks = await octokit.repos.listWebhooks({
        owner,
        repo,
      });
      
      // Find and delete the webhook for this app
      const webhook = webhooks.data.find(hook => hook.config.url === webhookUrl);
      if (webhook) {
        await octokit.repos.deleteWebhook({
          owner,
          repo,
          hook_id: webhook.id,
        });
      }
    } else if (provider === 'gitlab' && id) {
      // Remove GitLab webhook
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gitlab`;
      
      // List webhooks
      const response = await fetch(`https://gitlab.com/api/v4/projects/${id}/hooks`, {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      });
      
      if (response.ok) {
        const webhooks = await response.json();
        const webhook = webhooks.find((hook: any) => hook.url === webhookUrl);
        
        if (webhook) {
          await fetch(`https://gitlab.com/api/v4/projects/${id}/hooks/${webhook.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error removing repository webhooks:', error);
    return false;
  }
}

// Helper function to extract repository details from URL
function extractRepositoryDetails(url: string, provider: string): { owner: string; repo: string; id?: string } | null {
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
    } else if (provider === 'gitlab' && parsedUrl.hostname === 'gitlab.com' && parsedUrl.pathname.includes('/api/v4/projects/')) {
      // Handle GitLab API URL format
      const parts = parsedUrl.pathname.split('/');
      const projectId = parts[parts.indexOf('projects') + 1];
      
      return {
        owner: '',
        repo: '',
        id: projectId,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing repository URL:', error);
    return null;
  }
}
