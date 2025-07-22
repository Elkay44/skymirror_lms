/* eslint-disable */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Configuration, OpenAIApi } from 'openai';
import { getServerSession } from 'next-auth';
import { ExtendedPrismaClient } from '@/lib/prisma-extensions';

const prisma = new PrismaClient() as unknown as ExtendedPrismaClient;
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

export async function GET() {
  try {
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

    // Return learning goals from student profile along with enrollments
    return NextResponse.json({ 
      learningPath: studentProfile?.learningGoals || '',
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

    const body = await request.json();
    const { preferences } = body;

    // Get user's current progress and performance in parallel
    const [user, enrollments, quizAttempts] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
      }),
      prisma.enrollment.findMany({
        where: { user: { email: session.user.email } },
        include: { course: true },
      }),
      prisma.quizAttempt.findMany({
        where: { user: { email: session.user.email } },
        include: { quiz: true },
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate AI prompt based on user's current progress and preferences
    const prompt = generateAIPrompt({
      ...user,
      enrollments,
      quizAttempts
    }, preferences);

    // Get AI recommendations
    const aiResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    const recommendations = parseAIRecommendations(aiResponse.data.choices[0]?.text || '');

    // Get request data
    const requestData = await request.json();
    const { goals, userPreferences } = requestData;

    // Update or create student profile with learning goals
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: { learningGoals: goals || '' },
      create: { 
        userId: user.id, 
        learningGoals: goals || '' 
      },
    });

    // Generate AI recommendations if we have preferences
    const aiRecommendations: any[] = [];
    if (userPreferences) {
      try {
        const prompt = generateAIPrompt(user, userPreferences);
        const aiResponse = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt,
          max_tokens: 150,
          temperature: 0.7,
        });

        const recommendations = parseAIRecommendations(aiResponse.data.choices[0]?.text || '');
        if (Array.isArray(recommendations)) {
          aiRecommendations.push(...recommendations);
        }
      } catch (error) {
        console.error('Error generating AI recommendations:', error);
      }
    }

    // Return success response with the updated learning goals and AI recommendations
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

function generateAIPrompt(userData: any, preferences: any) {
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

Please provide a structured learning path with recommended courses, resources, and a study schedule.`;
}

function parseAIRecommendations(aiResponse: string) {
  // Parse and structure the AI response
  const recommendations = {
    suggestedCourses: [],
    learningPace: '',
    contentPreferences: [],
    practiceAreas: [],
  };

  // Parse the AI response and populate the recommendations object
  // This is a simplified version - you would need to implement proper parsing logic
  
  return recommendations;
}

function calculateAverageQuizScore(quizAttempts: any[] = []) {
  if (!quizAttempts?.length) return 0;
  const validAttempts = quizAttempts.filter(attempt => typeof attempt?.score === 'number');
  if (!validAttempts.length) return 0;
  
  const totalScore = validAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  return Math.round((totalScore / validAttempts.length) * 100);
}
