/* eslint-disable */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

// POST /api/projects/[projectId]/disconnect-repository - Disconnect a repository from a project
export async function POST(
  _req: Request, 
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
    
    // Check if project exists and user has access to it
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        OR: [
          { authorId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        course: {
          include: {
            enrollments: {
              where: { 
                userId: session.user.id,
                role: { in: ['INSTRUCTOR', 'ADMIN'] },
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Check if user is the author or has admin/instructor role in the course
    const isAuthor = project.authorId === session.user.id;
    const isInstructorOrAdmin = project.course?.enrollments?.length > 0;
    
    if (!isAuthor && !isInstructorOrAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to disconnect this repository' },
        { status: 403 }
      );
    }
    
    // Remove webhooks if repository URL exists
    if (project.repositoryUrl && project.repositoryProvider) {
      try {
        await removeRepositoryWebhooks(
          project.repositoryUrl,
          project.repositoryProvider,
          session.user.id,
          projectId
        );
      } catch (error) {
        console.error('Error removing webhooks:', error);
        // Continue with disconnection even if webhook removal fails
      }
    }
    
    // Update project to remove repository information
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        repositoryUrl: null,
        repositoryProvider: null,
        webhookUrl: null,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect repository' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to remove webhooks from repository
 */
async function removeRepositoryWebhooks(
  repositoryUrl: string, 
  provider: string | null, 
  userId: string, 
  projectId: string
): Promise<void> {
  try {
    if (!provider) return;
    
    // Get user's access token for the provider
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider,
      },
      select: {
        access_token: true,
      },
    });
    
    if (!account?.access_token) {
      console.warn('No access token found for provider:', provider);
      return;
    }
    
    // Extract repository details
    const repoDetails = extractRepositoryDetails(repositoryUrl, provider);
    if (!repoDetails) {
      console.warn('Could not extract repository details from URL:', repositoryUrl);
      return;
    }
    
    if (provider === 'github') {
      const octokit = new Octokit({
        auth: account.access_token,
      });
      
      // Get all webhooks for the repository
      const { data: hooks } = await octokit.repos.listWebhooks({
        owner: repoDetails.owner,
        repo: repoDetails.repo,
      });
      
      // Find and delete the webhook for this project
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github/${projectId}`;
      const hook = hooks.find(h => h.config.url === webhookUrl);
      
      if (hook) {
        await octokit.repos.deleteWebhook({
          owner: repoDetails.owner,
          repo: repoDetails.repo,
          hook_id: hook.id,
        });
      }
    } else if (provider === 'gitlab' && repoDetails.id) {
      const fetch = require('node-fetch');
      
      // Get all webhooks for the GitLab project
      const response = await fetch(
        `https://gitlab.com/api/v4/projects/${repoDetails.id}/hooks`, 
        {
          headers: {
            'PRIVATE-TOKEN': account.access_token,
          },
        }
      );
      
      const hooks = await response.json();
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gitlab/${projectId}`;
      const hook = hooks.find((h: any) => h.url === webhookUrl);
      
      if (hook) {
        await fetch(
          `https://gitlab.com/api/v4/projects/${repoDetails.id}/hooks/${hook.id}`, 
          {
            method: 'DELETE',
            headers: {
              'PRIVATE-TOKEN': account.access_token,
            },
          }
        );
      }
    }
  } catch (error) {
    console.error('Error in removeRepositoryWebhooks:', error);
    // Don't throw the error, as we want to continue with disconnection
  }
}

/**
 * Helper function to extract repository details from URL
 */
function extractRepositoryDetails(
  url: string, 
  provider: string
): { owner: string; repo: string; id?: string } | null {
  try {
    let match;
    
    if (provider === 'github') {
      // GitHub URL patterns
      // https://github.com/owner/repo
      // git@github.com:owner/repo.git
      match = url.match(/github\.com[\/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/i);
      
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
        };
      }
    } else if (provider === 'gitlab') {
      // GitLab URL patterns
      // https://gitlab.com/owner/repo
      // git@gitlab.com:owner/repo.git
      // https://gitlab.com/namespace/project-name/-/tree/branch
      match = url.match(/gitlab\.com[\/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/i);
      
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
          id: `${match[1]}/${match[2].replace(/\.git$/, '')}`,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting repository details:', error);
    return null;
  }
}
