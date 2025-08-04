-- CreateTable
CREATE TABLE "code_commits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "commitHash" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "repositoryUrl" TEXT,
    "filesChanged" INTEGER NOT NULL DEFAULT 0,
    "linesAdded" INTEGER NOT NULL DEFAULT 0,
    "linesDeleted" INTEGER NOT NULL DEFAULT 0,
    "commitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "code_commits_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "code_commits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submissionId" TEXT,
    "grade" REAL NOT NULL,
    "letterGrade" TEXT,
    "feedback" TEXT,
    "rubricScores" TEXT,
    "markedBy" TEXT NOT NULL,
    "markedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_marks_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_marks_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "project_submissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "project_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_marks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_invitations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "code_commits_projectId_idx" ON "code_commits"("projectId");

-- CreateIndex
CREATE INDEX "code_commits_studentId_idx" ON "code_commits"("studentId");

-- CreateIndex
CREATE INDEX "code_commits_commitDate_idx" ON "code_commits"("commitDate");

-- CreateIndex
CREATE UNIQUE INDEX "code_commits_projectId_studentId_commitHash_key" ON "code_commits"("projectId", "studentId", "commitHash");

-- CreateIndex
CREATE INDEX "project_marks_projectId_idx" ON "project_marks"("projectId");

-- CreateIndex
CREATE INDEX "project_marks_studentId_idx" ON "project_marks"("studentId");

-- CreateIndex
CREATE INDEX "project_marks_markedBy_idx" ON "project_marks"("markedBy");

-- CreateIndex
CREATE INDEX "project_marks_markedAt_idx" ON "project_marks"("markedAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_marks_projectId_studentId_key" ON "project_marks"("projectId", "studentId");

-- CreateIndex
CREATE INDEX "course_invitations_courseId_idx" ON "course_invitations"("courseId");

-- CreateIndex
CREATE INDEX "course_invitations_email_idx" ON "course_invitations"("email");

-- CreateIndex
CREATE INDEX "course_invitations_status_idx" ON "course_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "course_invitations_email_courseId_key" ON "course_invitations"("email", "courseId");
