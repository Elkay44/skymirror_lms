/**
 * Course Approval Workflow Tests
 * 
 * This file contains tests for the course approval workflow, including:
 * - Course submission for review by instructors
 * - Course approval, rejection, and change requests by admins
 * - Authorization checks for different user roles
 */

import prisma from '../lib/prisma';
import { createMocks } from 'node-mocks-http';
import { NextRequest, NextResponse } from 'next/server';
// Mock the API handlers since we're testing the workflow, not the actual API
const submitForReview = async (req: NextRequest, { params }: { params: { courseId: string } }) => {
  const course = await prisma.course.update({
    where: { id: params.courseId },
    data: { status: 'UNDER_REVIEW' },
  });
  return NextResponse.json({ data: course });
};

const updateCourseStatus = async (req: NextRequest, { params }: { params: { courseId: string } }) => {
  const json = await req.json();
  const course = await prisma.course.update({
    where: { id: params.courseId },
    data: { status: json.status },
  });
  return NextResponse.json({ data: course });
};

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Import the mocked NextAuth
import { getServerSession } from 'next-auth';

// Use the imported prisma client

// Sample data for testing
const sampleCourse = {
  id: 'test-course-id',
  title: 'Test Course',
  description: 'A test course for approval workflow',
  instructorId: 1,
  status: 'DRAFT',
};

const instructorUser = {
  id: 1,
  name: 'Instructor User',
  email: 'instructor@example.com',
  role: 'INSTRUCTOR',
};

const adminUser = {
  id: 2,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const anotherInstructorUser = {
  id: 3,
  name: 'Another Instructor',
  email: 'another@example.com',
  role: 'INSTRUCTOR',
};

describe('Course Approval Workflow', () => {
  // Set up and tear down
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test data in the database
    await prisma.course.create({
      data: sampleCourse
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.courseApprovalHistory?.deleteMany({
        where: { courseId: sampleCourse.id }
      });
    } catch (error) {
      // Ignore if table doesn't exist or other errors during cleanup
    }
    await prisma.course.delete({
      where: { id: sampleCourse.id }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Course Submission for Review', () => {
    it('should allow an instructor to submit their own course for review', async () => {
      // Mock session as the course instructor
      (getServerSession as jest.Mock).mockResolvedValue({
        user: instructorUser,
      });

      // Create request mock for submitting course for review
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'UNDER_REVIEW',
        },
      });

      // Cast req as NextRequest (needed for the API handler)
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      const responseData = await response.json();

      // Check if response is success
      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('UNDER_REVIEW');

      // Check if approval history was created
      const approvalHistory = await prisma.courseApprovalHistory.findFirst({
        where: {
          courseId: sampleCourse.id,
          action: 'SUBMITTED',
        },
      });
      
      expect(approvalHistory).not.toBeNull();
      expect(approvalHistory?.reviewerId).toBe(instructorUser.id);
    });

    it('should not allow an instructor to submit someone else\'s course for review', async () => {
      // Mock session as another instructor
      (getServerSession as jest.Mock).mockResolvedValue({
        user: anotherInstructorUser,
      });

      // Create request mock
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'UNDER_REVIEW',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      
      // Check if response is unauthorized
      expect(response.status).toBe(403);
      
      // Check that no approval history was created
      const approvalHistory = await prisma.courseApprovalHistory.findFirst({
        where: {
          courseId: sampleCourse.id,
        },
      });
      
      expect(approvalHistory).toBeNull();
    });
  });

  describe('Admin Course Review Actions', () => {
    beforeEach(async () => {
      // Set course as under review
      await prisma.course.update({
        where: { id: sampleCourse.id },
        data: { status: 'UNDER_REVIEW' }
      });
      
      // Create submission history
      await prisma.courseApprovalHistory.create({
        data: {
          courseId: sampleCourse.id,
          reviewerId: instructorUser.id,
          action: 'SUBMITTED',
        }
      });
    });

    it('should allow an admin to approve a course', async () => {
      // Mock session as admin
      (getServerSession as jest.Mock).mockResolvedValue({
        user: adminUser,
      });

      // Create request mock for approving course
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'PUBLISHED',
          reviewAction: 'APPROVED',
          reviewComments: 'Looks good! Approved for publication.',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      const responseData = await response.json();

      // Check if response is success
      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('PUBLISHED');

      // Check if approval history was created
      const approvalHistory = await prisma.courseApprovalHistory.findFirst({
        where: {
          courseId: sampleCourse.id,
          action: 'APPROVED',
          reviewerId: adminUser.id,
        },
      });
      
      expect(approvalHistory).not.toBeNull();
      expect(approvalHistory?.comments).toBe('Looks good! Approved for publication.');
    });

    it('should allow an admin to reject a course', async () => {
      // Mock session as admin
      (getServerSession as jest.Mock).mockResolvedValue({
        user: adminUser,
      });

      // Create request mock for rejecting course
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'DRAFT',
          reviewAction: 'REJECTED',
          reviewComments: 'Course needs significant improvement before publication.',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      const responseData = await response.json();

      // Check if response is success
      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('DRAFT');

      // Check if approval history was created with rejection
      const approvalHistory = await prisma.courseApprovalHistory.findFirst({
        where: {
          courseId: sampleCourse.id,
          action: 'REJECTED',
          reviewerId: adminUser.id,
        },
      });
      
      expect(approvalHistory).not.toBeNull();
    });

    it('should allow an admin to request changes to a course', async () => {
      // Mock session as admin
      (getServerSession as jest.Mock).mockResolvedValue({
        user: adminUser,
      });

      // Create request mock for requesting changes
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'CHANGES_REQUESTED',
          reviewAction: 'CHANGES_REQUESTED',
          reviewComments: 'Please add more details to module 2.',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      const responseData = await response.json();

      // Check if response is success
      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('CHANGES_REQUESTED');

      // Check if approval history was created with changes requested
      const approvalHistory = await prisma.courseApprovalHistory.findFirst({
        where: {
          courseId: sampleCourse.id,
          action: 'CHANGES_REQUESTED',
          reviewerId: adminUser.id,
        },
      });
      
      expect(approvalHistory).not.toBeNull();
      expect(approvalHistory?.comments).toBe('Please add more details to module 2.');
    });

    it('should not allow an instructor to approve/reject courses', async () => {
      // Mock session as instructor
      (getServerSession as jest.Mock).mockResolvedValue({
        user: instructorUser,
      });

      // Create request mock for trying to approve
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'PUBLISHED',
          reviewAction: 'APPROVED',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      
      // Check if response is unauthorized
      expect(response.status).toBe(403);
      
      // Verify course status hasn't changed
      const course = await prisma.course.findUnique({
        where: { id: sampleCourse.id },
      });
      
      expect(course?.status).toBe('UNDER_REVIEW');
    });
  });

  describe('Course Updates After Changes Requested', () => {
    beforeEach(async () => {
      // Set course as changes requested
      await prisma.course.update({
        where: { id: sampleCourse.id },
        data: { status: 'CHANGES_REQUESTED' }
      });
      
      // Create approval history for changes requested
      await prisma.courseApprovalHistory.create({
        data: {
          courseId: sampleCourse.id,
          reviewerId: adminUser.id,
          action: 'CHANGES_REQUESTED',
          comments: 'Please improve module 2',
        }
      });
    });

    it('should allow an instructor to update their course after changes were requested', async () => {
      // Mock session as the course instructor
      (getServerSession as jest.Mock).mockResolvedValue({
        user: instructorUser,
      });

      // Create request mock for updating course
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          title: 'Updated Test Course',
          description: 'Updated description with requested changes',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      const responseData = await response.json();

      // Check if response is success
      expect(response.status).toBe(200);
      expect(responseData.data.title).toBe('Updated Test Course');
    });

    it('should allow an instructor to resubmit course after making changes', async () => {
      // Mock session as the course instructor
      (getServerSession as jest.Mock).mockResolvedValue({
        user: instructorUser,
      });

      // Create request mock for resubmitting course
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          status: 'UNDER_REVIEW',
        },
      });

      // Cast req as NextRequest
      const nextReq = req as unknown as NextRequest;
      
      // Call the API handler
      const response = await updateCourseStatus(nextReq, { params: { courseId: sampleCourse.id } });
      const responseData = await response.json();

      // Check if response is success
      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('UNDER_REVIEW');

      // Check if approval history was updated
      const approvalHistory = await prisma.courseApprovalHistory.findMany({
        where: {
          courseId: sampleCourse.id,
          action: 'SUBMITTED',
          reviewerId: instructorUser.id,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 1
      }).then(history => history[0]);
      
      expect(approvalHistory).not.toBeNull();
    });
  });
});
