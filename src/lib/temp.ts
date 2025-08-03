import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserRow {
  id: string;
  points: number;
  level: number;
  name: string | null;
  email: string;
}

interface AchievementRow {
  id: string;
  points: number;
  title: string;
  description: string;
}



/**
 * Test database queries and type handling
 */
async function testDatabase() {
  try {
    // Test user query
    const testUserId = 'test-id';
    const user = await prisma.$queryRaw`
      SELECT id, points, level, name, email
      FROM "User"
      WHERE id = ${testUserId}
    ` as UserRow[];

    if (user[0]) {
      console.log('User points:', user[0].points);
      console.log('User level:', user[0].level);
      console.log('User email:', user[0].email);
    } else {
      console.log('No user found with test ID');
    }

    // Test achievements query
    const achievements = await prisma.$queryRaw`
      SELECT "Achievement".id, points, title, description
      FROM "Achievement"
      WHERE "Achievement".id IN (
        SELECT "achievementId"
        FROM "UserAchievement"
        WHERE "userId" = ${testUserId}
      )
    ` as AchievementRow[];

    console.log('User achievements:', achievements);

    // Test level calculation
    const level = Math.floor(user[0]?.points / 1000) + 1;
    console.log('Calculated level:', level);

    // Test updating points
    const updateResult = await prisma.$executeRaw`
      UPDATE "User"
      SET points = points + 100
      WHERE id = ${testUserId}
    `;
    console.log('Points update result:', updateResult);

    // Test achievement awarding
    const newAchievement = {
      id: 'new-achievement',
      points: 500,
      title: 'Test Achievement',
      description: 'A test achievement'
    };

    // Create achievement if it doesn't exist
    const achievementExists = await prisma.$queryRaw`
      SELECT id
      FROM "Achievement"
      WHERE id = ${newAchievement.id}
    ` as { id: string }[];

    if (!achievementExists[0]) {
      await prisma.$executeRaw`
        INSERT INTO "Achievement" (id, points, title, description)
        VALUES (${newAchievement.id}, ${newAchievement.points}, ${newAchievement.title}, ${newAchievement.description})
      `;
    }

    // Award achievement to user
    await prisma.$executeRaw`
      INSERT INTO "UserAchievement" ("userId", "achievementId")
      VALUES (${testUserId}, ${newAchievement.id})
      ON CONFLICT DO NOTHING
    `;

    console.log('Achievement awarded successfully');

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
void testDatabase();
