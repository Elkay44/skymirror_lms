-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT DEFAULT '',
    "description" TEXT DEFAULT '',
    "imageUrl" TEXT DEFAULT '/images/course-placeholder.jpg',
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "price" REAL NOT NULL DEFAULT 0,
    "discountedPrice" REAL,
    "language" TEXT DEFAULT 'English',
    "requirements" TEXT,
    "learningOutcomes" TEXT,
    "targetAudience" TEXT,
    "hasCertification" BOOLEAN NOT NULL DEFAULT false,
    "certificationRequirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "instructorId" TEXT NOT NULL,
    "tags" TEXT,
    CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("certificationRequirements", "createdAt", "description", "difficulty", "discountedPrice", "hasCertification", "id", "imageUrl", "instructorId", "isPrivate", "isPublished", "language", "learningOutcomes", "price", "requirements", "shortDescription", "status", "tags", "targetAudience", "title", "updatedAt") SELECT "certificationRequirements", "createdAt", "description", "difficulty", "discountedPrice", "hasCertification", "id", "imageUrl", "instructorId", "isPrivate", "isPublished", "language", "learningOutcomes", "price", "requirements", "shortDescription", "status", "tags", "targetAudience", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");
CREATE INDEX "Course_isPublished_status_idx" ON "Course"("isPublished", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
