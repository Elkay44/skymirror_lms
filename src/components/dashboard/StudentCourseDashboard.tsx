"use client";

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { BookOpen, Users, Plus } from 'lucide-react';

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
  progress: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  completed: boolean;
}

interface Project {
  id: string;
  title: string;
  progress: number;
}

interface Activity {
  id: string;
  title: string;
  timestamp: Date;
}

export interface Course {
  id: string;
  title: string;
  progress: number;
  modules: CourseModule[];
  projects?: Project[];
  activities?: Activity[];
  startDate?: Date;
  endDate?: Date;
  instructor?: string;
}

export default function StudentCourseDashboard({ courses = [] }: { courses: Course[] }) {
  const router = useRouter();

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No Courses</h2>
        <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Course Dashboard</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/courses/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {/* Course Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex flex-col space-y-1">
                <h2 className="text-sm font-semibold leading-none">{course.title}</h2>
              </div>
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
                <BookOpen className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="pt-2">
                <Progress value={course.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{course.progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Course Modules</h2>
        {courses.map((course) => (
          <div key={course.id} className="space-y-4">
            <h3 className="text-base font-semibold">{course.title}</h3>
            {course.modules.map((module) => (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <h4 className="text-sm font-medium">{module.title}</h4>
                  </div>
                  <Progress value={module.progress} className="h-1.5 w-24" />
                </div>
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="pl-6">
                    <div className="flex items-center space-x-2">
                      <div className={`h-4 w-4 ${lesson.completed ? 'bg-green-500' : 'bg-gray-300'} rounded-full`} />
                      <p className="text-sm text-muted-foreground">{lesson.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        {courses.map((course) => (
          <div key={course.id} className="space-y-4">
            <h3 className="text-base font-semibold">{course.title}</h3>
            {course.projects?.map((project) => (
              <Card key={project.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex flex-col space-y-1">
                    <h2 className="text-sm font-semibold leading-none">{project.title}</h2>
                  </div>
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                    <Users className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="pt-2">
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}