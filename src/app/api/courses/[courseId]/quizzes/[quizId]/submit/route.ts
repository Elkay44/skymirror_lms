import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type Answer = {
  questionId: string;
  answer: any; // This can be string, string[], or { itemId: string; matchId: string }[]
};

type Question = {
  id: string;
  questionType: string;
  points: number;
  correctAnswers: Array<{
    id: string;
    optionText: string;
  }>;
};

// POST endpoint to submit quiz answers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; quizId: string }> }
) {
  const { courseId, quizId } = await params;
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const { answers } = await req.json();

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to submit quizzes' },
        { status: 403 }
      );
    }

    // Get quiz data with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
            correctAnswers: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check if the user has already used up all attempts
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId: user.id,
        quizId: quizId,
      },
    });

    if (quiz.attemptsAllowed > 0 && attemptCount >= quiz.attemptsAllowed) {
      return NextResponse.json(
        { error: 'Maximum attempts reached for this quiz' },
        { status: 403 }
      );
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;

    // Create a new quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quizId,
        startedAt: new Date(Date.now() - 3600000), // Approximate start time 1 hour ago
        completedAt: new Date(),
      },
    });

    // Process each answer and save in database
    const userAnswers = [];

    for (const question of quiz.questions) {
      const userAnswer = answers.find((a: any) => a.questionId === question.id);
      totalPoints += question.points;

      let isCorrect = false;
      let pointsEarned = 0;

      if (userAnswer) {
        // Check if answer is correct based on question type
        switch (question.questionType) {
          case 'MULTIPLE_CHOICE':
            const correctOptionIds = question.correctAnswers.map((a: { id: string }) => a.id);
            isCorrect = 
              userAnswer.answer.length === correctOptionIds.length && 
              userAnswer.answer.every((id: string) => correctOptionIds.includes(id));
            break;

          case 'TRUE_FALSE':
            const correctAnswer = question.correctAnswers.length > 0;
            isCorrect = userAnswer.answer === correctAnswer;
            break;

          case 'FILL_BLANK':
            const correctTexts = question.correctAnswers.map(
              (a: { optionText: string }) => a.optionText.toLowerCase().trim()
            );
            isCorrect = correctTexts.includes(
              (userAnswer.answer as string).toLowerCase().trim()
            );
            break;

          case 'SHORT_ANSWER':
            // For short answer, we'll use a simple keyword matching approach
            // In a real system, this might involve NLP or manual grading
            const keywords = question.correctAnswers.flatMap((a: { optionText: string }) =>
              a.optionText.toLowerCase().split(/\s+/)
            );
            const userWords = userAnswer.answer.toLowerCase().split(/\s+/);
            const matchCount = userWords.filter((w: string) =>
              keywords.includes(w)
            ).length;
            const keywordThreshold = Math.ceil(keywords.length * 0.6); // 60% match required
            isCorrect = matchCount >= keywordThreshold;
            break;

          case 'MATCHING':
            const correctPairs = question.correctAnswers.map((a: { id: string; optionText: string }) => ({
              itemId: a.id,
              matchId: a.optionText, // In this model, optionText stores the matched ID
            }));
            isCorrect =
              userAnswer.answer.length === correctPairs.length &&
              userAnswer.answer.every((pair: any) =>
                correctPairs.some(
                  (cp: { itemId: string; matchId: string }) => cp.itemId === pair.itemId && cp.matchId === pair.matchId
                )
              );
            break;
        }

        // Award points if correct
        if (isCorrect) {
          pointsEarned = question.points;
          earnedPoints += pointsEarned;
          correctCount++;
        }

        // Save user answer
        await prisma.userAnswer.create({
          data: {
            attemptId: quizAttempt.id,
            questionId: question.id,
            textAnswer: typeof userAnswer.answer === 'string' ? userAnswer.answer : null,
            isCorrect,
            pointsEarned,
            submittedAt: new Date(),
          },
        });

        userAnswers.push({
          questionId: question.id,
          userAnswer: userAnswer.answer,
          isCorrect,
          pointsEarned,
        });
      }
    }

    // Calculate final score
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = score >= quiz.passingScore;

    // Update the quiz attempt with the final score
    await prisma.quizAttempt.update({
      where: { id: quizAttempt.id },
      data: {
        score,
        isPassed,
      },
    });

    // If this is the first time the user passed this quiz, award them points
    if (isPassed) {
      const previousPassedAttempts = await prisma.quizAttempt.findFirst({
        where: {
          userId: user.id,
          quizId: quizId,
          isPassed: true,
          id: { not: quizAttempt.id }
        }
      });

      if (!previousPassedAttempts) {
        // Award points based on quiz difficulty (simplified example)
        const pointsToAward = totalPoints;
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            points: { increment: pointsToAward }
          }
        });

        // Create notification for passing the quiz
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Quiz Passed!',
            message: `Congratulations! You passed the "${quiz.title}" quiz with a score of ${score}%.`,
            type: 'ACHIEVEMENT',
            linkUrl: `/courses/${courseId}/quizzes/${quizId}`,
          }
        });
      }
    }

    // Return the results
    return NextResponse.json({
      quizAttemptId: quizAttempt.id,
      score,
      totalPoints,
      earnedPoints,
      correctCount,
      totalQuestions: quiz.questions.length,
      isPassed,
      userAnswers,
      timeTaken: '30:45', // Would normally calculate this from startedAt and completedAt
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
