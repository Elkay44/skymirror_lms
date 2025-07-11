import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Configuration, OpenAIApi } from 'openai';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        learningPath: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ learningPath: user.learningPath });
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

    // Get user's current progress and performance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
        quizAttempts: {
          include: {
            quiz: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate AI recommendations based on user data
    const prompt = generateAIPrompt(user, preferences);
    const aiResponse = await openai.createCompletion({
      model: 'gpt-4',
      prompt,
      max_tokens: 500,
    });

    const recommendations = parseAIRecommendations(aiResponse.data.choices[0].text || '');

    // Update or create learning path
    const learningPath = await prisma.learningPath.upsert({
      where: {
        userId: user.id,
      },
      update: {
        preferences,
        aiRecommendations: recommendations,
      },
      create: {
        userId: user.id,
        preferences,
        aiRecommendations: recommendations,
      },
    });

    return NextResponse.json({ learningPath });
  } catch (error) {
    console.error('Error updating learning path:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateAIPrompt(user: any, preferences: any) {
  return `Based on the following user data and preferences, suggest a personalized learning path:
User Level: ${user.level}
Learning Style Preferences: ${JSON.stringify(preferences)}
Current Courses: ${user.enrollments.map((e: any) => e.course.title).join(', ')}
Quiz Performance: ${calculateAverageQuizScore(user.quizAttempts)}
Please recommend:
1. Next courses to take
2. Learning pace
3. Content type preferences
4. Suggested practice areas`;
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

function calculateAverageQuizScore(quizAttempts: any[]) {
  if (!quizAttempts.length) return 0;
  const sum = quizAttempts.reduce((acc, attempt) => acc + attempt.score, 0);
  return sum / quizAttempts.length;
}
