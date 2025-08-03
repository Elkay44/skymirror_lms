"use client";

import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Type definitions
interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  type: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  order?: number;
  progress?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
  };
  modules: Module[];
  progress: number;
  nextLesson: string;
  category?: string;
  level?: string;
}

export default function StudentCourseDashboard() {
  const router = useRouter();

  // Mock course data
  const mockCourse: Course = {
    id: '1',
    title: 'Full Stack Web Development',
    description: 'Learn full stack web development from scratch',
    instructor: {
      id: '1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg'
    },
    modules: [
      {
        id: '1',
        title: 'Introduction to Web Development',
        lessons: [
          {
            id: '1',
            title: 'Introduction',
            description: 'Welcome to the course',
            duration: 15,
            type: 'video',
            completed: true
          },
          {
            id: '2',
            title: 'HTML Basics',
            description: 'Learn HTML fundamentals',
            duration: 30,
            type: 'video',
            completed: true
          },
          {
            id: '3',
            title: 'CSS Fundamentals',
            description: 'Learn CSS basics',
            duration: 45,
            type: 'video',
            completed: false
          }
        ]
      },
      {
        id: '2',
        title: 'JavaScript Essentials',
        lessons: [
          {
            id: '4',
            title: 'JavaScript Basics',
            description: 'Learn JavaScript fundamentals',
            duration: 60,
            type: 'video',
            completed: false
          },
          {
            id: '5',
            title: 'DOM Manipulation',
            description: 'Learn DOM manipulation',
            duration: 45,
            type: 'video',
            completed: false
          }
        ]
      }
    ],
    progress: 33,
    nextLesson: '3',
    category: 'web development',
    level: 'beginner'
  };

  const studentProgress = {
    completedModules: 1,
    totalModules: 2,
    completedLessons: 2,
    totalLessons: 5,
    nextLessonId: '3'
  } as const;

  // Calculate progress percentages
  const overallProgress = Math.round((studentProgress.completedLessons / studentProgress.totalLessons) * 100);
  const completedModulesPercent = Math.round((studentProgress.completedModules / studentProgress.totalModules) * 100);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{mockCourse.title}</h1>
              <p className="mt-2 text-gray-600">{mockCourse.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${mockCourse.id}/lessons/${studentProgress.nextLessonId}`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Progress</h3>
                    <p className="text-sm text-gray-500">Overall Course Progress</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{overallProgress}%</div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Modules</h3>
                    <p className="text-sm text-gray-500">Completed vs Total</p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{completedModulesPercent}%</div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Lessons</h3>
                    <p className="text-sm text-gray-500">Completed vs Total</p>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {studentProgress.completedLessons}/{studentProgress.totalLessons}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
