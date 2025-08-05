import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission for bulk operations
    if (!['admin', 'instructor'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operation = formData.get('operation') as string;
    const courseId = formData.get('courseId') as string;

    if (!file || !operation) {
      return NextResponse.json(
        { error: 'File and operation type are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use CSV or Excel files.' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    let result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      warnings: [] as string[],
      data: [] as any[]
    };

    // Process based on operation type
    switch (operation) {
      case 'enrollment':
        result = await processBulkEnrollment(dataRows, headers, courseId, session.user.email);
        break;
      case 'grades':
        result = await processBulkGrades(dataRows, headers, courseId, session.user.email);
        break;
      case 'users':
        result = await processBulkUsers(dataRows, headers, session.user.email);
        break;
      case 'emails':
        result = await processBulkEmails(dataRows, headers, courseId, session.user.email);
        break;
      case 'certificates':
        result = await processBulkCertificates(dataRows, headers, courseId, session.user.email);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported operation type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}

async function processBulkEnrollment(
  dataRows: string[][],
  headers: string[],
  courseId: string,
  userEmail: string
) {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    data: [] as any[]
  };

  // Expected headers: email, firstName, lastName, role (optional)
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('firstname') || h.toLowerCase().includes('first'));
  const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('lastname') || h.toLowerCase().includes('last'));

  if (emailIndex === -1) {
    result.errors.push('Email column is required');
    return result;
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const email = row[emailIndex];
    const firstName = firstNameIndex !== -1 ? row[firstNameIndex] : '';
    const lastName = lastNameIndex !== -1 ? row[lastNameIndex] : '';

    try {
      if (!email || !email.includes('@')) {
        result.errors.push(`Row ${i + 2}: Invalid email address`);
        result.failed++;
        continue;
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email }
      });

      // Create user if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
            role: 'STUDENT'
          }
        });
        result.warnings.push(`Row ${i + 2}: Created new user account for ${email}`);
      }

      // Enroll in course if courseId provided
      if (courseId) {
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: courseId
            }
          }
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: user.id,
              courseId: courseId,
              status: 'ACTIVE'
            }
          });
        } else {
          result.warnings.push(`Row ${i + 2}: User ${email} already enrolled in course`);
        }
      }

      result.success++;
      result.data.push({
        email,
        name: user.name,
        status: 'enrolled'
      });

    } catch (error) {
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failed++;
    }
  }

  return result;
}

async function processBulkGrades(
  dataRows: string[][],
  headers: string[],
  courseId: string,
  userEmail: string
) {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    data: [] as any[]
  };

  // Expected headers: email, assignmentId, grade, feedback (optional)
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const assignmentIndex = headers.findIndex(h => h.toLowerCase().includes('assignment'));
  const gradeIndex = headers.findIndex(h => h.toLowerCase().includes('grade'));
  const feedbackIndex = headers.findIndex(h => h.toLowerCase().includes('feedback'));

  if (emailIndex === -1 || gradeIndex === -1) {
    result.errors.push('Email and grade columns are required');
    return result;
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const email = row[emailIndex];
    const grade = parseFloat(row[gradeIndex]);
    const feedback = feedbackIndex !== -1 ? row[feedbackIndex] : '';

    try {
      if (!email || isNaN(grade)) {
        result.errors.push(`Row ${i + 2}: Invalid email or grade`);
        result.failed++;
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        result.errors.push(`Row ${i + 2}: User not found: ${email}`);
        result.failed++;
        continue;
      }

      // For demo purposes, we'll just log the grade
      // In a real system, you'd update assignment grades
      console.log(`Would update grade for ${email}: ${grade}`);

      result.success++;
      result.data.push({
        email,
        grade,
        feedback,
        status: 'updated'
      });

    } catch (error) {
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failed++;
    }
  }

  return result;
}

async function processBulkUsers(
  dataRows: string[][],
  headers: string[],
  userEmail: string
) {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    data: [] as any[]
  };

  // Expected headers: email, firstName, lastName, role
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('firstname') || h.toLowerCase().includes('first'));
  const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('lastname') || h.toLowerCase().includes('last'));
  const roleIndex = headers.findIndex(h => h.toLowerCase().includes('role'));

  if (emailIndex === -1) {
    result.errors.push('Email column is required');
    return result;
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const email = row[emailIndex];
    const firstName = firstNameIndex !== -1 ? row[firstNameIndex] : '';
    const lastName = lastNameIndex !== -1 ? row[lastNameIndex] : '';
    const role = roleIndex !== -1 ? row[roleIndex].toUpperCase() : 'STUDENT';

    try {
      if (!email || !email.includes('@')) {
        result.errors.push(`Row ${i + 2}: Invalid email address`);
        result.failed++;
        continue;
      }

      if (!['STUDENT', 'INSTRUCTOR', 'MENTOR', 'ADMIN'].includes(role)) {
        result.errors.push(`Row ${i + 2}: Invalid role: ${role}`);
        result.failed++;
        continue;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { email },
          data: {
            name: `${firstName} ${lastName}`.trim() || existingUser.name,
            role: role as any
          }
        });
        result.warnings.push(`Row ${i + 2}: Updated existing user: ${email}`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email,
            name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
            role: role as any
          }
        });
      }

      result.success++;
      result.data.push({
        email,
        name: `${firstName} ${lastName}`.trim(),
        role,
        status: existingUser ? 'updated' : 'created'
      });

    } catch (error) {
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failed++;
    }
  }

  return result;
}

async function processBulkEmails(
  dataRows: string[][],
  headers: string[],
  courseId: string,
  userEmail: string
) {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    data: [] as any[]
  };

  // Expected headers: email, subject, message
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const subjectIndex = headers.findIndex(h => h.toLowerCase().includes('subject'));
  const messageIndex = headers.findIndex(h => h.toLowerCase().includes('message'));

  if (emailIndex === -1 || subjectIndex === -1 || messageIndex === -1) {
    result.errors.push('Email, subject, and message columns are required');
    return result;
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const email = row[emailIndex];
    const subject = row[subjectIndex];
    const message = row[messageIndex];

    try {
      if (!email || !subject || !message) {
        result.errors.push(`Row ${i + 2}: Missing required fields`);
        result.failed++;
        continue;
      }

      // For demo purposes, we'll just log the email
      // In a real system, you'd send the actual email
      console.log(`Would send email to ${email}: ${subject}`);

      result.success++;
      result.data.push({
        email,
        subject,
        message,
        status: 'sent'
      });

    } catch (error) {
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failed++;
    }
  }

  return result;
}

async function processBulkCertificates(
  dataRows: string[][],
  headers: string[],
  courseId: string,
  userEmail: string
) {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    warnings: [] as string[],
    data: [] as any[]
  };

  // Expected headers: email, courseName, completionDate
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const courseNameIndex = headers.findIndex(h => h.toLowerCase().includes('course'));
  const completionDateIndex = headers.findIndex(h => h.toLowerCase().includes('completion') || h.toLowerCase().includes('date'));

  if (emailIndex === -1) {
    result.errors.push('Email column is required');
    return result;
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const email = row[emailIndex];
    const courseName = courseNameIndex !== -1 ? row[courseNameIndex] : 'Course';
    const completionDate = completionDateIndex !== -1 ? row[completionDateIndex] : new Date().toISOString();

    try {
      if (!email) {
        result.errors.push(`Row ${i + 2}: Email is required`);
        result.failed++;
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        result.errors.push(`Row ${i + 2}: User not found: ${email}`);
        result.failed++;
        continue;
      }

      // For demo purposes, we'll just log the certificate generation
      // In a real system, you'd generate and send the certificate
      console.log(`Would generate certificate for ${email}: ${courseName}`);

      result.success++;
      result.data.push({
        email,
        courseName,
        completionDate,
        status: 'generated'
      });

    } catch (error) {
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failed++;
    }
  }

  return result;
}
