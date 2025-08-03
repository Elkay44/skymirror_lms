import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logModuleActivity } from '@/lib/activity-log';

// DELETE /api/courses/[courseId]/modules/[moduleId] - Delete a module
export async function DELETE(
  _request: Request, // Prefix with _ to indicate it's intentionally unused
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
): Promise<Response> {
  try {
    const { courseId, moduleId } = await params;

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an instructor for this course
    const course = await prisma.course.findFirst({
      where: {
        id: parseInt(courseId),
        instructorId: parseInt(session.user.id)
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'You must be the instructor of this course to delete modules' },
        { status: 403 }
      );
    }

    // Delete the module and all associated data
    await prisma.$transaction(async (tx: any) => {
      // Type assertion to access models not in the default PrismaClient type
      const prismaTx = tx as any;
      
      // Delete forums and their posts
      const forums = await prismaTx.forum.findMany({
        where: { moduleId: moduleId }
      });

      for (const forum of forums) {
        await prismaTx.post.deleteMany({ where: { forumId: forum.id } });
        await prismaTx.forum.delete({ where: { id: forum.id } });
      }

      // Delete lessons and their resources
      const lessons = await prismaTx.lesson.findMany({
        where: { moduleId: moduleId }
      });

      for (const lesson of lessons) {
        await prismaTx.lessonResource.deleteMany({ where: { lessonId: lesson.id } });
        await prismaTx.lesson.delete({ where: { id: lesson.id } });
      }

      // Delete the module itself
      await prismaTx.module.delete({ where: { id: moduleId } });
    });

    // Log activity - using 'delete' as the action since it's a standard CRUD operation
    await logModuleActivity(parseInt(session.user.id), moduleId, 'delete', {
      courseId: courseId
    });

    // Revalidate cache
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(`Error deleting module:`, error);
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}
