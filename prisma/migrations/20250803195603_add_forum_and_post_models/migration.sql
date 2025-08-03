/*
  Warnings:

  - You are about to drop the column `createdAt` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `assignment_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `assignment_submissions` table. All the data in the column will be lost.
  - Added the required column `userId` to the `assignment_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "forums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moduleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "forums_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "forums" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assignment_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT,
    "fileUrl" TEXT,
    "grade" REAL,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "gradedAt" DATETIME,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignment_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_assignment_submissions" ("assignmentId", "content", "feedback", "fileUrl", "grade", "gradedAt", "id", "status", "submittedAt") SELECT "assignmentId", "content", "feedback", "fileUrl", "grade", "gradedAt", "id", "status", "submittedAt" FROM "assignment_submissions";
DROP TABLE "assignment_submissions";
ALTER TABLE "new_assignment_submissions" RENAME TO "assignment_submissions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
