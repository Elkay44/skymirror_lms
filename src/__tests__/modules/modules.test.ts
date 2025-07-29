import { createModule, getModules } from '@/lib/api/modules';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreateModuleRequest, ModuleStatus } from '@/types/module';
import { mockPrisma, mockUserCreate, mockCourseCreate, mockModuleCreate, mockModuleFindMany } from '@/__tests__/__mocks__/prisma';

describe('Module API Tests', () => {
  let userId: number;
  let courseId: number;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should create and retrieve modules successfully', async () => {
    // Mock user creation
    userId = 1;
    mockUserCreate.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'INSTRUCTOR'
    });

    // Mock course creation
    courseId = 1;
    mockCourseCreate.mockResolvedValue({
      id: courseId,
      title: 'Test Course',
      description: 'A test course',
      instructorId: userId
    });

    // Test module creation
    const moduleId = 1;
    const moduleData: CreateModuleRequest = {
      title: 'Test Module',
      description: 'A test module',
      status: 'draft',
      learningObjectives: ['Learn something'],
      estimatedDuration: 30,
      prerequisites: ['module-123']
    };

    mockModuleCreate.mockResolvedValue({
      id: moduleId,
      title: moduleData.title,
      description: moduleData.description,
      status: moduleData.status,
      order: 0,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const createdModule = await createModule(courseId.toString(), moduleData);
    expect(createdModule).toBeDefined();
    expect(createdModule.title).toBe('Test Module');
    expect(createdModule.description).toBe('A test module');
    expect(createdModule.status).toBe('draft');
    expect(createdModule.order).toBe(0); // First module should have order 0

    // Test retrieving modules
    mockModuleFindMany.mockResolvedValue([{
      id: moduleId,
      title: moduleData.title,
      description: moduleData.description,
      status: moduleData.status,
      order: 0,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    const modules = await getModules(courseId.toString());
    expect(modules).toBeDefined();
    expect(modules.length).toBe(1);
    expect(modules[0].id).toBe(createdModule.id);
    expect(modules[0].status).toBe('draft');

    // Test creating another module
    const secondModuleId = 2;
    const secondModuleData: CreateModuleRequest = {
      title: 'Second Module',
      description: 'Another test module',
      status: 'draft',
      learningObjectives: ['Learn more'],
      estimatedDuration: 45,
      prerequisites: ['module-456']
    };

    mockModuleCreate.mockResolvedValue({
      id: secondModuleId,
      title: secondModuleData.title,
      description: secondModuleData.description,
      status: secondModuleData.status,
      order: 1,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const secondModule = await createModule(courseId.toString(), secondModuleData);
    expect(secondModule.order).toBe(1); // Should be ordered after first module

    // Verify order is maintained
    mockModuleFindMany.mockResolvedValue([{
      id: moduleId,
      title: moduleData.title,
      description: moduleData.description,
      status: moduleData.status,
      order: 0,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: secondModuleId,
      title: secondModuleData.title,
      description: secondModuleData.description,
      status: secondModuleData.status,
      order: 1,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    const allModules = await getModules(courseId.toString());
    expect(allModules.length).toBe(2);
    expect(allModules[0].order).toBe(0);
    expect(allModules[1].order).toBe(1);
  });

  it('should fail module creation with invalid data', async () => {
    // Mock course creation
    courseId = 1;
    mockCourseCreate.mockResolvedValue({
      id: courseId,
      title: 'Test Course',
      description: 'A test course',
      instructorId: 1
    });

    // Try to create module without title
    const invalidModuleData: Partial<CreateModuleRequest> = {
      description: 'A test module',
      status: 'draft' as ModuleStatus,
      learningObjectives: ['Learn something'],
      estimatedDuration: 30,
      prerequisites: ['module-123']
    };

    mockModuleCreate.mockRejectedValue(new Error('Title is required'));

    await expect(createModule(courseId.toString(), invalidModuleData as CreateModuleRequest))
      .rejects
      .toThrow('Title is required');

    // Try to create module with invalid course ID
    const invalidCourseData: CreateModuleRequest = {
      title: 'Invalid Course Module',
      description: 'This should fail',
      status: 'draft',
      learningObjectives: ['Learn nothing'],
      estimatedDuration: 0,
      prerequisites: []
    };

    mockModuleCreate.mockRejectedValue(new Error('Course not found'));

    await expect(createModule('invalid-course-id', invalidCourseData))
      .rejects
      .toThrow('Course not found');
  });
});
