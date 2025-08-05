import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission for bulk operations
    if (!['admin', 'instructor'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const courseId = url.searchParams.get('courseId');

    if (!type) {
      return NextResponse.json(
        { error: 'Export type is required' },
        { status: 400 }
      );
    }

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'enrollment':
        const enrollmentData = await exportEnrollmentData(courseId);
        csvContent = enrollmentData.csv;
        filename = enrollmentData.filename;
        break;
      case 'grades':
        const gradesData = await exportGradesData(courseId);
        csvContent = gradesData.csv;
        filename = gradesData.filename;
        break;
      case 'users':
        const usersData = await exportUsersData();
        csvContent = usersData.csv;
        filename = usersData.filename;
        break;
      case 'emails':
        const emailsData = await exportEmailsData(courseId);
        csvContent = emailsData.csv;
        filename = emailsData.filename;
        break;
      case 'certificates':
        const certificatesData = await exportCertificatesData(courseId);
        csvContent = certificatesData.csv;
        filename = certificatesData.filename;
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported export type' },
          { status: 400 }
        );
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function exportEnrollmentData(courseId?: string | null) {
  const whereClause = courseId ? { courseId } : {};
  
  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          name: true,
          role: true
        }
      },
      course: {
        select: {
          title: true
        }
      }
    }
  });

  const headers = ['Email', 'Name', 'Role', 'Course', 'Status', 'Enrolled Date'];
  const rows = enrollments.map(enrollment => [
    enrollment.user.email,
    enrollment.user.name || '',
    enrollment.user.role,
    enrollment.course.title,
    enrollment.status,
    enrollment.enrolledAt.toISOString().split('T')[0]
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csv,
    filename: `enrollment-export-${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportGradesData(_courseId?: string | null) {
  // For demo purposes, we'll create mock grades data
  // In a real system, you'd have a proper grades/marks table
  const mockGrades = [
    {
      user: { email: 'student1@example.com', name: 'John Doe' },
      course: { title: 'Sample Course' },
      project: { title: 'Sample Project' },
      assignment: { title: 'Sample Assignment' },
      grade: 85,
      feedback: 'Good work!',
      submittedAt: new Date()
    }
  ];

  const headers = ['Email', 'Name', 'Course', 'Project', 'Assignment', 'Grade', 'Feedback', 'Submitted Date'];
  const rows = mockGrades.map(grade => [
    grade.user.email,
    grade.user.name || '',
    grade.course.title,
    grade.project.title,
    grade.assignment.title,
    grade.grade?.toString() || '',
    grade.feedback || '',
    grade.submittedAt.toISOString().split('T')[0]
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csv,
    filename: `grades-export-${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportUsersData() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      createdAt: true,
      image: true
    }
  });

  const headers = ['Email', 'Name', 'Role', 'Created Date', 'Has Avatar'];
  const rows = users.map(user => [
    user.email,
    user.name || '',
    user.role,
    user.createdAt.toISOString().split('T')[0],
    user.image ? 'Yes' : 'No'
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csv,
    filename: `users-export-${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportEmailsData(courseId?: string | null) {
  // For demo purposes, we'll export notifications as email data
  const whereClause = courseId ? {
    // Filter by course-related notifications if needed
  } : {};

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    },
    take: 100 // Limit to recent notifications
  });

  const headers = ['Email', 'Name', 'Subject', 'Message', 'Type', 'Read', 'Created Date'];
  const rows = notifications.map(notification => [
    notification.user.email,
    notification.user.name || '',
    notification.title,
    notification.message,
    notification.type,
    notification.isRead ? 'Yes' : 'No',
    notification.createdAt.toISOString().split('T')[0]
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csv,
    filename: `emails-export-${new Date().toISOString().split('T')[0]}.csv`
  };
}

async function exportCertificatesData(courseId?: string | null) {
  // For demo purposes, we'll export completed enrollments as certificates
  const whereClause = {
    status: 'COMPLETED',
    ...(courseId && { courseId })
  };

  const completedEnrollments = await prisma.enrollment.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      course: {
        select: {
          title: true
        }
      }
    }
  });

  const headers = ['Email', 'Name', 'Course', 'Completion Date', 'Certificate Status'];
  const rows = completedEnrollments.map(enrollment => [
    enrollment.user.email,
    enrollment.user.name || '',
    enrollment.course.title,
    enrollment.updatedAt.toISOString().split('T')[0],
    'Generated'
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    csv,
    filename: `certificates-export-${new Date().toISOString().split('T')[0]}.csv`
  };
}
