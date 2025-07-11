import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

// GET /api/repositories?provider=github|gitlab - Get repositories from GitHub or GitLab
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider') || 'github';
    
    // Validate provider
    if (provider !== 'github' && provider !== 'gitlab') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
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
    
    let repositories = [];
    
    if (provider === 'github') {
      // Fetch repositories from GitHub
      const octokit = new Octokit({ auth: account.access_token });
      
      const response = await octokit.repos.listForAuthenticatedUser({
        visibility: 'all',
        sort: 'updated',
        per_page: 100,
      });
      
      repositories = response.data;
    } else if (provider === 'gitlab') {
      // Fetch repositories from GitLab
      const response = await fetch('https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at&per_page=100', {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GitLab repositories: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform GitLab data to match GitHub format for consistency
      repositories = data.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        full_name: repo.path_with_namespace,
        html_url: repo.web_url,
        description: repo.description,
        updated_at: repo.last_activity_at,
        language: repo.repository_access_level > 0 ? repo.predominant_language || null : null,
        default_branch: repo.default_branch,
        visibility: repo.visibility,
      }));
    }
    
    return NextResponse.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
