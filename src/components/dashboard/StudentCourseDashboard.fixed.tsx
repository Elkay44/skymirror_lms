"use client";


import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';



import {
  AlertCircle,
  ArrowLeft,
  ArrowRightCircle,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Files,
  GitCommit,
  Lock,
  MessageCircle,
  MessageSquare,
  Users,
  Video,
  CalendarRange,
  BarChart,
} from 'lucide-react';

// Import UI components
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Progress } from "@/components/ui/progress";

// Define student dashboard props type
interface StudentCourseDashboardProps {}

export default function StudentCourseDashboard({}: StudentCourseDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [animateTab, setAnimateTab] = useState(false);
  const router = useRouter();

  // Other state variables (using what was in the original file)
  const currentCourse = {
    id: "1",
    title: "Modern Web Development",
    description: "Learn to build responsive web apps with React",
    instructor: "Dr. Jane Smith",
    progress: 75,
    level: "Advanced",
    duration: "12 weeks",
    enrolledStudents: 42,
    nextSession: {
      title: "Advanced Topics Q&A",
      date: "Feb 28, 2023 - 10:30 AM",
      platform: "Zoom",
      attendance: 28,
    }
  }

  // Set up animation effect
  useEffect(() => {
    setAnimateTab(true);
  }, []);

  return (
    <div className="container mx-auto">
      {/* Course Header - basic structure to be completed later */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" className="gap-1 mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation Structure */}
          <Tabs 
            defaultValue="overview" 
            className="w-full" 
            onValueChange={(value) => {
              setAnimateTab(false);
              setTimeout(() => {
                setActiveTab(value);
                setAnimateTab(true);
              }, 50);
            }}
          >
            <TabsList className="bg-white shadow-sm border p-1 mb-8 justify-start overflow-x-auto w-full gap-2">
              <TabsTrigger value="overview" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                Overview
              </TabsTrigger>
              <TabsTrigger value="modules" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BookOpen className="w-4 h-4" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="marks" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart className="w-4 h-4" />
                Marks
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Bookmark className="w-4 h-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="forums" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageSquare className="w-4 h-4" />
                Forums
              </TabsTrigger>
              <TabsTrigger value="commits" className="gap-1.5 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <GitCommit className="w-4 h-4" />
                Commits
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Tab Content Placeholder - To be populated */}
            <TabsContent value="overview" className={`${activeTab === "overview" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Course Hero Stats */}
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50/30">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-indigo-600" />
                          Course Hero Stats
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-indigo-700 border-indigo-200 shadow-sm">
                          {currentCourse.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                              <Clock className="h-3 w-3 mr-1" />
                              {currentCourse.duration}
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                              <Users className="h-3 w-3 mr-1" />
                              {currentCourse.enrolledStudents} students
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                            {currentCourse.progress}%
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{currentCourse.title}</h2>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Study Materials Card */}
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-yellow-400"></div>
                    <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-yellow-50/30">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-amber-600" />
                          Study Materials
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-amber-700 border-amber-200 shadow-sm">
                          4 new this week
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {[
                          { title: "Week 5 Lecture Slides", icon: FileText, type: "PDF", size: "2.4 MB", date: "Today", isNew: true },
                          { title: "React Hooks Deep Dive", icon: Video, type: "Video", size: "45 min", date: "Yesterday", isNew: true },
                          { title: "State Management Patterns", icon: FileText, type: "PDF", size: "1.8 MB", date: "3 days ago", isNew: false },
                          { title: "UI Component Library", icon: Bookmark, type: "Link", size: "External", date: "1 week ago", isNew: false },
                        ].map((material, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                            <div className={`p-1.5 rounded-md ${i % 2 === 0 ? 'bg-amber-50' : 'bg-blue-50'}`}>
                              <material.icon className={`h-4 w-4 ${i % 2 === 0 ? 'text-amber-600' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{material.title}</p>
                                {material.isNew && (
                                  <Badge className="bg-green-100 text-green-800 text-[10px] px-1 py-0 h-4">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <span>{material.type}</span>
                                <span>•</span>
                                <span>{material.size}</span>
                                <span>•</span>
                                <span>{material.date}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download {material.title}</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Course Certificate Card */}
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-amber-600"></div>
                    <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-amber-100/30">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600" />
                          Course Certificate
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-amber-700 border-amber-200 shadow-sm">
                          {currentCourse.progress >= 100 ? 'Complete' : 'In Progress'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{Math.round(100 - currentCourse.progress)}% Remaining</h3>
                        <p className="text-sm text-slate-600">Complete these requirements to earn your certificate</p>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Modules</span>
                            <span className="font-medium">9/12</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Lessons</span>
                            <span className="font-medium">24/36</span>
                          </div>
                          <Progress value={67} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Projects</span>
                            <span className="font-medium">3/4</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      </div>
                      {currentCourse.progress >= 100 && (
                        <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
                          <Download className="h-4 w-4" />
                          Download Certificate
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-5">
                  {/* Next Live Session Card */}
                  <Card className="border-0 border-blue-100 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100/30">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <CalendarRange className="h-4 w-4 text-blue-600" />
                          Next Live Session
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-blue-700 border-blue-200 shadow-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {currentCourse.nextSession.attendance}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h4 className="font-medium text-blue-800">{currentCourse.nextSession.title}</h4>
                        <Badge variant="outline" className="bg-blue-100/80 border-blue-200 text-blue-700 text-xs font-normal mt-1">
                          In 2 days
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <CalendarRange className="h-4 w-4" />
                        <span>{currentCourse.nextSession.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Video className="h-4 w-4" />
                        <span>{currentCourse.nextSession.platform}</span>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1 w-full mt-2">
                        <CalendarRange className="h-3.5 w-3.5" />
                        Add to Calendar
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Activity Card */}
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50/30">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <GitCommit className="h-4 w-4 text-green-600" />
                          Recent Activity
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 h-5 bg-white text-green-700 border-green-200 shadow-sm">
                          Last 7 days
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {[
                          { 
                            activity: "Commit: Add responsive navigation drawer", 
                            date: "2 hours ago", 
                            icon: GitCommit, 
                            color: "text-green-500", 
                            bgColor: "bg-green-50",
                            commit: {
                              hash: "a1b2c3d",
                              message: "Add responsive navigation drawer for mobile views"
                            }
                          },
                          { 
                            activity: "Completed Module: React Hooks", 
                            date: "Yesterday", 
                            icon: CheckCircle, 
                            color: "text-blue-500", 
                            bgColor: "bg-blue-50"
                          },
                          { 
                            activity: "Submitted Project: Authentication System", 
                            date: "2 days ago", 
                            icon: FileText, 
                            color: "text-indigo-500", 
                            bgColor: "bg-indigo-50"
                          }
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50">
                            <div className={`mt-0.5 p-1.5 ${item.bgColor} rounded-md`}>
                              <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.activity}</p>
                              {'commit' in item && item.commit && (
                                <div className="mt-1 bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{item.commit.hash}</span>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-green-200 bg-green-50 text-green-700">
                                      main
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-slate-600">{item.commit.message}</p>
                                </div>
                              )}
                              <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Instructor Card */}
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50/30">
                      <CardTitle className="text-base font-medium">Your Instructor</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarImage src="/images/instructor.jpg" alt={currentCourse.instructor} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">
                            {currentCourse.instructor.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="text-base font-medium flex items-center gap-1.5">
                            {currentCourse.instructor}
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            <span className="text-xs text-green-600 font-normal">Online</span>
                          </h4>
                          <p className="text-xs text-slate-500">Course Instructor</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button size="sm" variant="outline" className="w-full">
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline" className="w-full">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="modules" className={`${activeTab === "modules" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Course Modules</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      View All
                    </Button>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      Learning Modules
                    </CardTitle>
                    <CardDescription>Track your progress through each module</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        {
                          id: "1",
                          title: "Introduction to Web Development",
                          duration: "3 hours",
                          lessons: 5,
                          progress: 100,
                          completed: true,
                          description: "Learn the basics of HTML, CSS, and JavaScript"
                        },
                        {
                          id: "2",
                          title: "Responsive Design Principles",
                          duration: "4 hours",
                          lessons: 7,
                          progress: 85,
                          completed: false,
                          description: "Create websites that look great on any device"
                        },
                        {
                          id: "3",
                          title: "JavaScript Fundamentals",
                          duration: "6 hours",
                          lessons: 10,
                          progress: 60,
                          completed: false,
                          description: "Master core JavaScript concepts and techniques"
                        },
                        {
                          id: "4",
                          title: "React Framework Basics",
                          duration: "8 hours",
                          lessons: 12,
                          progress: 30,
                          completed: false,
                          description: "Build interactive UIs with the React framework"
                        },
                        {
                          id: "5",
                          title: "State Management with Redux",
                          duration: "5 hours",
                          lessons: 8,
                          progress: 0,
                          completed: false,
                          description: "Advanced state management for complex applications"
                        },
                      ].map((module, i) => (
                        <div key={i} className="p-4 hover:bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={module.completed ? 'rounded-full p-2 bg-green-100' : module.progress > 0 ? 'rounded-full p-2 bg-blue-100' : 'rounded-full p-2 bg-slate-100'}>
                                {module.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : module.progress > 0 ? (
                                  <BookOpen className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Lock className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-base flex items-center gap-2">
                                  {module.title}
                                  {module.completed && <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs ml-2">Completed</Badge>}
                                </h3>
                                <p className="text-sm text-slate-500">{module.description}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 gap-1">
                              {module.completed ? 'Review' : module.progress > 0 ? 'Continue' : 'Start'}
                              <ArrowRightCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <CalendarRange className="h-3.5 w-3.5" /> {module.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3.5 w-3.5" /> {module.lessons} lessons
                                </span>
                              </div>
                              <span>{module.progress}% complete</span>
                            </div>
                            <Progress value={module.progress} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="projects" className={`${activeTab === "projects" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Course Projects</h2>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Create New Project
                  </Button>
                </div>
                
                <Card>
                  <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Your Projects
                    </CardTitle>
                    <CardDescription>Track and manage your course projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          id: "1",
                          title: "Personal Portfolio Website",
                          dueDate: "Mar 15, 2023",
                          status: "completed",
                          grade: "A",
                          description: "Create a responsive portfolio website using React and Tailwind CSS",
                          progress: 100
                        },
                        {
                          id: "2",
                          title: "E-commerce Dashboard",
                          dueDate: "Apr 10, 2023",
                          status: "in-progress",
                          description: "Build an admin dashboard for an e-commerce platform with analytics",
                          progress: 65
                        },
                        {
                          id: "3",
                          title: "Mobile Weather App",
                          dueDate: "May 5, 2023",
                          status: "not-started",
                          description: "Create a weather application with geolocation and forecasts",
                          progress: 0
                        },
                        {
                          id: "4",
                          title: "Blog Platform API",
                          dueDate: "May 20, 2023",
                          status: "not-started",
                          description: "Develop a RESTful API for a blogging platform with authentication",
                          progress: 0
                        },
                      ].map((project, i) => (
                        <Card key={i} className="border shadow-sm overflow-hidden">
                          <div className={project.status === "completed" ? "bg-green-500 h-1" : project.status === "in-progress" ? "bg-blue-500 h-1" : "bg-slate-300 h-1"}></div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{project.title}</CardTitle>
                              {project.status === "completed" ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                              ) : project.status === "in-progress" ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Not Started</Badge>
                              )}
                            </div>
                            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2 pt-0">
                            <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                              <div className="flex items-center gap-1">
                                <CalendarRange className="h-3.5 w-3.5" />
                                <span>Due: {project.dueDate}</span>
                              </div>
                              {project.grade && <div className="font-medium text-green-600">Grade: {project.grade}</div>}
                            </div>
                            <div className="flex justify-between items-center mt-3">
                              <Progress value={project.progress} className="h-1.5 w-full max-w-[70%]" />
                              <span className="text-xs text-slate-500">{project.progress}%</span>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0 pb-3 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              View Details
                            </Button>
                            {project.status !== "completed" && (
                              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                {project.status === "in-progress" ? "Continue" : "Start"}
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="marks" className={`${activeTab === "marks" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Course Marks & Grades</h2>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download Report
                  </Button>
                </div>
                
                <Card>
                  <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-yellow-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-amber-600" />
                      Performance Summary
                    </CardTitle>
                    <CardDescription>Your overall course performance and grades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-slate-50 border-0 shadow-sm">
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-slate-800">87%</div>
                          <p className="text-sm text-slate-500 mt-1">Overall Average</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50 border-0 shadow-sm">
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-amber-600">A-</div>
                          <p className="text-sm text-slate-500 mt-1">Current Grade</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50 border-0 shadow-sm">
                        <CardContent className="pt-6 text-center">
                          <div className="text-4xl font-bold text-green-600">92%</div>
                          <p className="text-sm text-slate-500 mt-1">Attendance</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <h3 className="text-sm font-medium mb-3">Assessment Breakdown</h3>
                    <div className="space-y-4">
                      {[
                        { name: "Assignments", score: 90, weight: 40, grade: "A" },
                        { name: "Midterm Exam", score: 78, weight: 25, grade: "B" },
                        { name: "Projects", score: 95, weight: 25, grade: "A+" },
                        { name: "Participation", score: 88, weight: 10, grade: "A-" },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              <Badge variant="outline" className="text-xs h-5">{item.grade}</Badge>
                            </div>
                            <div className="text-sm text-slate-500">
                              <span className="font-medium text-slate-700">{item.score}%</span>
                              <span className="text-xs ml-1 text-slate-400">({item.weight}% of total)</span>
                            </div>
                          </div>
                          <Progress value={item.score} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Assessments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        { name: "Final Project Submission", type: "Project", score: 95, maxScore: 100, date: "May 15, 2023", feedback: true },
                        { name: "User Authentication Lab", type: "Assignment", score: 18, maxScore: 20, date: "May 10, 2023", feedback: true },
                        { name: "React Components Quiz", type: "Quiz", score: 9, maxScore: 10, date: "May 5, 2023", feedback: false },
                        { name: "Database Design Exercise", type: "Assignment", score: 28, maxScore: 30, date: "Apr 28, 2023", feedback: true },
                        { name: "Midterm Examination", type: "Exam", score: 78, maxScore: 100, date: "Apr 15, 2023", feedback: true },
                      ].map((assessment, i) => (
                        <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50">
                          <div>
                            <h4 className="font-medium text-sm">{assessment.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{assessment.type}</Badge>
                              <span className="text-xs text-slate-500">{assessment.date}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {assessment.score}/{assessment.maxScore}
                              <span className="text-xs text-slate-500 ml-1">({Math.round(assessment.score / assessment.maxScore * 100)}%)</span>
                            </div>
                            {assessment.feedback && (
                              <Button variant="ghost" size="sm" className="text-xs h-6 mt-1">
                                View Feedback
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className={`${activeTab === "resources" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Course Resources</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Mark All as Read
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Download className="h-3.5 w-3.5" />
                      Download All
                    </Button>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-3 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Files className="h-4 w-4 text-cyan-600" />
                      Learning Materials
                    </CardTitle>
                    <CardDescription>Access all course documents, slides, and references</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          title: "Course Syllabus",
                          description: "Complete course outline and requirements",
                          type: "PDF",
                          size: "1.2 MB",
                          date: "Jan 15, 2023",
                          isNew: false
                        },
                        {
                          title: "Week 1-5 Lecture Slides",
                          description: "Introduction to web development fundamentals",
                          type: "ZIP",
                          size: "45 MB",
                          date: "Feb 1, 2023",
                          isNew: false
                        },
                        {
                          title: "React Component Patterns",
                          description: "Advanced techniques for React components",
                          type: "PDF",
                          size: "3.8 MB",
                          date: "Mar 10, 2023",
                          isNew: false
                        },
                        {
                          title: "Final Project Requirements",
                          description: "Specifications and rubric for the final project",
                          type: "PDF",
                          size: "2.1 MB",
                          date: "Apr 5, 2023",
                          isNew: true
                        },
                        {
                          title: "JavaScript Style Guide",
                          description: "Coding standards for JavaScript assignments",
                          type: "PDF",
                          size: "850 KB",
                          date: "Apr 15, 2023",
                          isNew: true
                        },
                      ].map((resource, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${resource.type === "PDF" ? "bg-red-100" : resource.type === "ZIP" ? "bg-amber-100" : "bg-blue-100"}`}>
                              {resource.type === "PDF" ? (
                                <FileText className={`h-6 w-6 ${resource.type === "PDF" ? "text-red-600" : resource.type === "ZIP" ? "text-amber-600" : "text-blue-600"}`} />
                              ) : resource.type === "ZIP" ? (
                                <Download className="h-6 w-6 text-amber-600" />
                              ) : (
                                <FileText className="h-6 w-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{resource.title}</h3>
                                {resource.isNew && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">NEW</Badge>}
                              </div>
                              <p className="text-sm text-slate-500">{resource.description}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span>{resource.type} • {resource.size}</span>
                                <span>Added: {resource.date}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="h-8">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recommended Readings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          title: "JavaScript: The Good Parts",
                          author: "Douglas Crockford",
                          description: "Focus on the good parts of JavaScript, avoiding the bad parts",
                          link: "#"
                        },
                        {
                          title: "React Patterns for Sustainable Development",
                          author: "Kent C. Dodds",
                          description: "Best practices for building maintainable React applications",
                          link: "#"
                        },
                        {
                          title: "CSS Secrets",
                          author: "Lea Verou",
                          description: "Better solutions to everyday web design problems",
                          link: "#"
                        },
                      ].map((book, i) => (
                        <div key={i} className="flex gap-3">
                          <BookOpen className="h-10 w-10 text-slate-700" />
                          <div>
                            <h3 className="font-medium">{book.title}</h3>
                            <p className="text-sm text-slate-600">by {book.author}</p>
                            <p className="text-sm text-slate-500">{book.description}</p>
                            <Button variant="link" className="h-6 px-0 text-blue-600">
                              View Details
                              <ExternalLink className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="forums" className={`${activeTab === "forums" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Discussion Forums</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      New Discussion
                    </Button>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-purple-600" />
                      Active Discussions
                    </CardTitle>
                    <CardDescription>Participate in course discussions with classmates and instructors</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        {
                          title: "How to fix CORS issues with React and Express?",
                          author: "Emma Johnson",
                          replies: 12,
                          views: 45,
                          lastReply: "2 hours ago",
                          isPinned: true,
                          isNew: true,
                          hasInstructorReply: true
                        },
                        {
                          title: "Best practices for Redux state management",
                          author: "Alex Thompson",
                          replies: 8,
                          views: 32,
                          lastReply: "Yesterday",
                          isPinned: false,
                          isNew: true,
                          hasInstructorReply: true
                        },
                        {
                          title: "Having trouble with Jest testing, need help",
                          author: "Ryan Williams",
                          replies: 4,
                          views: 19,
                          lastReply: "2 days ago",
                          isPinned: false,
                          isNew: false,
                          hasInstructorReply: false
                        },
                        {
                          title: "Project 3 Clarification on Requirements",
                          author: "Sophie Chen",
                          replies: 15,
                          views: 67,
                          lastReply: "3 days ago",
                          isPinned: false,
                          isNew: false,
                          hasInstructorReply: true
                        },
                        {
                          title: "Resources for learning TypeScript?",
                          author: "James Wilson",
                          replies: 7,
                          views: 28,
                          lastReply: "5 days ago",
                          isPinned: false,
                          isNew: false,
                          hasInstructorReply: false
                        },
                      ].map((thread, i) => (
                        <div key={i} className="flex items-center justify-between py-4 px-4 hover:bg-slate-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {thread.isPinned && <span className="text-slate-500 text-xs">📌</span>}
                              <h3 className="font-medium hover:text-blue-700 cursor-pointer">{thread.title}</h3>
                              {thread.isNew && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">NEW</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>By {thread.author}</span>
                              <span>•</span>
                              <span>Last reply {thread.lastReply}</span>
                              {thread.hasInstructorReply && <span className="text-green-600 font-medium">Instructor replied</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-xs text-slate-500">
                            <div className="text-center">
                              <div className="font-medium text-slate-700">{thread.replies}</div>
                              <div>Replies</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-slate-700">{thread.views}</div>
                              <div>Views</div>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-2">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between py-3 border-t">
                    <div className="text-sm text-slate-500">Showing 5 of 24 discussions</div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        1
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        2
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        3
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        ...
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        5
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Important Announcements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        {
                          title: "Final Project Deadline Extension",
                          date: "May 1, 2023",
                          content: "The deadline for the final project has been extended by one week to give everyone more time to complete their work.",
                          isImportant: true
                        },
                        {
                          title: "Guest Lecture: Industry Expert on Modern Web Development",
                          date: "Apr 20, 2023",
                          content: "We will have a special guest lecture next Tuesday from 2-4pm. Attendance is highly recommended.",
                          isImportant: false
                        },
                        {
                          title: "Midterm Grades Posted",
                          date: "Mar 25, 2023",
                          content: "Your midterm grades are now available in the Marks section. Please review and contact me with any questions.",
                          isImportant: false
                        },
                      ].map((announcement, i) => (
                        <div key={i} className="py-4 px-4 hover:bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium flex items-center gap-2">
                              {announcement.title}
                              {announcement.isImportant && (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">Important</Badge>
                              )}
                            </h3>
                            <span className="text-xs text-slate-500">{announcement.date}</span>
                          </div>
                          <p className="text-sm text-slate-600">{announcement.content}</p>
                          <Button variant="link" className="h-7 px-0 mt-1 text-sm">
                            Read more
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="commits" className={`${activeTab === "commits" && animateTab ? "animate-fadeIn" : ""}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Your Commits</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Most Recent
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <GitCommit className="h-3.5 w-3.5" />
                      All Projects
                    </Button>
                  </div>
                </div>
                
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCommit className="h-4 w-4 text-green-600" />
                      Recent Commits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        {
                          hash: "a1b2c3d",
                          message: "Add responsive navigation drawer for mobile views",
                          date: "2 hours ago",
                          branch: "main",
                          project: "Navigation Component",
                          status: "success"
                        },
                        {
                          hash: "e5f6g7h",
                          message: "Fix authentication token refresh logic",
                          date: "Yesterday",
                          branch: "auth-fix",
                          project: "Authentication System",
                          status: "success"
                        },
                        {
                          hash: "i9j0k1l",
                          message: "Implement dark mode toggle with system preference detection",
                          date: "2 days ago",
                          branch: "feature/dark-mode",
                          project: "UI Theme",
                          status: "failed"
                        },
                        {
                          hash: "m2n3o4p",
                          message: "Add unit tests for user profile components",
                          date: "3 days ago",
                          branch: "testing",
                          project: "User Profile",
                          status: "success"
                        },
                      ].map((commit, i) => (
                        <div key={i} className="flex flex-col p-4 hover:bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-sm">
                                {commit.hash}
                              </span>
                              <Badge variant="outline" className={commit.status === 'success' ? 'text-xs h-5 px-1.5 border-green-200 bg-green-50 text-green-700' : 'text-xs h-5 px-1.5 border-red-200 bg-red-50 text-red-700'}>
                                {commit.branch}
                              </Badge>
                            </div>
                            <Badge variant="outline" className={commit.status === 'success' ? 'text-xs h-5 px-1.5 border-green-200 bg-green-50 text-green-700' : 'text-xs h-5 px-1.5 border-red-200 bg-red-50 text-red-700'}>
                              {commit.status === 'success' ? 
                                <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Success</div> : 
                                <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed</div>
                              }
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{commit.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-xs text-slate-500">
                              <span className="font-medium text-slate-700">{commit.project}</span>
                              <span className="mx-1.5">•</span>
                              <span>{commit.date}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                View
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar Placeholder */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Placeholder</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Sidebar content will go here</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
