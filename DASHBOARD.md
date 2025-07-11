# Academy LMS Dashboard

## Overview
The dashboard is the central hub for users after logging in. It provides an overview of their learning progress, courses, achievements, and personalized recommendations.

## Features

### Core Components
- **Stats Overview**: Displays key metrics including courses completed, points earned, certificates, and hours learned
- **In-Progress Courses**: Shows courses the user has started with progress bars
- **Recommended Courses**: Suggests new courses based on user interests and behavior
- **Recent Achievements**: Highlights recent milestones and badges earned
- **User Profile Summary**: Shows basic user info and role
- **Quick Links**: Provides navigation to common destinations

## Implementation Details

### API Endpoints
- `/api/user-dashboard`: Main endpoint that provides all dashboard data
  - Returns user info, stats, courses, achievements, and recommendations
  - Includes metadata flags (hasEnrollments, hasAchievements) for conditional rendering

### Key Files
- `/src/app/dashboard/page.tsx`: Main dashboard page component
- `/src/app/api/user-dashboard/route.ts`: API handler for dashboard data

### Data Structure
The dashboard uses the following data structure:

```typescript
interface DashboardData {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
  stats: {
    coursesCompleted: number;
    totalPoints: number;
    certificates: number;
    hoursLearned: number;
    hasActivity: boolean;
  };
  hasEnrollments: boolean;
  inProgressCourses: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    imageUrl: string;
  }>;
  hasAchievements: boolean;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    icon: string;
  }>;
  hasEvents: boolean;
  upcomingEvents: any[];
  learningPath: any | null;
  recommendedCourses: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    difficulty: string;
    enrollmentCount: number;
  }>;
}
```

## Design Patterns

### Conditional Rendering
The dashboard uses metadata flags (hasEnrollments, hasAchievements) to conditionally render sections only when they have content. This prevents empty sections and provides a better user experience.

### Progressive Loading
Implements loading states to show feedback while data is being fetched.

### Error Handling
Provides user-friendly error states with retry options when data fetching fails.

## Future Enhancements

1. **Personalization Engine**: Improve course recommendations based on user behavior and preferences
2. **Learning Pathways**: Add structured learning paths with progress tracking
3. **Social Features**: Integrate peer activity and community elements
4. **Calendar Integration**: Add schedule view for upcoming deadlines and events
5. **Performance Analytics**: More detailed learning performance metrics and insights

## Testing Notes

For development and testing:
- The API endpoint `/api/user-dashboard` provides sample data even when not authenticated
- For production, update the API to enforce authentication
- The dashboard route is temporarily in publicRoutes in middleware.ts for testing
