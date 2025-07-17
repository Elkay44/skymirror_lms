import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, Users, DollarSign, BookOpen, Star, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseCard } from '../courses/CourseCard';
import { Course } from '@/types/course.types';

// Helper function to create a mock instructor
const createMockInstructor = (): Course['instructor'] => ({
  id: '1',
  name: 'John Doe',
  avatarUrl: '/images/avatar-placeholder.png',
  title: 'Senior Instructor',
  bio: '10+ years of experience in web development'
});

// Helper function to create a mock course
const createMockCourse = (overrides: Partial<Course> = {}): Course => ({
  // Required fields with defaults
  id: overrides.id || '1',
  slug: overrides.slug || 'advanced-react-development',
  title: overrides.title || 'Advanced React Development',
  shortDescription: overrides.shortDescription || 'Master React with hooks, context, and advanced patterns',
  description: overrides.description || 'A comprehensive course on advanced React concepts including hooks, context, and performance optimization.',
  category: overrides.category || 'Web Development',
  level: overrides.level || 'ADVANCED',
  language: overrides.language || 'en',
  price: overrides.price || 99.99,
  isFree: overrides.isFree ?? false,
  hasDiscount: overrides.hasDiscount ?? false,
  discountedPrice: overrides.discountedPrice || 79.99,
  imageUrl: overrides.imageUrl || '/images/course-placeholder.jpg',
  promoVideo: overrides.promoVideo || 'https://example.com/promo-video',
  requirements: overrides.requirements || ['Basic React knowledge', 'JavaScript ES6+'],
  learningOutcomes: overrides.learningOutcomes || ['Master React hooks', 'Build performant apps', 'Use advanced patterns'],
  targetAudience: overrides.targetAudience || ['React developers', 'Frontend engineers'],
  isPublished: overrides.isPublished ?? true,
  isPrivate: overrides.isPrivate ?? false,
  
  // Additional fields from Course interface
  isEnrolled: overrides.isEnrolled ?? false,
  isFavorite: overrides.isFavorite ?? false,
  isNew: overrides.isNew ?? true,
  isBestSeller: overrides.isBestSeller ?? true,
  rating: overrides.rating || 4.8,
  reviewCount: overrides.reviewCount || 124,
  studentCount: overrides.studentCount || 1245,
  lessonCount: overrides.lessonCount || 12,
  duration: overrides.duration || 600, // 10 hours in minutes
  progress: overrides.progress || 0,
  createdAt: overrides.createdAt ? new Date(overrides.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: overrides.updatedAt ? new Date(overrides.updatedAt).toISOString() : new Date().toISOString(),
  instructor: overrides.instructor || createMockInstructor(),
  
  // Add empty modules array as it's required by the Course type
  modules: overrides.modules || [],
  
  // Ensure we don't include any undefined values that might cause type issues
  ...Object.fromEntries(
    Object.entries(overrides)
      .filter(([key]) => ![
        'id', 'slug', 'title', 'shortDescription', 'description', 'category', 
        'level', 'language', 'price', 'isFree', 'hasDiscount', 'discountedPrice',
        'imageUrl', 'promoVideo', 'requirements', 'learningOutcomes', 'targetAudience',
        'isPublished', 'isPrivate', 'isEnrolled', 'isFavorite', 'isNew', 'isBestSeller',
        'rating', 'reviewCount', 'studentCount', 'lessonCount', 'duration', 'progress',
        'createdAt', 'updatedAt', 'instructor', 'modules'
      ].includes(key))
  )
});

const mockCourses: Course[] = [
  createMockCourse({
    id: '1',
    title: 'Advanced React Development',
    shortDescription: 'Master React with hooks, context, and advanced patterns',
    studentCount: 1245,
    progress: 65,
    lessonCount: 12,
    level: 'ADVANCED',
    isPublished: true,
    isFree: false,
    hasDiscount: false,
    price: 99.99,
    discountedPrice: 79.99,
    language: 'en',
    category: 'Web Development',
    requirements: ['Basic React knowledge', 'JavaScript ES6+'],
    learningOutcomes: ['Master React hooks', 'Build performant apps'],
    targetAudience: ['React developers', 'Frontend engineers'],
    isPrivate: false,
    isEnrolled: false,
    isFavorite: false,
    isNew: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 124,
    duration: 600, // 10 hours in minutes
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    instructor: {
      id: '1',
      name: 'John Doe',
      avatarUrl: '/images/avatar-placeholder.png',
      title: 'Senior Instructor',
      bio: '10+ years of experience in web development'
    }
  }),
  // Add more mock courses as needed
];

export function InstructorDashboard() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your courses.</p>
        </div>
        <Button>Create New Course</Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,248</div>
            <p className="text-xs text-muted-foreground">+180 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,780</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center">
                  <LineChart className="h-8 w-8 text-muted-foreground" />
                  <span className="text-muted-foreground ml-2">Revenue chart will appear here</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Course {i}</p>
                        <p className="text-sm text-muted-foreground">${(1000 - i * 100).toLocaleString()} revenue</p>
                      </div>
                      <div className="ml-auto font-medium">+{100 - i * 10}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">New student enrolled in Course {i}</p>
                      <p className="text-sm text-muted-foreground">{i} hour{i !== 1 ? 's' : ''} ago</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <div className="border-2 border-dashed rounded-lg flex items-center justify-center min-h-[300px] hover:border-primary transition-colors cursor-pointer">
              <div className="text-center p-6">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium">Create New Course</h3>
                <p className="text-sm text-muted-foreground mt-1">Start building your next course</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


