/*
  Warnings:

  - You are about to drop the `MentorProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "MentorProfile_userId_key";

-- DropIndex
DROP INDEX "StudentProfile_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MentorProfile";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StudentProfile";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mentorship_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "mentorship_requests_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mentorship_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mentor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "price" REAL DEFAULT 0,
    "discountPrice" REAL DEFAULT 0,
    "level" TEXT,
    "category" TEXT,
    "language" TEXT DEFAULT 'en',
    "totalHours" REAL DEFAULT 0,
    "totalLectures" INTEGER DEFAULT 0,
    "totalQuizzes" INTEGER DEFAULT 0,
    "totalProjects" INTEGER DEFAULT 0,
    "totalStudents" INTEGER DEFAULT 0,
    "averageRating" REAL DEFAULT 0,
    "totalReviews" INTEGER DEFAULT 0,
    "instructorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "requirements" TEXT,
    "learningOutcomes" TEXT,
    "targetAudience" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("averageRating", "category", "createdAt", "description", "discountPrice", "id", "image", "instructorId", "isPublished", "language", "level", "price", "slug", "title", "totalHours", "totalLectures", "totalProjects", "totalQuizzes", "totalReviews", "totalStudents", "updatedAt") SELECT "averageRating", "category", "createdAt", "description", "discountPrice", "id", "image", "instructorId", "isPublished", "language", "level", "price", "slug", "title", "totalHours", "totalLectures", "totalProjects", "totalQuizzes", "totalReviews", "totalStudents", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_userId_key" ON "mentor_profiles"("userId");
