import { PrismaClient } from '@prisma/client';

// Base model type with common CRUD operations
type BaseModel<T = any> = {
  findMany: (args?: {
    where?: any;
    include?: any;
    select?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }) => Promise<T[]>;
  findUnique: (args: { 
    where: { id: string } | { [key: string]: any };
    include?: any;
    select?: any;
  }) => Promise<T | null>;
  findFirst: (args?: { 
    where?: any;
    include?: any;
    select?: any;
  }) => Promise<T | null>;
  create: (args: { 
    data: any;
    include?: any;
    select?: any;
  }) => Promise<T>;
  update: (args: { 
    where: { id: string } | { [key: string]: any }; 
    data: any;
    include?: any;
  }) => Promise<T>;
  updateMany: (args: { where: any; data: any }) => Promise<{ count: number }>;
  delete: (args: { where: { id: string } | { [key: string]: any } }) => Promise<T>;
  count: (args?: any) => Promise<number>;
  deleteMany?: (args?: any) => Promise<{ count: number }>;
  upsert?: (args: { 
    where: any; 
    create: any; 
    update: any;
    include?: any;
  }) => Promise<T>;
  [key: string]: any; // Allow additional methods
};

// Mentor session type
type MentorSession = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: Date;
  duration: number;
  mentorId: string;
  menteeId: string;
  meetingUrl: string | null;
  meetingLink: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  mentor?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  mentee?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

// CheckIn type
type CheckIn = {
  id: string;
  mentorshipId: string;
  scheduledFor: Date;
  completedAt: Date | null;
  summary: string | null;
  nextSteps: string | null;
  progress: string | null;
  mood: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Mentorship type
type Mentorship = {
  id: string;
  mentorId: string;
  studentId: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  checkIns: CheckIn[];
};

// Rubric types
type RubricItem = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  order: number;
  rubricId: string;
  criteria: RubricCriteria[];
  createdAt: Date;
  updatedAt: Date;
};

type RubricCriteria = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  levels: RubricCriteriaLevel[];
  rubricItemId: string;
  createdAt: Date;
  updatedAt: Date;
};

type RubricCriteriaLevel = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  criteriaId: string;
  createdAt: Date;
  updatedAt: Date;
};

type Rubric = {
  id: string;
  title: string;
  description: string | null;
  isDefault: boolean;
  items: RubricItem[];
  assignments: Assignment[];
  createdAt: Date;
  updatedAt: Date;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  points: number;
  rubricId: string | null;
  moduleId: string;
  createdAt: Date;
  updatedAt: Date;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      instructorId: string;
    };
  } | null;
};

// Extended Prisma client type
export type ExtendedPrismaClient = PrismaClient & {
  // Custom transaction method with extended client type
  $transaction: <T>(
    fn: (prisma: ExtendedPrismaClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number }
  ) => Promise<T>;

  // Add your custom models here
  mentorSession: BaseModel<MentorSession> & {
    // Add any custom methods specific to mentorSession
    findUpcomingSessions: (mentorId: string) => Promise<MentorSession[]>;
  };

  // Add other Prisma models
  assignment: BaseModel<Assignment>;
  course: BaseModel<any>;
  user: BaseModel<any>;
  submission: BaseModel<any>;
  quiz: BaseModel<any>;
  enrollment: BaseModel<any>;
  lesson: BaseModel<any>;
  conversationParticipant: BaseModel<any>;
  conversation: BaseModel<any>;
  message: BaseModel<any>;
  projectSubmission: BaseModel<any>;
  rubric: BaseModel<Rubric> & {
    findWithItems: (id: string) => Promise<Rubric | null>;
  };
  rubricItem: BaseModel<RubricItem>;
  rubricCriteria: BaseModel<RubricCriteria>;
  rubricCriteriaLevel: BaseModel<RubricCriteriaLevel>;
  portfolioSetting: BaseModel<{
    id: string;
    userId: string;
    projectId: string | null;
    isVisible: boolean;
    featured: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> & {
    upsert: (args: {
      where: { userId: string };
      update: { isVisible: boolean };
      create: { userId: string; isVisible: boolean; projectId?: string | null; featured?: boolean };
    }) => Promise<{
      id: string;
      userId: string;
      projectId: string | null;
      isVisible: boolean;
      featured: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  skill: BaseModel<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }> & {
    upsert: (args: {
      where: { name: string };
      create: { name: string };
      update: {};
    }) => Promise<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  review: BaseModel<any>;
  lessonProgress: BaseModel<any>;
  projectLike: BaseModel<any>;
  courseVersion: BaseModel<any>;
  lessonView: BaseModel<{
    id: string;
    lessonId: string;
    userId: string;
    viewCount: number;
    lastViewed: Date;
    lesson: {
      id: string;
      title: string;
      module: {
        id: string;
        title: string;
        course: {
          id: string;
          title: string;
        };
      };
    };
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>;
  courseApprovalHistory: BaseModel<any> & {
    deleteMany: (args: { where: { courseId: string } }) => Promise<{ count: number }>;
    findFirst: (args?: any) => Promise<any>;
    create: (args: { data: any }) => Promise<any>;
  };
  note: BaseModel<any> & {
    findMany: (args: { 
      where: { 
        lessonId: string; 
        userId: string;
      };
      include?: any;
    }) => Promise<Array<{
      id: string;
      content: string;
      userId: string;
      lessonId: string;
      createdAt: Date;
      updatedAt: Date;
    }>>;
  };
  activityLog: BaseModel<any> & {
    create: (args: {
      data: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        details?: any;
      }
    }) => Promise<any>;
  };
  page: BaseModel<{
    id: string;
    title: string;
    content: string | null;
    description: string | null;
    moduleId: string;
    isPublished: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    module: {
      id: string;
      title: string;
      courseId: string;
    };
  }>;

  project: BaseModel<any> & {
    findMany: (args: {
      where: { moduleId: string };
      include: {
        _count: {
          select: { submissions: boolean };
        };
        submissions?: {
          where: { userId: string };
          select: { status: boolean };
        };
      };
    }) => Promise<Array<{
      id: string;
      title: string;
      description: string;
      moduleId: string;
      dueDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
      _count: { submissions: number };
      submissions?: Array<{ status: string }>;
    }>>;
  };
  module: BaseModel<any> & {
    findFirst: (args: {
      where: {
        id?: string;
        courseId: string;
        [key: string]: any;
      };
      include?: {
        course?: boolean;
        [key: string]: any;
      };
      orderBy?: {
        [key: string]: 'asc' | 'desc';
      };
    }) => Promise<{
      id: string;
      title: string;
      description: string | null;
      courseId: string;
      order: number;
      course?: {
        id: string;
        title: string;
        instructorId: string;
      };
    } | null>;
  };
  projectResource: BaseModel<any> & {
    create: (args: {
      data: {
        title: string;
        url: string;
        type: string;
        projectId: string;
      };
    }) => Promise<{
      id: string;
      title: string;
      url: string;
      type: string;
      projectId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  quizAttempt: BaseModel<any> & {
    findMany: (args: {
      where: {
        quizId: string;
        userId: number;
      };
      orderBy: {
        createdAt: 'desc';
      };
      take: number;
    }) => Promise<Array<{
      id: string;
      score: number | null;
      completedAt: Date | null;
      status: string;
      answers: any[];
    }>>;
  };
  forum: BaseModel<any> & {
    findMany: (args: {
      where: {
        moduleId: string;
      };
      include: {
        _count: {
          select: { posts: boolean };
        };
        latestPost: {
          select: {
            createdAt: boolean;
            author: {
              select: { name: boolean; image: boolean };
            };
          };
        };
      };
      orderBy: {
        updatedAt: 'desc';
      };
    }) => Promise<Array<{
      id: string;
      title: string;
      description: string | null;
      moduleId: string;
      createdAt: Date;
      updatedAt: Date;
      _count: { posts: number };
      latestPost: {
        createdAt: Date;
        author: {
          name: string | null;
          image: string | null;
        };
      } | null;
    }>>;
  };
  userAnswer: BaseModel<any> & {
    create: (args: {
      data: {
        attemptId: string;
        questionId: string;
        selectedOptionId?: string;
        textAnswer?: string;
        isCorrect: boolean;
      };
    }) => Promise<{
      id: string;
      attemptId: string;
      questionId: string;
      selectedOptionId: string | null;
      textAnswer: string | null;
      isCorrect: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  notification: BaseModel<any> & {
    create: (args: {
      data: {
        userId: string;
        title: string;
        message: string;
        type: string;
        read: boolean;
        link?: string;
      };
    }) => Promise<{
      id: string;
      userId: string;
      title: string;
      message: string;
      type: string;
      read: boolean;
      link: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  question: BaseModel<any> & {
    create: (args: {
      data: {
        questionText: string;
        questionType: string;
        points: number;
        quizId: string;
        options?: {
          create: Array<{
            optionText: string;
            isCorrect: boolean;
          }>;
        };
      };
      include?: {
        options: boolean;
      };
    }) => Promise<{
      id: string;
      questionText: string;
      questionType: string;
      points: number;
      quizId: string;
      options?: Array<{
        id: string;
        optionText: string;
        isCorrect: boolean;
      }>;
    }>;
  };
  questionOption: BaseModel<any> & {
    create: (args: {
      data: {
        optionText: string;
        position: number;
        isCorrect: boolean;
        questionId: string;
      };
    }) => Promise<{
      id: string;
      optionText: string;
      position: number;
      isCorrect: boolean;
      questionId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  learningGoal: BaseModel<any> & {
    findUnique: (args: {
      where: {
        id: string;
        userId: number;
      };
    }) => Promise<{
      id: string;
      title: string;
      description: string | null;
      targetDate: Date | null;
      status: string;
      priority: string;
      userId: string;
      courseId: string | null;
      moduleId: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
  };
  menteeNotes: BaseModel<any> & {
    upsert: (args: {
      where: {
        menteeId_mentorId: {
          menteeId: string;
          mentorId: string;
        };
      };
      create: {
        menteeId: string;
        mentorId: string;
        notes: string;
      };
      update: {
        notes: string;
      };
    }) => Promise<{
      id: string;
      menteeId: string;
      mentorId: string;
      notes: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  // Mentorship model
  mentorship: BaseModel<Mentorship> & {
    findMany: (args: {
      where: {
        student?: {
          userId: string;
        };
        status?: string;
      };
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: boolean;
                name: boolean;
                email: boolean;
                image: boolean;
              };
            };
          };
        };
        checkIns: {
          where?: {
            scheduledFor?: {
              gte?: Date;
            };
          };
          orderBy: {
            scheduledFor: 'asc' | 'desc';
          };
          take?: number;
        };
      };
    }) => Promise<Array<Mentorship & {
      mentor: any;
      checkIns: CheckIn[];
    }>>;
  };
  
  // CheckIn model
  checkIn: BaseModel<CheckIn> & {
    findMany: (args: {
      where: {
        mentorshipId: string;
        scheduledFor?: {
          gte?: Date;
        };
      };
      orderBy: {
        scheduledFor: 'asc' | 'desc';
      };
      take?: number;
    }) => Promise<CheckIn[]>;
  };
  
  // Add other models as needed
};

// Global prisma instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: ExtendedPrismaClient | undefined;
}

// Create or reuse the Prisma client
const prisma: ExtendedPrismaClient = global.prisma || (() => {
  const client = new PrismaClient() as unknown as ExtendedPrismaClient;
  
  // Add any custom methods or extensions here
  client.mentorSession = {
    ...client.mentorSession,
    async findUpcomingSessions(mentorId: string) {
      return client.mentorSession.findMany({
        where: {
          mentorId,
          scheduledAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    },
  } as any;

  // Add mentorship model implementation
  client.mentorship = {
    ...(client as any).mentorship,
    async findMany(args: any) {
      return (client as any).$queryRaw`
        SELECT m.*, 
               json_build_object(
                 'user', json_build_object(
                   'id', u.id,
                   'name', u.name,
                   'email', u.email,
                   'image', u.image
                 )
               ) as mentor,
               (
                 SELECT json_agg(ci.* ORDER BY ci."scheduledFor" ASC)
                 FROM "CheckIn" ci
                 WHERE ci."mentorshipId" = m.id
                 AND ci."scheduledFor" >= NOW()
                 LIMIT 1
               ) as "checkIns"
        FROM "Mentorship" m
        JOIN "MentorProfile" mp ON m."mentorId" = mp.id
        JOIN "User" u ON mp."userId" = u.id
        WHERE m."studentId" = ${args.where.student.userId}
        AND m.status = ${args.where.status || 'ACTIVE'}
        ORDER BY m."createdAt" DESC
      `;
    },
  } as any;

  // Add checkIn model implementation
  client.checkIn = {
    ...(client as any).checkIn,
    async findMany(args: any) {
      const whereClause = args.where.mentorshipId 
        ? `WHERE "mentorshipId" = '${args.where.mentorshipId}'` 
        : '';
      
      const dateFilter = args.where.scheduledFor?.gte 
        ? `${whereClause ? 'AND' : 'WHERE'} "scheduledFor" >= '${args.where.scheduledFor.gte.toISOString()}'` 
        : '';
      
      const orderBy = args.orderBy?.scheduledFor === 'asc' ? 'ASC' : 'DESC';
      const limit = args.take ? `LIMIT ${args.take}` : '';
      
      return (client as any).$queryRaw`
        SELECT * FROM "CheckIn"
        ${whereClause} ${dateFilter}
        ORDER BY "scheduledFor" ${orderBy}
        ${limit}
      `;
    },
  } as any;

  return client;
})();

// In development, store the prisma client in the global object
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
