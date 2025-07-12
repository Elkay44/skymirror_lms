#!/bin/bash

# Test script for module content creation routes
# This script uses curl commands to test various module content creation endpoints

# Base URL for the API
BASE_URL="http://localhost:3000/api"

# Colors for better output formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}     Testing Module Content Creation Routes${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Test variables - these need to be set for testing
COURSE_ID=""
MODULE_ID=""

# Function to prompt for required input if not provided
prompt_for_input() {
  if [ -z "$COURSE_ID" ]; then
    echo -e "${YELLOW}Enter a valid course ID for testing:${NC}"
    read COURSE_ID
    if [ -z "$COURSE_ID" ]; then
      echo -e "${RED}Course ID is required. Exiting.${NC}"
      exit 1
    fi
  fi
}

# 1. Test creating a module
test_create_module() {
  echo -e "\n${BLUE}1. Testing module creation for course ID: $COURSE_ID${NC}"
  
  MODULE_TITLE="Test Module $(date +%s)"
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$MODULE_TITLE\", \"description\":\"Test module description\"}" \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules)
    
  echo "$RESPONSE" | grep -q "id"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Module created successfully${NC}"
    # Extract module ID from response (this is a simplistic approach)
    MODULE_ID=$(echo $RESPONSE | sed -E 's/.*"id":"?([^,"]+)"?.*/\1/')
    echo -e "${GREEN}   Module ID: $MODULE_ID${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to create module${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
    return 1
  fi
}

# 2. Test creating a lesson in the module
test_create_lesson() {
  echo -e "\n${BLUE}2. Testing lesson creation for module ID: $MODULE_ID${NC}"
  
  LESSON_TITLE="Test Lesson $(date +%s)"
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$LESSON_TITLE\", \"description\":\"Test lesson description\", \"content\":\"Test lesson content\"}" \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/lessons)
    
  echo "$RESPONSE" | grep -q "id"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lesson created successfully${NC}"
    # Extract lesson ID
    LESSON_ID=$(echo $RESPONSE | sed -E 's/.*"id":"?([^,"]+)"?.*/\1/')
    echo -e "${GREEN}   Lesson ID: $LESSON_ID${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to create lesson${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
    return 1
  fi
}

# 3. Test creating a page in the module
test_create_page() {
  echo -e "\n${BLUE}3. Testing page creation for module ID: $MODULE_ID${NC}"
  
  PAGE_TITLE="Test Page $(date +%s)"
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$PAGE_TITLE\", \"description\":\"Test page description\", \"content\":\"Test page content\", \"isPublished\":true}" \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/pages)
    
  echo "$RESPONSE" | grep -q "id"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Page created successfully${NC}"
    PAGE_ID=$(echo $RESPONSE | sed -E 's/.*"id":"?([^,"]+)"?.*/\1/')
    echo -e "${GREEN}   Page ID: $PAGE_ID${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to create page${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
    return 1
  fi
}

# 4. Test creating a quiz in the module
test_create_quiz() {
  echo -e "\n${BLUE}4. Testing quiz creation for module ID: $MODULE_ID${NC}"
  
  QUIZ_TITLE="Test Quiz $(date +%s)"
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$QUIZ_TITLE\", \"description\":\"Test quiz description\", \"timeLimit\":10, \"passingScore\":70}" \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/quizzes)
    
  echo "$RESPONSE" | grep -q "success"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Quiz created successfully${NC}"
    # Note: The quiz endpoint might return a different structure
    QUIZ_ID=$(echo $RESPONSE | sed -E 's/.*"id":"?([^,"]+)"?.*/\1/')
    echo -e "${GREEN}   Quiz ID: $QUIZ_ID${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to create quiz${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
    return 1
  fi
}

# 5. Test creating an assignment in the module
test_create_assignment() {
  echo -e "\n${BLUE}5. Testing assignment creation for module ID: $MODULE_ID${NC}"
  
  ASSIGNMENT_TITLE="Test Assignment $(date +%s)"
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$ASSIGNMENT_TITLE\", \"description\":\"Test assignment description\", \"maxScore\":100, \"submissionType\":\"TEXT\"}" \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/assignments)
    
  echo "$RESPONSE" | grep -q "data"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Assignment created successfully${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to create assignment${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
    return 1
  fi
}

# 6. Test creating a project in the module
test_create_project() {
  echo -e "\n${BLUE}6. Testing project creation for module ID: $MODULE_ID${NC}"
  
  PROJECT_TITLE="Test Project $(date +%s)"
  
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$PROJECT_TITLE\", \"description\":\"Test project description\", \"difficulty\":\"MEDIUM\", \"estimatedHours\":5}" \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/projects)
    
  echo "$RESPONSE" | grep -q "data"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Project created successfully${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed to create project${NC}"
    echo -e "${YELLOW}Response: $RESPONSE${NC}"
    return 1
  fi
}

# 7. Test getting all created content
test_get_module_content() {
  echo -e "\n${BLUE}7. Testing retrieval of module content${NC}"
  
  # Get module details
  echo -e "${YELLOW}Retrieving module details...${NC}"
  RESPONSE=$(curl -s -X GET \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID)
  
  echo "$RESPONSE" | grep -q "id"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully retrieved module details${NC}"
  else
    echo -e "${RED}❌ Failed to retrieve module details${NC}"
  fi
  
  # Get lessons
  echo -e "${YELLOW}Retrieving lessons...${NC}"
  RESPONSE=$(curl -s -X GET \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/lessons)
  
  echo "$RESPONSE" | wc -c | grep -q "0"
  if [ $? -eq 0 ]; then
    echo -e "${RED}❌ No lessons found or error in response${NC}"
  else
    echo -e "${GREEN}✅ Successfully retrieved lessons${NC}"
  fi
  
  # Get pages
  echo -e "${YELLOW}Retrieving pages...${NC}"
  RESPONSE=$(curl -s -X GET \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/pages)
  
  echo "$RESPONSE" | wc -c | grep -q "0"
  if [ $? -eq 0 ]; then
    echo -e "${RED}❌ No pages found or error in response${NC}"
  else
    echo -e "${GREEN}✅ Successfully retrieved pages${NC}"
  fi
  
  # Get quizzes
  echo -e "${YELLOW}Retrieving quizzes...${NC}"
  RESPONSE=$(curl -s -X GET \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/quizzes)
  
  echo "$RESPONSE" | wc -c | grep -q "0"
  if [ $? -eq 0 ]; then
    echo -e "${RED}❌ No quizzes found or error in response${NC}"
  else
    echo -e "${GREEN}✅ Successfully retrieved quizzes${NC}"
  fi
  
  # Get assignments
  echo -e "${YELLOW}Retrieving assignments...${NC}"
  RESPONSE=$(curl -s -X GET \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/assignments)
  
  echo "$RESPONSE" | wc -c | grep -q "0"
  if [ $? -eq 0 ]; then
    echo -e "${RED}❌ No assignments found or error in response${NC}"
  else
    echo -e "${GREEN}✅ Successfully retrieved assignments${NC}"
  fi
  
  # Get projects
  echo -e "${YELLOW}Retrieving projects...${NC}"
  RESPONSE=$(curl -s -X GET \
    --cookie-jar /tmp/cookies.txt \
    $BASE_URL/courses/$COURSE_ID/modules/$MODULE_ID/projects)
  
  echo "$RESPONSE" | wc -c | grep -q "0"
  if [ $? -eq 0 ]; then
    echo -e "${RED}❌ No projects found or error in response${NC}"
  else
    echo -e "${GREEN}✅ Successfully retrieved projects${NC}"
  fi
}

# Run the tests
main() {
  echo -e "${YELLOW}Note: These tests require you to be logged in via the browser${NC}"
  echo -e "${YELLOW}and the browser cookies will be used for authentication.${NC}"
  
  # Prompt for course ID
  prompt_for_input
  
  # Run tests in sequence
  if test_create_module; then
    test_create_lesson
    test_create_page
    test_create_quiz
    test_create_assignment
    test_create_project
    
    # Finally test getting all content
    test_get_module_content
    
    echo -e "\n${GREEN}==== Test Summary ====${NC}"
    echo -e "${GREEN}Course ID: $COURSE_ID${NC}"
    echo -e "${GREEN}Module ID: $MODULE_ID${NC}"
    echo -e "${GREEN}All tests completed.${NC}"
  else
    echo -e "\n${RED}Failed to create module. Cannot continue with tests.${NC}"
  fi
}

# Execute the main function
main
