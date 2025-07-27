-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "goals" TEXT,
ADD COLUMN     "interests" TEXT,
ADD COLUMN     "preferredLearningStyle" TEXT,
ALTER COLUMN "learningGoals" DROP NOT NULL;
