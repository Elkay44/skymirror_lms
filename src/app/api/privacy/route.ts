import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET: Fetch privacy settings for the current user
export async function GET(_req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Default privacy settings based on role
    let privacySettings = {};
    
    switch(session.user.role) {
      case 'STUDENT':
        privacySettings = {
          profileVisibility: 'all_platform_users',
          showEnrolledCourses: true,
          showAchievements: true,
          showLearningActivity: true,
          allowMentorRecommendations: true,
          allowCourseRecommendations: true,
          allowForumTagging: true,
          allowProfileSearching: true
        };
        break;
        
      case 'INSTRUCTOR':
        privacySettings = {
          profileVisibility: 'all_platform_users',
          showCourseStatistics: true,
          showRatings: true,
          showTeachingHistory: true,
          allowStudentMessaging: true,
          allowCourseFeedback: true,
          allowProfileSearching: true,
          allowOtherInstructorsToViewMaterials: false
        };
        break;
        
      case 'MENTOR':
        privacySettings = {
          profileVisibility: 'all_platform_users',
          showMentorshipStatistics: true,
          showAvailability: true,
          showExpertiseAreas: true,
          allowMenteeMessaging: true,
          allowMenteeReviews: true,
          allowProfileSearching: true,
          visibleToNonMentees: true
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }
    
    return NextResponse.json({ privacySettings });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update privacy settings for the current user
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const data = await req.json();
    const { privacySettings } = data;
    
    if (!privacySettings) {
      return NextResponse.json({ error: 'Invalid request. Privacy settings are required.' }, { status: 400 });
    }
    
    // Validate settings based on user role
    let validSettings = {};
    const role = session.user.role;
    
    // Validate settings structure based on role
    // This ensures only valid settings for the user's role are saved
    switch(role) {
      case 'STUDENT':
        validSettings = {
          profileVisibility: privacySettings.profileVisibility || 'all_platform_users',
          showEnrolledCourses: privacySettings.showEnrolledCourses !== undefined ? privacySettings.showEnrolledCourses : true,
          showAchievements: privacySettings.showAchievements !== undefined ? privacySettings.showAchievements : true,
          showLearningActivity: privacySettings.showLearningActivity !== undefined ? privacySettings.showLearningActivity : true,
          allowMentorRecommendations: privacySettings.allowMentorRecommendations !== undefined ? privacySettings.allowMentorRecommendations : true,
          allowCourseRecommendations: privacySettings.allowCourseRecommendations !== undefined ? privacySettings.allowCourseRecommendations : true,
          allowForumTagging: privacySettings.allowForumTagging !== undefined ? privacySettings.allowForumTagging : true,
          allowProfileSearching: privacySettings.allowProfileSearching !== undefined ? privacySettings.allowProfileSearching : true
        };
        break;
        
      case 'INSTRUCTOR':
        validSettings = {
          profileVisibility: privacySettings.profileVisibility || 'all_platform_users',
          showCourseStatistics: privacySettings.showCourseStatistics !== undefined ? privacySettings.showCourseStatistics : true,
          showRatings: privacySettings.showRatings !== undefined ? privacySettings.showRatings : true,
          showTeachingHistory: privacySettings.showTeachingHistory !== undefined ? privacySettings.showTeachingHistory : true,
          allowStudentMessaging: privacySettings.allowStudentMessaging !== undefined ? privacySettings.allowStudentMessaging : true,
          allowCourseFeedback: privacySettings.allowCourseFeedback !== undefined ? privacySettings.allowCourseFeedback : true,
          allowProfileSearching: privacySettings.allowProfileSearching !== undefined ? privacySettings.allowProfileSearching : true,
          allowOtherInstructorsToViewMaterials: privacySettings.allowOtherInstructorsToViewMaterials !== undefined ? privacySettings.allowOtherInstructorsToViewMaterials : false
        };
        break;
        
      case 'MENTOR':
        validSettings = {
          profileVisibility: privacySettings.profileVisibility || 'all_platform_users',
          showMentorshipStatistics: privacySettings.showMentorshipStatistics !== undefined ? privacySettings.showMentorshipStatistics : true,
          showAvailability: privacySettings.showAvailability !== undefined ? privacySettings.showAvailability : true,
          showExpertiseAreas: privacySettings.showExpertiseAreas !== undefined ? privacySettings.showExpertiseAreas : true,
          allowMenteeMessaging: privacySettings.allowMenteeMessaging !== undefined ? privacySettings.allowMenteeMessaging : true,
          allowMenteeReviews: privacySettings.allowMenteeReviews !== undefined ? privacySettings.allowMenteeReviews : true,
          allowProfileSearching: privacySettings.allowProfileSearching !== undefined ? privacySettings.allowProfileSearching : true,
          visibleToNonMentees: privacySettings.visibleToNonMentees !== undefined ? privacySettings.visibleToNonMentees : true
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }
    
    // In a real application, this would save to a database
    return NextResponse.json({ 
      success: true, 
      message: 'Privacy settings updated successfully',
      privacySettings: validSettings 
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Request data export (GDPR compliance)
export async function PUT(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const data = await req.json();
    const { action } = data;
    
    if (action === 'requestDataExport') {
      // In a real application, this would trigger a background job to generate the export
      return NextResponse.json({
        success: true,
        message: 'Data export request received. You will be notified when it\'s ready.',
        requestId: `export_${Date.now()}`
      });
    } else if (action === 'deleteAccount') {
      // In a real application, this would trigger account deletion process
      return NextResponse.json({
        success: true,
        message: 'Account deletion request received. Our team will contact you shortly.',
        requestId: `delete_${Date.now()}`
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing privacy request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
