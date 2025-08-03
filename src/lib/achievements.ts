// Core imports
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Interface for achievement criteria
interface AchievementCriteria {
  check: () => Promise<boolean> | boolean;  // Function to check if achievement is met
  achievementId: string;                   // Unique identifier for the achievement
}

// Database row interfaces
interface AchievementRow {
  id: string;      // Achievement ID
  points: number;  // Points value
}

interface UserRow {
  id: string;      // User ID
  points: number;  // Total points
  level: number;   // Current level
}

// Achievement criteria configuration
// This defines what actions trigger which achievements
export async function checkAndAwardAchievements(userId: string, action: string): Promise<void> {
  // Map of action types to their achievement criteria
  const criteria: Record<string, AchievementCriteria[]> = {
    'course-completed': [
      {
        // Check if user has completed at least 1 course
        check: async () => {
          const completedCourses = await prisma.enrollment.count({
            where: {
              userId,
              status: 'COMPLETED'
            }
          });
          return completedCourses >= 1;
        },
        achievementId: 'course-completed'
      }
    ],
    'quiz-passed': [
      {
        check: async () => {
          const quizAttempts = await prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM "QuizAttempt"
            WHERE "userId" = ${userId}
            AND score >= 70
          ` as { count: number }[];
          
          return quizAttempts[0].count >= 1;
        },
        achievementId: 'quiz-passed'
      }
    ],
    'level-up': [
      {
        check: async () => {
          const user = await prisma.$queryRaw`
            SELECT points, level
            FROM "User"
            WHERE id = ${userId}
          ` as UserRow[];
          
          if (!user[0]) return false;
          
          // Calculate new level based on points
          const newLevel = Math.floor(user[0].points / 1000) + 1;
          return newLevel >= 2;
        },
        achievementId: 'level-up'
      }
    ]
  };

  const relevantCriteria = criteria[action] || [];

  for (const criterion of relevantCriteria) {
    const meetsCriteria = await criterion.check();
    if (meetsCriteria) {
      // Check if achievement already awarded
      const hasAchievement = await prisma.$queryRaw`
        SELECT "User".id, "User".points, "User".level, "Achievement".id, "Achievement".points
        FROM "User"
        LEFT JOIN "UserAchievement" ON "User".id = "UserAchievement"."userId"
        LEFT JOIN "Achievement" ON "UserAchievement"."achievementId" = "Achievement".id
        WHERE "User".id = ${userId}
        AND "Achievement".id = ${criterion.achievementId}
      ` as UserRow[];

      if (!hasAchievement[0]) {
        // Award achievement
        await prisma.$executeRaw`
          INSERT INTO "UserAchievement" ("userId", "achievementId")
          VALUES (${userId}, ${criterion.achievementId})
        `;

        // Update user points
        const achievement = await prisma.$queryRaw`
          SELECT points
          FROM "Achievement"
          WHERE id = ${criterion.achievementId}
        ` as AchievementRow[];

        if (achievement[0]) {
          await prisma.$executeRaw`
            UPDATE "User"
            SET points = points + ${achievement[0].points}
            WHERE id = ${userId}
          `;
        }
      }
    }
  }
}
