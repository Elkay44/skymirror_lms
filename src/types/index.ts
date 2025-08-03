
export interface ModuleWithLessons {
  id: string;
  title: string;
  lessons: Array<{
    id: string;
    progress: Array<{
      status: string;
    }>;
  }>;
  quizzes: Array<{
    id: string;
    passingScore: number;
    attempts: Array<{
      score: number;
    }>;
  }>;
}

export interface ProgressUpdateData {
  enrollmentId: string;
  lessonId?: string;
  quizId?: string;
  score?: number;
}
