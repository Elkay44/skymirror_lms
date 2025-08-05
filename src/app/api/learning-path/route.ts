/* eslint-disable */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Configuration, OpenAIApi } from 'openai';
import { getServerSession } from 'next-auth';
import { ExtendedPrismaClient } from '@/lib/prisma-extensions';

const prisma = new PrismaClient() as unknown as ExtendedPrismaClient;
const configuration = process.env.OPENAI_API_KEY ? new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;
const openai = configuration ? new OpenAIApi(configuration) : undefined;

export async function GET() {
  try {
    // Check if OpenAI is available
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI service not configured' }, { status: 503 });
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and student profile in parallel
    const [user, studentProfile, enrollments] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
      }),
      prisma.studentProfile.findUnique({
        where: { userId: session.user.email },
      }),
      prisma.enrollment.findMany({
        where: { user: { email: session.user.email } },
        include: { course: true },
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return student profile data along with enrollments
    return NextResponse.json({ 
      learningPath: studentProfile?.bio || '',
      enrollments: enrollments || []
    });
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current progress and performance in parallel
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: user?.id },
      include: { quiz: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get request data
    const { goals, userPreferences } = await request.json();

    // Update or create student profile with bio
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: { bio: goals || '' },
      create: { 
        userId: user.id, 
        bio: goals || '' 
      },
    });

    // Generate AI recommendations if we have preferences
    const aiRecommendations: any[] = [];
    if (userPreferences) {
      try {
        const prompt = generateAIPrompt({
          ...user,
          quizAttempts
        }, userPreferences);
        const chatCompletion = await openai!.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const recommendations = parseAIRecommendations(chatCompletion.choices[0].message.content as string);
        if (Array.isArray(recommendations)) {
          aiRecommendations.push(...recommendations);
        }
      } catch (error) {
        console.error('Error generating AI recommendations:', error);
      }
    }

    // Return success response with the updated bio and AI recommendations
    return NextResponse.json({ 
      success: true,
      learningPath: goals || '',
      aiRecommendations,
      message: 'Learning path updated successfully' 
    });
  } catch (error) {
    console.error('Error updating learning path:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateAIPrompt(userData: any, preferences: any): string {
  // Extract user's current courses and performance
  const currentCourses = userData.enrollments
    ?.map((e: any) => e.course?.title || 'Unknown Course')
    .filter(Boolean)
    .join(', ') || 'None';
    
  const averageScore = calculateAverageQuizScore(userData.quizAttempts || []);

  // Generate prompt based on user preferences and current progress
  return `As an AI learning assistant, generate a personalized learning path based on the following information:

User Information:
- Name: ${userData.name || 'User'}
- Current level: ${userData.level || 1}
- Current courses: ${currentCourses}
- Average quiz score: ${averageScore}%

Learning Preferences:
- Time commitment: ${preferences?.timeCommitment || 'Not specified'} hours per week
- Preferred learning style: ${preferences?.learningStyle || 'Not specified'}
- Topics of interest: ${preferences?.interests?.join(', ') || 'Not specified'}

Please provide a structured learning path with recommended study schedule. Format the response as a JSON array:
[
  {
    "course": "Course Title",
    "reason": "Why this course is recommended",
    "priority": "high/medium/low",
    "estimated_duration": "X weeks",
    "prerequisites": ["List of prerequisites"]
  }
]`;
}

function parseAIRecommendations(aiResponse: string): any[] {
  try {
    // Remove any leading/trailing text and extract the JSON array
    const jsonStart = aiResponse.indexOf('[');
    const jsonEnd = aiResponse.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid JSON format');
    }

    const jsonStr = aiResponse.substring(jsonStart, jsonEnd + 1);
    const recommendations = JSON.parse(jsonStr);
    
    // Validate the structure
    if (!Array.isArray(recommendations)) {
      throw new Error('Expected an array of recommendations');
    }

    return recommendations;
  } catch (error) {
    console.error('Error parsing AI recommendations:', error);
    return [];
  }
}

function calculateAverageQuizScore(quizAttempts: any[] = []): number {
  if (!quizAttempts?.length) return 0;
  const validAttempts = quizAttempts.filter(attempt => typeof attempt?.score === 'number');
  if (!validAttempts.length) return 0;
  
  const totalScore = validAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  return Math.round((totalScore / validAttempts.length) * 100);
}
