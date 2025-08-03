"use client";

import { useRouter } from 'next/router';
import { ArrowRight } from 'lucide-react';

// Import UI components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

// Types
interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number;
  completed: boolean;
  order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  modules: Module[];
}

interface StudentCourseDashboardProps {
  courses?: Course[];
}

export default function StudentCourseDashboard({ courses = [] }: StudentCourseDashboardProps) {
  const router = useRouter();

  if (!courses || courses.length === 0) {
    return <p>No courses found</p>;
  }

  const currentCourse = courses[0]; // For demonstration, using the first course

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-4xl font-bold bg-blue-100 text-blue-800 rounded-full p-2">
                    {currentCourse.title.charAt(0)}
                  </span>
                  <div>
                    <h1 className="text-2xl font-semibold">{currentCourse.title}</h1>
                    <p className="text-sm text-slate-500">{currentCourse.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${currentCourse.id}/lessons/${currentCourse.modules[0]?.lessons[0]?.id || ''}`)}
                  className="flex items-center space-x-2"
                >
                  Continue Learning <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-8 bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex flex-col items-center justify-center px-4 py-2">
            <div className="text-3xl font-bold text-blue-600">{currentCourse.modules.length}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Modules</div>
          </div>
          
          <div className="flex flex-col items-center justify-center px-4 py-2">
            <div className="text-3xl font-bold text-emerald-600">{currentCourse.modules.reduce((acc, module) => acc + module.lessons.length, 0)}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Lessons</div>
          </div>
          
          <div className="flex flex-col items-center justify-center px-4 py-2">
            <div className="text-3xl font-bold text-indigo-600">{currentCourse.duration}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Hours</div>
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Course Completion</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {currentCourse.modules.map((module) => (
                <div key={module.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {module.title.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{module.title}</h3>
                      <span className="text-xs text-slate-500">
                        {module.lessons.length} lessons • {module.lessons.reduce((acc, lesson) => acc + lesson.duration, 0)} min
                      </span>
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${module.lessons.reduce((acc, lesson) => acc + (lesson.completed ? 1 : 0), 0) / module.lessons.length * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
