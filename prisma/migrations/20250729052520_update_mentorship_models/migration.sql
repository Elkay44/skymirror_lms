/*
  Warnings:

  - You are about to drop the `MentorSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "MentorSession_menteeId_idx";

-- DropIndex
DROP INDEX "MentorSession_mentorId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MentorSession";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "mentor_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "meetingUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mentor_sessions_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mentor_sessions_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isGroupChat" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT,
    "mentorshipId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "conversations_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentor_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_conversations" ("courseId", "createdAt", "id", "isGroupChat", "mentorshipId", "updatedAt") SELECT "courseId", "createdAt", "id", "isGroupChat", "mentorshipId", "updatedAt" FROM "conversations";
DROP TABLE "conversations";
ALTER TABLE "new_conversations" RENAME TO "conversations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "mentor_sessions_mentorId_idx" ON "mentor_sessions"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_sessions_menteeId_idx" ON "mentor_sessions"("menteeId");
