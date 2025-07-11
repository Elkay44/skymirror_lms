-- CreateTable
CREATE TABLE "CourseApprovalHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "reviewerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseApprovalHistory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseApprovalHistory_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CourseApprovalHistory_courseId_idx" ON "CourseApprovalHistory"("courseId");

-- CreateIndex
CREATE INDEX "CourseApprovalHistory_reviewerId_idx" ON "CourseApprovalHistory"("reviewerId");
