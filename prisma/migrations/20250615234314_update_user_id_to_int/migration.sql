/*
  Warnings:

  - You are about to alter the column `studentId` on the `Certification` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `ConversationParticipant` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `instructorId` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `Enrollment` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `authorId` on the `ForumComment` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `authorId` on the `ForumPost` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `LearningMetric` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `MentorProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `senderId` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `Progress` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `reviewerId` on the `ProjectSubmission` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `studentId` on the `ProjectSubmission` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `QuizAttempt` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `studentId` on the `ShowcaseProject` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `StudentProfile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `studentId` on the `SubmissionResponse` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `UserAchievement` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `UserStats` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `B` on the `_MessageReadBy` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "certificateType" TEXT NOT NULL DEFAULT 'COURSE_COMPLETION',
    "tokenId" TEXT,
    "contractAddress" TEXT,
    "txHash" TEXT,
    "ipfsMetadataUrl" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "studentId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "verificationUrl" TEXT,
    "verificationCode" TEXT,
    CONSTRAINT "Certification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certification_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Certification" ("certificateType", "contractAddress", "courseId", "description", "expiresAt", "id", "ipfsMetadataUrl", "isRevoked", "issuedAt", "revokedAt", "studentId", "title", "tokenId", "txHash", "verificationCode", "verificationUrl") SELECT "certificateType", "contractAddress", "courseId", "description", "expiresAt", "id", "ipfsMetadataUrl", "isRevoked", "issuedAt", "revokedAt", "studentId", "title", "tokenId", "txHash", "verificationCode", "verificationUrl" FROM "Certification";
DROP TABLE "Certification";
ALTER TABLE "new_Certification" RENAME TO "Certification";
CREATE TABLE "new_ConversationParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ConversationParticipant" ("conversationId", "id", "joinedAt", "role", "unreadCount", "userId") SELECT "conversationId", "id", "joinedAt", "role", "unreadCount", "userId" FROM "ConversationParticipant";
DROP TABLE "ConversationParticipant";
ALTER TABLE "new_ConversationParticipant" RENAME TO "ConversationParticipant";
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
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
    "instructorId" INTEGER NOT NULL,
    "tags" TEXT,
    CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("certificationRequirements", "createdAt", "description", "difficulty", "discountedPrice", "hasCertification", "id", "imageUrl", "instructorId", "isPrivate", "isPublished", "language", "learningOutcomes", "price", "requirements", "shortDescription", "status", "tags", "targetAudience", "title", "updatedAt") SELECT "certificationRequirements", "createdAt", "description", "difficulty", "discountedPrice", "hasCertification", "id", "imageUrl", "instructorId", "isPrivate", "isPublished", "language", "learningOutcomes", "price", "requirements", "shortDescription", "status", "tags", "targetAudience", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");
CREATE INDEX "Course_isPublished_status_idx" ON "Course"("isPublished", "status");
CREATE TABLE "new_Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Enrollment" ("completedAt", "courseId", "createdAt", "enrolledAt", "id", "status", "updatedAt", "userId") SELECT "completedAt", "courseId", "createdAt", "enrolledAt", "id", "status", "updatedAt", "userId" FROM "Enrollment";
DROP TABLE "Enrollment";
ALTER TABLE "new_Enrollment" RENAME TO "Enrollment";
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
CREATE TABLE "new_ForumComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ForumComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ForumComment" ("authorId", "content", "createdAt", "id", "likes", "parentCommentId", "postId", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "likes", "parentCommentId", "postId", "updatedAt" FROM "ForumComment";
DROP TABLE "ForumComment";
ALTER TABLE "new_ForumComment" RENAME TO "ForumComment";
CREATE TABLE "new_ForumPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forumId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ForumPost_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ForumPost" ("authorId", "content", "createdAt", "forumId", "id", "isLocked", "isPinned", "likes", "title", "updatedAt", "viewCount") SELECT "authorId", "content", "createdAt", "forumId", "id", "isLocked", "isPinned", "likes", "title", "updatedAt", "viewCount" FROM "ForumPost";
DROP TABLE "ForumPost";
ALTER TABLE "new_ForumPost" RENAME TO "ForumPost";
CREATE TABLE "new_LearningMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricData" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LearningMetric" ("id", "metricData", "metricType", "timestamp", "userId") SELECT "id", "metricData", "metricType", "timestamp", "userId" FROM "LearningMetric";
DROP TABLE "LearningMetric";
ALTER TABLE "new_LearningMetric" RENAME TO "LearningMetric";
CREATE TABLE "new_MentorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "bio" TEXT,
    "specialties" TEXT,
    "experience" TEXT,
    "availability" TEXT,
    "hourlyRate" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MentorProfile" ("availability", "bio", "createdAt", "experience", "hourlyRate", "id", "isActive", "specialties", "updatedAt", "userId") SELECT "availability", "bio", "createdAt", "experience", "hourlyRate", "id", "isActive", "specialties", "updatedAt", "userId" FROM "MentorProfile";
DROP TABLE "MentorProfile";
ALTER TABLE "new_MentorProfile" RENAME TO "MentorProfile";
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "systemType" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "conversationId", "id", "isDeleted", "isRead", "isSystem", "senderId", "sentAt", "systemType", "updatedAt") SELECT "content", "conversationId", "id", "isDeleted", "isRead", "isSystem", "senderId", "sentAt", "systemType", "updatedAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "isRead", "linkUrl", "message", "relatedId", "relatedType", "title", "type", "userId") SELECT "createdAt", "id", "isRead", "linkUrl", "message", "relatedId", "relatedType", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Progress" ("completed", "completedAt", "createdAt", "id", "lessonId", "updatedAt", "userId") SELECT "completed", "completedAt", "createdAt", "id", "lessonId", "updatedAt", "userId" FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
CREATE UNIQUE INDEX "Progress_userId_lessonId_key" ON "Progress"("userId", "lessonId");
CREATE TABLE "new_ProjectSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "submissionUrl" TEXT,
    "submissionText" TEXT,
    "submissionFiles" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "grade" INTEGER,
    "feedback" TEXT,
    "reviewerId" INTEGER,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectSubmission" ("feedback", "grade", "id", "projectId", "reviewedAt", "reviewerId", "revisionCount", "status", "studentId", "submissionFiles", "submissionText", "submissionUrl", "submittedAt", "updatedAt") SELECT "feedback", "grade", "id", "projectId", "reviewedAt", "reviewerId", "revisionCount", "status", "studentId", "submissionFiles", "submissionText", "submissionUrl", "submittedAt", "updatedAt" FROM "ProjectSubmission";
DROP TABLE "ProjectSubmission";
ALTER TABLE "new_ProjectSubmission" RENAME TO "ProjectSubmission";
CREATE UNIQUE INDEX "ProjectSubmission_projectId_studentId_key" ON "ProjectSubmission"("projectId", "studentId");
CREATE TABLE "new_QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "feedbackGiven" TEXT,
    CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuizAttempt" ("completedAt", "feedbackGiven", "id", "isPassed", "quizId", "score", "startedAt", "userId") SELECT "completedAt", "feedbackGiven", "id", "isPassed", "quizId", "score", "startedAt", "userId" FROM "QuizAttempt";
DROP TABLE "QuizAttempt";
ALTER TABLE "new_QuizAttempt" RENAME TO "QuizAttempt";
CREATE TABLE "new_ShowcaseProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "repositoryUrl" TEXT,
    "demoUrl" TEXT,
    "studentId" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "submissionId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "tags" TEXT,
    "showcasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShowcaseProject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShowcaseProject_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShowcaseProject_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ShowcaseProject" ("category", "courseId", "createdAt", "demoUrl", "description", "featured", "id", "imageUrl", "repositoryUrl", "showcasedAt", "studentId", "submissionId", "tags", "title", "updatedAt", "viewCount") SELECT "category", "courseId", "createdAt", "demoUrl", "description", "featured", "id", "imageUrl", "repositoryUrl", "showcasedAt", "studentId", "submissionId", "tags", "title", "updatedAt", "viewCount" FROM "ShowcaseProject";
DROP TABLE "ShowcaseProject";
ALTER TABLE "new_ShowcaseProject" RENAME TO "ShowcaseProject";
CREATE TABLE "new_StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "interests" TEXT,
    "goals" TEXT,
    "preferredLearningStyle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "careerPathId" TEXT,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentProfile_careerPathId_fkey" FOREIGN KEY ("careerPathId") REFERENCES "CareerPath" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StudentProfile" ("careerPathId", "createdAt", "goals", "id", "interests", "preferredLearningStyle", "updatedAt", "userId") SELECT "careerPathId", "createdAt", "goals", "id", "interests", "preferredLearningStyle", "updatedAt", "userId" FROM "StudentProfile";
DROP TABLE "StudentProfile";
ALTER TABLE "new_StudentProfile" RENAME TO "StudentProfile";
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE TABLE "new_SubmissionResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubmissionResponse_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubmissionResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionResponse" ("content", "createdAt", "id", "isRead", "studentId", "submissionId", "updatedAt") SELECT "content", "createdAt", "id", "isRead", "studentId", "submissionId", "updatedAt" FROM "SubmissionResponse";
DROP TABLE "SubmissionResponse";
ALTER TABLE "new_SubmissionResponse" RENAME TO "SubmissionResponse";
CREATE UNIQUE INDEX "SubmissionResponse_submissionId_key" ON "SubmissionResponse"("submissionId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "bio" TEXT DEFAULT '',
    "location" TEXT DEFAULT '',
    "expertise" TEXT,
    "yearsOfExperience" INTEGER,
    "education" TEXT,
    "teachingPhilosophy" TEXT,
    "walletAddress" TEXT
);
INSERT INTO "new_User" ("bio", "createdAt", "education", "email", "emailVerified", "expertise", "hashedPassword", "id", "image", "level", "location", "name", "points", "role", "teachingPhilosophy", "updatedAt", "walletAddress", "yearsOfExperience") SELECT "bio", "createdAt", "education", "email", "emailVerified", "expertise", "hashedPassword", "id", "image", "level", "location", "name", "points", "role", "teachingPhilosophy", "updatedAt", "walletAddress", "yearsOfExperience" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserAchievement" ("achievementId", "earnedAt", "id", "userId") SELECT "achievementId", "earnedAt", "id", "userId" FROM "UserAchievement";
DROP TABLE "UserAchievement";
ALTER TABLE "new_UserAchievement" RENAME TO "UserAchievement";
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE TABLE "new_UserStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentXP" INTEGER NOT NULL DEFAULT 0,
    "nextLevelXP" INTEGER NOT NULL DEFAULT 100,
    "totalScholarshipAmount" INTEGER NOT NULL DEFAULT 0,
    "activeDiscounts" INTEGER NOT NULL DEFAULT 0,
    "completedCourses" INTEGER NOT NULL DEFAULT 0,
    "forumContributions" INTEGER NOT NULL DEFAULT 0,
    "mentorshipHours" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserStats" ("activeDiscounts", "completedCourses", "currentXP", "forumContributions", "id", "lastUpdated", "level", "mentorshipHours", "nextLevelXP", "totalScholarshipAmount", "userId") SELECT "activeDiscounts", "completedCourses", "currentXP", "forumContributions", "id", "lastUpdated", "level", "mentorshipHours", "nextLevelXP", "totalScholarshipAmount", "userId" FROM "UserStats";
DROP TABLE "UserStats";
ALTER TABLE "new_UserStats" RENAME TO "UserStats";
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");
CREATE TABLE "new__MessageReadBy" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_MessageReadBy_A_fkey" FOREIGN KEY ("A") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MessageReadBy_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__MessageReadBy" ("A", "B") SELECT "A", "B" FROM "_MessageReadBy";
DROP TABLE "_MessageReadBy";
ALTER TABLE "new__MessageReadBy" RENAME TO "_MessageReadBy";
CREATE UNIQUE INDEX "_MessageReadBy_AB_unique" ON "_MessageReadBy"("A", "B");
CREATE INDEX "_MessageReadBy_B_index" ON "_MessageReadBy"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
