// This script tests the module content creation routes
const fetch = require('node-fetch');

// Base URL for API requests
const baseUrl = 'http://localhost:3000/api';

// Store the auth token
let token;

// Store created IDs for testing
const testIds = {
  courseId: null,
  moduleId: null,
  lessonId: null,
  pageId: null,
  quizId: null,
  assignmentId: null,
  projectId: null,
};

/**
 * Makes an authenticated API request
 */
async function apiRequest(url, method = 'GET', body = null) {
  console.log(`${method} ${url}${body ? ' with data' : ''}`);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    if (!response.ok) {
      console.error('Error response:', data);
      return { success: false, status: response.status, data };
    }
    
    return { success: true, status: response.status, data };
  } catch (error) {
    console.error(`Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test creating a module in a course
 */
async function testCreateModule(courseId) {
  console.log('\n🔍 Testing module creation');
  
  const moduleData = {
    title: `Test Module ${Date.now()}`,
    description: 'This is a test module created via API',
  };
  
  const result = await apiRequest(
    `${baseUrl}/courses/${courseId}/modules`,
    'POST',
    moduleData
  );
  
  if (result.success) {
    testIds.moduleId = result.data.id;
    console.log(`✅ Module created successfully with ID: ${testIds.moduleId}`);
  } else {
    console.error('❌ Failed to create module');
  }
  
  return result.success;
}

/**
 * Test creating a lesson in a module
 */
async function testCreateLesson() {
  console.log('\n🔍 Testing lesson creation');
  
  const lessonData = {
    title: `Test Lesson ${Date.now()}`,
    description: 'This is a test lesson created via API',
    content: 'This is the test lesson content',
    videoUrl: 'https://www.youtube.com/watch?v=test'
  };
  
  const result = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/lessons`,
    'POST',
    lessonData
  );
  
  if (result.success) {
    testIds.lessonId = result.data.id;
    console.log(`✅ Lesson created successfully with ID: ${testIds.lessonId}`);
  } else {
    console.error('❌ Failed to create lesson');
  }
  
  return result.success;
}

/**
 * Test creating a page in a module
 */
async function testCreatePage() {
  console.log('\n🔍 Testing page creation');
  
  const pageData = {
    title: `Test Page ${Date.now()}`,
    description: 'This is a test page created via API',
    content: 'This is the test page content',
    isPublished: true
  };
  
  const result = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/pages`,
    'POST',
    pageData
  );
  
  if (result.success) {
    testIds.pageId = result.data.id;
    console.log(`✅ Page created successfully with ID: ${testIds.pageId}`);
  } else {
    console.error('❌ Failed to create page');
  }
  
  return result.success;
}

/**
 * Test creating a quiz in a module
 */
async function testCreateQuiz() {
  console.log('\n🔍 Testing quiz creation');
  
  const quizData = {
    title: `Test Quiz ${Date.now()}`,
    description: 'This is a test quiz created via API',
    instructions: 'Complete all questions to pass the quiz',
    timeLimit: 15,
    passingScore: 70,
    maxAttempts: 3
  };
  
  const result = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/quizzes`,
    'POST',
    quizData
  );
  
  if (result.success && result.data.data) {
    testIds.quizId = result.data.data.id;
    console.log(`✅ Quiz created successfully with ID: ${testIds.quizId}`);
  } else {
    console.error('❌ Failed to create quiz');
  }
  
  return result.success;
}

/**
 * Test creating an assignment in a module
 */
async function testCreateAssignment() {
  console.log('\n🔍 Testing assignment creation');
  
  const assignmentData = {
    title: `Test Assignment ${Date.now()}`,
    description: 'This is a test assignment created via API',
    instructions: 'Complete and submit your work',
    maxScore: 100,
    submissionType: 'TEXT'
  };
  
  const result = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/assignments`,
    'POST',
    assignmentData
  );
  
  if (result.success && result.data.data) {
    testIds.assignmentId = result.data.data.id;
    console.log(`✅ Assignment created successfully with ID: ${testIds.assignmentId}`);
  } else {
    console.error('❌ Failed to create assignment');
  }
  
  return result.success;
}

/**
 * Test creating a project in a module
 */
async function testCreateProject() {
  console.log('\n🔍 Testing project creation');
  
  const projectData = {
    title: `Test Project ${Date.now()}`,
    description: 'This is a test project created via API',
    instructions: 'Complete the project based on requirements',
    maxScore: 100,
    difficulty: 'MEDIUM',
    estimatedHours: 5
  };
  
  const result = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/projects`,
    'POST',
    projectData
  );
  
  if (result.success && result.data.data) {
    testIds.projectId = result.data.data.id;
    console.log(`✅ Project created successfully with ID: ${testIds.projectId}`);
  } else {
    console.error('❌ Failed to create project');
  }
  
  return result.success;
}

/**
 * Test retrieving all created content from a module
 */
async function testGetModuleContent() {
  console.log('\n🔍 Testing retrieval of all module content');
  
  // Get the module details to see if it includes all content
  const result = await apiRequest(`${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}`);
  
  if (result.success) {
    console.log(`✅ Retrieved module with ID: ${testIds.moduleId}`);
  } else {
    console.error('❌ Failed to retrieve module content');
  }
  
  // Get lessons
  const lessonsResult = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/lessons`
  );
  if (lessonsResult.success) {
    console.log(`✅ Retrieved lessons - found ${Array.isArray(lessonsResult.data) ? lessonsResult.data.length : 'unknown'} lessons`);
  }
  
  // Get pages
  const pagesResult = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/pages`
  );
  if (pagesResult.success) {
    const pageCount = pagesResult.data.data ? pagesResult.data.data.length : 'unknown';
    console.log(`✅ Retrieved pages - found ${pageCount} pages`);
  }
  
  // Get quizzes
  const quizzesResult = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/quizzes`
  );
  if (quizzesResult.success) {
    const quizCount = quizzesResult.data.data ? quizzesResult.data.data.length : 'unknown';
    console.log(`✅ Retrieved quizzes - found ${quizCount} quizzes`);
  }
  
  // Get assignments
  const assignmentsResult = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/assignments`
  );
  if (assignmentsResult.success) {
    const assignmentCount = assignmentsResult.data.data ? assignmentsResult.data.data.length : 'unknown';
    console.log(`✅ Retrieved assignments - found ${assignmentCount} assignments`);
  }
  
  // Get projects
  const projectsResult = await apiRequest(
    `${baseUrl}/courses/${testIds.courseId}/modules/${testIds.moduleId}/projects`
  );
  if (projectsResult.success) {
    const projectCount = projectsResult.data.data ? projectsResult.data.data.length : 'unknown';
    console.log(`✅ Retrieved projects - found ${projectCount} projects`);
  }
  
  return result.success;
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 Starting module content API tests');
  
  // Get first course for testing
  // In a real scenario, you'd authenticate and use a specific course
  const coursesResult = await apiRequest(`${baseUrl}/courses`);
  if (coursesResult.success && Array.isArray(coursesResult.data) && coursesResult.data.length > 0) {
    testIds.courseId = coursesResult.data[0].id;
  } else if (coursesResult.success && coursesResult.data.data && coursesResult.data.data.length > 0) {
    testIds.courseId = coursesResult.data.data[0].id;
  } else {
    console.error('❌ No courses found for testing');
    return;
  }
  
  console.log(`📋 Using course ID: ${testIds.courseId} for testing`);
  
  // Run all tests in sequence
  if (await testCreateModule(testIds.courseId)) {
    // Create different types of content
    await testCreateLesson();
    await testCreatePage();
    await testCreateQuiz();
    await testCreateAssignment();
    await testCreateProject();
    
    // Test retrieving all content
    await testGetModuleContent();
  }
  
  console.log('\n🏁 Test summary:');
  console.log('Course ID:', testIds.courseId);
  console.log('Module ID:', testIds.moduleId);
  console.log('Lesson ID:', testIds.lessonId);
  console.log('Page ID:', testIds.pageId);
  console.log('Quiz ID:', testIds.quizId);
  console.log('Assignment ID:', testIds.assignmentId);
  console.log('Project ID:', testIds.projectId);
}

// Run all tests
runTests().catch(console.error);
