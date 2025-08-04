// Simple test script to verify messaging functionality
// Run this in the browser console when on the messages page

async function testMessagingSystem() {
  console.log('🔍 Testing messaging system...');
  
  // 1. Test authentication state
  console.log('1️⃣ Testing authentication state...');
  const authState = document.querySelector('[data-testid="auth-state"]')?.textContent || 
                   'No auth state element found. This is expected if using next-auth without a custom indicator.';
  console.log(`Auth state: ${authState}`);
  
  // 2. Test API endpoints directly
  console.log('2️⃣ Testing API endpoints directly...');
  
  try {
    console.log('Fetching conversations...');
    const conversationsResponse = await fetch('/api/conversations', {
      headers: { 'Cache-Control': 'no-store' }
    });
    
    if (!conversationsResponse.ok) {
      console.error(`❌ Failed to fetch conversations: ${conversationsResponse.status} ${conversationsResponse.statusText}`);
      const errorText = await conversationsResponse.text();
      console.error(`Error details: ${errorText}`);
    } else {
      const conversations = await conversationsResponse.json();
      console.log(`✅ Successfully fetched ${Array.isArray(conversations) ? conversations.length : 'unknown number of'} conversations`);
      console.log(conversations);
    }
  } catch (error) {
    console.error('❌ Error testing conversations API:', error);
  }
  
  // 3. Test recipients API
  try {
    console.log('Fetching recipients...');
    const recipientsResponse = await fetch('/api/recipients', {
      headers: { 'Cache-Control': 'no-store' }
    });
    
    if (!recipientsResponse.ok) {
      console.error(`❌ Failed to fetch recipients: ${recipientsResponse.status} ${recipientsResponse.statusText}`);
      const errorText = await recipientsResponse.text();
      console.error(`Error details: ${errorText}`);
    } else {
      const recipients = await recipientsResponse.json();
      console.log(`✅ Successfully fetched ${recipients.length} recipients`);
      console.log(recipients);
    }
  } catch (error) {
    console.error('❌ Error testing recipients API:', error);
  }
  
  // 4. Check for UI elements
  console.log('4️⃣ Checking UI elements...');
  
  const newMessageButton = document.querySelector('button:has(.lucide-plus-circle)');
  console.log(`New message button: ${newMessageButton ? '✅ Found' : '❌ Not found'}`);
  
  const conversationsList = document.querySelector('.divide-y.divide-gray-200');
  console.log(`Conversations list: ${conversationsList ? '✅ Found' : '❌ Not found'}`);
  
  // 5. Summary
  console.log('5️⃣ Test summary:');
  console.log('- If you see 401 errors, you need to log in at /login');
  console.log('- If you see successful API responses but no UI elements, there might be a rendering issue');
  console.log('- If everything looks good, try creating a new conversation');
  console.log('Test complete! 🎉');
}

// Run the test
testMessagingSystem();
