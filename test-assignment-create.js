// Test script for creating an assignment
const axios = require('axios');

async function testAssignmentCreation() {
  try {
    console.log('Testing assignment creation...');
    
    // Using a valid moduleId from our database query
    const moduleId = 'cmcwkh7dd0001ggsq97uu018q'; // Valid module ID from database
    console.log(`Using valid module ID from database: ${moduleId}`);
    
    // Create a test assignment
    const assignmentData = {
      title: 'Test Assignment ' + new Date().toISOString(),
      instructions: 'This is a test assignment created via API',
      moduleId,
      maxScore: 100,
      submissionType: 'TEXT',
      allowLateSubmissions: true,
      isPublished: true,
      rubricItems: [
        {
          criteriaName: 'Content Quality',
          maxPoints: 50,
          description: 'Quality of the submission content'
        },
        {
          criteriaName: 'Formatting',
          maxPoints: 50,
          description: 'Proper formatting of the submission'
        }
      ]
    };
    
    console.log('Sending assignment creation request with data:', JSON.stringify(assignmentData, null, 2));
    
    const response = await axios.post('http://localhost:3003/api/assignments', assignmentData);
    
    console.log('Assignment created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error creating assignment:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testAssignmentCreation();
