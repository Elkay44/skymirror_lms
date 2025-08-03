import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFromCache, setCache } from '@/lib/cache';
import { z } from 'zod';
import { paginatedResponse, CommonErrors } from '@/lib/api-response';
import { withErrorHandling } from '@/lib/api-response';

// Search query schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  type: z.enum(['all', 'courses', 'lessons', 'modules', 'instructors', 'discussions']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  filters: z.object({
    category: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    isFree: z.enum(['yes', 'no']).optional(),
    featured: z.enum(['yes', 'no']).optional(),
    hasCertificate: z.enum(['yes', 'no']).optional(),
    duration: z.enum(['short', 'medium', 'long']).optional(),
  }).optional(),
  sort: z.enum([
    'relevance',
    'newest',
    'oldest',
    'popular',
    'highestRated',
    'priceAsc',
    'priceDesc'
  ]).default('relevance'),
  includePrivate: z.enum(['yes', 'no']).default('no'),
});

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = {
      q: url.searchParams.get('q') || '',
      type: url.searchParams.get('type') as any || 'all',
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '10'),
      filters: {
        category: url.searchParams.get('category') || undefined,
        level: url.searchParams.get('level') as any || undefined,
        language: url.searchParams.get('language') || undefined,
        minRating: url.searchParams.get('minRating') ? parseFloat(url.searchParams.get('minRating') || '0') : undefined,
        maxPrice: url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice') || '0') : undefined,
        isFree: url.searchParams.get('isFree') as any || undefined,
        featured: url.searchParams.get('featured') as any || undefined,
        hasCertificate: url.searchParams.get('hasCertificate') as any || undefined,
        duration: url.searchParams.get('duration') as any || undefined,
      },
      sort: url.searchParams.get('sort') as any || 'relevance',
      includePrivate: url.searchParams.get('includePrivate') as any || 'no'
    };
    
    const parsedQuery = searchQuerySchema.safeParse(queryParams);
    if (!parsedQuery.success) {
      return CommonErrors.validation('Invalid search parameters', parsedQuery.error.format());
    }
    
    const { q, type, page, limit, filters, sort, includePrivate } = parsedQuery.data;
    
    // Check if user can see private content
    const canSeePrivate = includePrivate === 'yes' && (session?.user?.role === 'admin' || session?.user?.role === 'instructor');
    
    // Try to get from cache for public searches
    const cacheKey = `search:${q}:${type}:${page}:${limit}:${JSON.stringify(filters)}:${sort}:${includePrivate}`;
    if (includePrivate === 'no') {
      const cachedResults = await getFromCache<{data: any[], total: number}>('search', cacheKey);
      if (cachedResults) {
        return paginatedResponse(
          cachedResults.data, 
          page, 
          limit, 
          cachedResults.total,
          'Search results retrieved from cache',
          { query: q, type, filters }
        );
      }
    }
    
    // Initialize results arrays
    let coursesResults: any[] = [];
    let lessonsResults: any[] = [];
    let modulesResults: any[] = [];
    let instructorsResults: any[] = [];
    let discussionsResults: any[] = [];
    let total = 0;
    
    // Build base search conditions
    const baseSearchCondition = {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    };
    
    // Perform search based on type
    if (type === 'all' || type === 'courses') {
      const courseWhereClause: any = {
        ...baseSearchCondition,
        isPublished: true,
        ...(!canSeePrivate ? { isPrivate: false } : {}),
      };
      
      // Apply filters for courses
      if (filters) {
        if (filters.category) courseWhereClause.category = filters.category;
        if (filters.level) courseWhereClause.level = filters.level;
        if (filters.language) courseWhereClause.language = filters.language;
        if (filters.minRating) courseWhereClause.rating = { gte: filters.minRating };
        if (filters.maxPrice) courseWhereClause.price = { lte: filters.maxPrice };
        if (filters.isFree === 'yes') courseWhereClause.price = 0;
        if (filters.featured === 'yes') courseWhereClause.featured = true;
      }
      
      // Determine sorting
      let courseOrderBy: any = {};
      switch (sort) {
        case 'newest': courseOrderBy = { createdAt: 'desc' }; break;
        case 'oldest': courseOrderBy = { createdAt: 'asc' }; break;
        case 'popular': courseOrderBy = { enrollmentCount: 'desc' }; break;
        case 'highestRated': courseOrderBy = { rating: 'desc' }; break;
        case 'priceAsc': courseOrderBy = { price: 'asc' }; break;
        case 'priceDesc': courseOrderBy = { price: 'desc' }; break;
        default: courseOrderBy = { _relevance: { fields: ['title', 'description'], search: q, sort: 'desc' } };
      }
      
      // Get courses
      const [courses, courseCount] = await Promise.all([
        prisma.course.findMany({
          where: courseWhereClause,
          orderBy: courseOrderBy as any,
          skip: type === 'all' ? 0 : (page - 1) * limit,
          take: type === 'all' ? 5 : limit,
          select: {
            id: true,
            title: true,
            description: true,
            shortDescription: true,
            language: true,
            price: true,
            // Using only fields that exist in the schema
            isPublished: true,
            isPrivate: true,
            createdAt: true,
            updatedAt: true,
            instructor: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }),
        prisma.course.count({ where: courseWhereClause })
      ]);
      
      coursesResults = courses;
      if (type === 'courses') total = courseCount;
    }
    
    if (type === 'all' || type === 'lessons') {
      const lessonWhereClause: any = {
        ...baseSearchCondition,
        module: {
          course: {
            isPublished: true,
            ...(!canSeePrivate ? { isPrivate: false } : {})
          }
        }
      };
      
      // Get lessons
      const [lessons, lessonCount] = await Promise.all([
        prisma.lesson.findMany({
          where: lessonWhereClause,
          orderBy: (sort === 'newest' ? { createdAt: 'desc' } : 
                  sort === 'oldest' ? { createdAt: 'asc' } : 
                  { _relevance: { fields: ['title', 'description'], search: q, sort: 'desc' } }) as any,
          skip: type === 'all' ? 0 : (page - 1) * limit,
          take: type === 'all' ? 5 : limit,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            duration: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    instructor: {
                      select: {
                        id: true,
                        name: true,
                        image: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.lesson.count({ where: lessonWhereClause })
      ]);
      
      lessonsResults = lessons;
      if (type === 'lessons') total = lessonCount;
    }
    
    if (type === 'all' || type === 'modules') {
      const moduleWhereClause: any = {
        ...baseSearchCondition,
        course: {
          isPublished: true,
          ...(!canSeePrivate ? { isPrivate: false } : {})
        }
      };
      
      // Get modules
      const [modules, moduleCount] = await Promise.all([
        prisma.module.findMany({
          where: moduleWhereClause,
          orderBy: (sort === 'newest' ? { createdAt: 'desc' } : 
                  sort === 'oldest' ? { createdAt: 'asc' } : 
                  { _relevance: { fields: ['title', 'description'], search: q, sort: 'desc' } }) as any,
          skip: type === 'all' ? 0 : (page - 1) * limit,
          take: type === 'all' ? 5 : limit,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            course: {
              select: {
                id: true,
                title: true,
                instructor: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            },
            _count: {
              select: {
                lessons: true
              }
            }
          }
        }),
        prisma.module.count({ where: moduleWhereClause })
      ]);
      
      modulesResults = modules;
      if (type === 'modules') total = moduleCount;
    }
    
    if (type === 'all' || type === 'instructors') {
      // Get instructors
      const instructorWhereClause: any = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
          { expertise: { has: q } }
        ],
        role: 'instructor',
        ...(filters?.minRating ? { rating: { gte: filters.minRating } } : {})
      };
      
      const [instructors, instructorCount] = await Promise.all([
        prisma.user.findMany({
          where: instructorWhereClause,
          orderBy: (sort === 'highestRated' ? { createdAt: 'desc' } : // Changed from rating since it doesn't exist
                  sort === 'popular' ? { createdAt: 'desc' } : // Changed from _count since it's problematic
                  { _relevance: { fields: ['name', 'bio'], search: q, sort: 'desc' } }) as any,
          skip: type === 'all' ? 0 : (page - 1) * limit,
          take: type === 'all' ? 5 : limit,
          select: {
            id: true,
            name: true,
            bio: true,
            image: true,
            expertise: true,
            createdAt: true,
            _count: true // Using simpler count selection
          }
        }),
        prisma.user.count({ where: instructorWhereClause })
      ]);
      
      instructorsResults = instructors;
      if (type === 'instructors') total = instructorCount;
    }
    
    if (type === 'all' || type === 'discussions') {
      // Get discussions
      const discussionWhereClause: any = {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } }
        ],
        course: {
          isPublished: true,
          ...(!canSeePrivate ? { isPrivate: false } : {})
        }
      };
      
      const [discussions, discussionCount] = await Promise.all([
        (prisma as any).discussion.findMany({
          where: discussionWhereClause,
          orderBy: (sort === 'newest' ? { createdAt: 'desc' } : 
                  sort === 'popular' ? { createdAt: 'desc' } : 
                  { _relevance: { fields: ['title', 'content'], search: q, sort: 'desc' } }) as any,
          skip: type === 'all' ? 0 : (page - 1) * limit,
          take: type === 'all' ? 5 : limit,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            course: {
              select: {
                id: true,
                title: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            _count: {
              select: {
                comments: true
              }
            }
          }
        }),
        (prisma as any).discussion.count({ where: discussionWhereClause })
      ]);
      
      discussionsResults = discussions;
      if (type === 'discussions') total = discussionCount;
    }
    
    // Combine results for 'all' type
    let results: any = [];
    if (type === 'all') {
      results = [
        ...coursesResults.map(item => ({ ...item, resultType: 'course' })),
        ...lessonsResults.map(item => ({ ...item, resultType: 'lesson' })),
        ...modulesResults.map(item => ({ ...item, resultType: 'module' })),
        ...instructorsResults.map(item => ({ ...item, resultType: 'instructor' })),
        ...discussionsResults.map(item => ({ ...item, resultType: 'discussion' }))
      ];
      
      // Calculate the total for 'all' type using individual counts
      const [courseCount, lessonCount, moduleCount, instructorCount, discussionCount] = await Promise.all([
        Promise.resolve(await prisma.course.count({ where: { ...baseSearchCondition, isPublished: true, ...(!canSeePrivate ? { isPrivate: false } : {}) } })),
        Promise.resolve(await prisma.lesson.count({ where: { ...baseSearchCondition, module: { course: { isPublished: true, ...(!canSeePrivate ? { isPrivate: false } : {}) } } } })),
        Promise.resolve(await prisma.module.count({ where: { ...baseSearchCondition, course: { isPublished: true, ...(!canSeePrivate ? { isPrivate: false } : {}) } } })),
        Promise.resolve(await prisma.user.count({ where: { OR: [{ name: { contains: q } }, { bio: { contains: q } }], role: 'instructor' } })),
        Promise.resolve(await (prisma as any).discussion.count({ where: { OR: [{ title: { contains: q } }, { content: { contains: q } }], course: { isPublished: true, ...(!canSeePrivate ? { isPrivate: false } : {}) } } }))
      ]);
      
      // Sum all counts
      total = courseCount + lessonCount + moduleCount + instructorCount + discussionCount;
      
      // Sort combined results based on sort parameter
      switch (sort) {
        case 'newest':
          results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          results.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'popular':
          results.sort((a: any, b: any) => {
            const aPopularity = a.resultType === 'course' ? a.enrollmentCount : 
                                a.resultType === 'instructor' ? a._count?.courses || 0 :
                                a.resultType === 'discussion' ? a._count?.comments || 0 : 0;
            const bPopularity = b.resultType === 'course' ? b.enrollmentCount : 
                                b.resultType === 'instructor' ? b._count?.courses || 0 :
                                b.resultType === 'discussion' ? b._count?.comments || 0 : 0;
            return bPopularity - aPopularity;
          });
          break;
        // Additional sorting options would be implemented here
      }
      
      // Apply pagination to combined results
      results = results.slice((page - 1) * limit, page * limit);
    } else {
      // Type-specific results
      switch (type) {
        case 'courses': results = coursesResults; break;
        case 'lessons': results = lessonsResults; break;
        case 'modules': results = modulesResults; break;
        case 'instructors': results = instructorsResults; break;
        case 'discussions': results = discussionsResults; break;
      }
    }
    
    
    // Cache the results for public searches
    if (includePrivate === 'no') {
      await setCache('search', cacheKey, {
        data: results,
        total
      }, 3600); // Cache for 1 hour
    }
    
    return paginatedResponse(results, page, limit, total, 'Search results', { query: q, type, filters });
  }, 'Error performing search');
}
