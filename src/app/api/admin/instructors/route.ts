import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getOrSetCache, invalidateCache, CACHE_TTL } from '@/lib/cache';

// Schema for instructor query parameters
const instructorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'courseCount', 'studentCount', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE', 'PENDING']).default('ALL'),
});

// Schema for updating instructor status or permissions
const updateInstructorSchema = z.object({
  instructorIds: z.array(z.number()),
  action: z.enum(['approve', 'reject', 'suspend', 'activate', 'set-permissions']),
  permissions: z.object({
    canCreateCourses: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    maxCourseCount: z.number().int().min(0).optional(),
    maxStorageBytes: z.number().int().min(0).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
  }).optional(),
  notes: z.string().optional(),
});

// Dynamic route to ensure data is not cached
export const dynamic = 'force-dynamic';

// GET /api/admin/instructors - Get all instructors with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, sortBy, sortOrder, status } = instructorQuerySchema.parse(searchParams);
    
    // Calculate pagination offsets
    const skip = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause: any = {
      role: 'INSTRUCTOR'
    };
    
    if (status !== 'ALL') {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Build order by clause
    let orderBy: any = {};
    
    switch (sortBy) {
      case 'name':
      case 'email':
      case 'createdAt':
        orderBy[sortBy] = sortOrder;
        break;
      case 'courseCount':
        orderBy = {
          courses: {
            _count: sortOrder
          }
        };
        break;
      case 'studentCount':
        // This is more complex as we need to count unique students across all courses
        // We'll handle this in a post-processing step
        orderBy = { name: sortOrder }; // Default ordering for now
        break;
      default:
        orderBy = { name: 'asc' };
    }
    
    // Use cache for this query as it can be expensive
    const cacheKey = {
      page,
      limit,
      search: search || '',
      sortBy,
      sortOrder,
      status
    };
    
    // Use getOrSetCache to fetch from cache or database
    const result = await getOrSetCache(
      'user',
      cacheKey,
      async () => {
        // Get total count for pagination
        const totalCount = await prisma.user.count({
          where: whereClause
        });
        
        // Fetch instructors
        const instructors = await prisma.user.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            updatedAt: true,
            bio: true,
            status: true,
            instructorProfile: true,
            _count: {
              select: {
                courses: true
              }
            },
            courses: {
              select: {
                _count: {
                  select: {
                    enrollments: true
                  }
                }
              }
            }
          }
        });
        
        // Transform instructor data and calculate student counts
        const transformedInstructors = instructors.map(instructor => {
          // Calculate total student count (with potential duplicates across courses)
          const totalStudents = instructor.courses.reduce((sum, course) => {
            return sum + course._count.enrollments;
          }, 0);
          
          return {
            id: instructor.id,
            name: instructor.name,
            email: instructor.email,
            image: instructor.image,
            bio: instructor.bio || '',
            createdAt: instructor.createdAt,
            updatedAt: instructor.updatedAt,
            status: instructor.status || 'ACTIVE',
            courseCount: instructor._count.courses,
            studentCount: totalStudents,
            permissions: instructor.instructorProfile ? {
              canCreateCourses: instructor.instructorProfile.canCreateCourses,
              requiresApproval: instructor.instructorProfile.requiresApproval,
              maxCourseCount: instructor.instructorProfile.maxCourseCount,
              maxStorageBytes: instructor.instructorProfile.maxStorageBytes,
              commissionRate: instructor.instructorProfile.commissionRate
            } : {
              canCreateCourses: true,
              requiresApproval: true,
              maxCourseCount: null,
              maxStorageBytes: null,
              commissionRate: 70 // Default 70% goes to instructor, 30% to platform
            }
          };
        });
        
        // Handle the special case of sorting by studentCount
        if (sortBy === 'studentCount') {
          transformedInstructors.sort((a, b) => {
            return sortOrder === 'asc'
              ? a.studentCount - b.studentCount
              : b.studentCount - a.studentCount;
          });
        }
        
        return {
          instructors: transformedInstructors,
          pagination: {
            page,
            limit,
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: page * limit < totalCount
          },
          filters: {
            search: search || null,
            sortBy,
            sortOrder,
            status
          }
        };
      },
      CACHE_TTL.SHORT
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET_INSTRUCTORS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/instructors - Update instructor status or permissions
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const { instructorIds, action, permissions, notes } = updateInstructorSchema.parse(body);
    
    // Process updates based on action
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const instructorId of instructorIds) {
      try {
        // Verify that the user exists and is an instructor
        const instructor = await prisma.user.findUnique({
          where: { id: instructorId },
          select: { role: true, instructorProfile: { select: { id: true } } }
        });
        
        if (!instructor) {
          results.failed++;
          results.errors.push(`User with ID ${instructorId} not found`);
          continue;
        }
        
        if (instructor.role !== 'INSTRUCTOR') {
          results.failed++;
          results.errors.push(`User with ID ${instructorId} is not an instructor`);
          continue;
        }
        
        switch (action) {
          case 'approve':
            // Approve a pending instructor
            await prisma.user.update({
              where: { id: instructorId },
              data: { status: 'ACTIVE' }
            });
            
            // Create or update instructor profile
            await prisma.instructorProfile.upsert({
              where: { userId: instructorId },
              update: { isApproved: true },
              create: {
                userId: instructorId,
                isApproved: true,
                canCreateCourses: true,
                requiresApproval: true
              }
            });
            
            // Create notification for the instructor
            await prisma.notification.create({
              data: {
                userId: instructorId,
                title: 'Instructor Application Approved',
                message: 'Your application to become an instructor has been approved. You can now create courses.',
                type: 'ACCOUNT'
              }
            });
            
            break;
            
          case 'reject':
            // Reject a pending instructor
            await prisma.user.update({
              where: { id: instructorId },
              data: { status: 'REJECTED' }
            });
            
            // Create or update instructor profile
            await prisma.instructorProfile.upsert({
              where: { userId: instructorId },
              update: { isApproved: false },
              create: {
                userId: instructorId,
                isApproved: false,
                canCreateCourses: false,
                requiresApproval: true
              }
            });
            
            // Create notification for the instructor
            await prisma.notification.create({
              data: {
                userId: instructorId,
                title: 'Instructor Application Rejected',
                message: notes || 'Your application to become an instructor has been rejected.',
                type: 'ACCOUNT'
              }
            });
            
            break;
            
          case 'suspend':
            // Suspend an active instructor
            await prisma.user.update({
              where: { id: instructorId },
              data: { status: 'INACTIVE' }
            });
            
            // Update instructor profile
            if (instructor.instructorProfile) {
              await prisma.instructorProfile.update({
                where: { userId: instructorId },
                data: { canCreateCourses: false }
              });
            }
            
            // Create notification for the instructor
            await prisma.notification.create({
              data: {
                userId: instructorId,
                title: 'Account Suspended',
                message: notes || 'Your instructor account has been suspended. Please contact support for more information.',
                type: 'ACCOUNT'
              }
            });
            
            break;
            
          case 'activate':
            // Activate a suspended instructor
            await prisma.user.update({
              where: { id: instructorId },
              data: { status: 'ACTIVE' }
            });
            
            // Update instructor profile
            if (instructor.instructorProfile) {
              await prisma.instructorProfile.update({
                where: { userId: instructorId },
                data: { canCreateCourses: true }
              });
            } else {
              await prisma.instructorProfile.create({
                data: {
                  userId: instructorId,
                  isApproved: true,
                  canCreateCourses: true,
                  requiresApproval: true
                }
              });
            }
            
            // Create notification for the instructor
            await prisma.notification.create({
              data: {
                userId: instructorId,
                title: 'Account Activated',
                message: 'Your instructor account has been activated. You can now create courses.',
                type: 'ACCOUNT'
              }
            });
            
            break;
            
          case 'set-permissions':
            // Update instructor permissions
            if (!permissions) {
              results.failed++;
              results.errors.push(`Permissions are required for instructor ID ${instructorId} when setting permissions`);
              continue;
            }
            
            // Create or update instructor profile with new permissions
            await prisma.instructorProfile.upsert({
              where: { userId: instructorId },
              update: {
                ...permissions
              },
              create: {
                userId: instructorId,
                isApproved: true,
                ...permissions,
                // Set defaults for any missing values
                canCreateCourses: permissions.canCreateCourses ?? true,
                requiresApproval: permissions.requiresApproval ?? true,
                maxCourseCount: permissions.maxCourseCount ?? null,
                maxStorageBytes: permissions.maxStorageBytes ?? null,
                commissionRate: permissions.commissionRate ?? 70
              }
            });
            
            // Create notification for the instructor
            await prisma.notification.create({
              data: {
                userId: instructorId,
                title: 'Instructor Permissions Updated',
                message: 'Your instructor permissions have been updated by an administrator.',
                type: 'ACCOUNT'
              }
            });
            
            break;
        }
        
        // Create an activity log entry
        await prisma.activityLog.create({
          data: {
            userId: Number(session.user.id),
            action: action.toUpperCase(),
            resourceType: 'INSTRUCTOR',
            resourceId: instructorId.toString(),
            details: JSON.stringify({
              instructorId,
              action,
              permissions: permissions || null,
              notes: notes || null
            })
          }
        });
        
        // Invalidate cache for this instructor
        await invalidateCache('user', instructorId.toString());
        
        results.success++;
      } catch (error) {
        console.error(`Error updating instructor ${instructorId}:`, error);
        results.failed++;
        results.errors.push(`Failed to update instructor ${instructorId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      message: `Updated ${results.success} instructor(s) successfully`,
      results
    });
  } catch (error) {
    console.error('[UPDATE_INSTRUCTORS_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update instructors' },
      { status: 500 }
    );
  }
}

// POST /api/admin/instructors - Register a new instructor directly
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true }
    });
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    
    // Define schema for creating a new instructor
    const createInstructorSchema = z.object({
      email: z.string().email('Invalid email address'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      bio: z.string().optional(),
      permissions: z.object({
        canCreateCourses: z.boolean().default(true),
        requiresApproval: z.boolean().default(true),
        maxCourseCount: z.number().int().min(0).optional().nullable(),
        maxStorageBytes: z.number().int().min(0).optional().nullable(),
        commissionRate: z.number().min(0).max(100).default(70)
      }).optional()
    });
    
    const { email, name, password, bio, permissions } = createInstructorSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password (in a real app, use bcrypt or Argon2)
    // For this example, we're assuming NextAuth handles this
    // In a real implementation, you would use something like:
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user with instructor role
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        // hashedPassword,
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        bio,
        instructorProfile: {
          create: {
            isApproved: true,
            canCreateCourses: permissions?.canCreateCourses ?? true,
            requiresApproval: permissions?.requiresApproval ?? true,
            maxCourseCount: permissions?.maxCourseCount ?? null,
            maxStorageBytes: permissions?.maxStorageBytes ?? null,
            commissionRate: permissions?.commissionRate ?? 70
          }
        }
      }
    });
    
    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'Welcome to the Platform',
        message: 'Your instructor account has been created. You can now start creating courses.',
        type: 'ACCOUNT'
      }
    });
    
    // Create an activity log entry
    await prisma.activityLog.create({
      data: {
        userId: Number(session.user.id),
        action: 'CREATE_INSTRUCTOR',
        resourceType: 'USER',
        resourceId: newUser.id.toString(),
        details: JSON.stringify({
          instructorId: newUser.id,
          email,
          name
        })
      }
    });
    
    return NextResponse.json({
      message: 'Instructor created successfully',
      instructor: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        bio: newUser.bio || ''
      }
    });
  } catch (error) {
    console.error('[CREATE_INSTRUCTOR_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create instructor' },
      { status: 500 }
    );
  }
}
