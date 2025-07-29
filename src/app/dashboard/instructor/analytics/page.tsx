'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  Brush,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, isWithinInterval } from 'date-fns';
import { 
  Calendar as CalendarIcon,
  Download,
  Filter,
  RefreshCw,
  User,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  AlertCircle,
  Check,
  X,
  Clock4,
  Calendar as CalendarIcon2,
  Users,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  FileText,
  MessageSquare,
  BookOpen,
  Video,
  Code,
  Layout,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';

// Progress component implementation
const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <div 
      className="h-full bg-blue-500 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Custom Popover components with TypeScript types

// Custom Popover components with TypeScript types
interface PopoverTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

const PopoverTrigger = ({ children, className, asChild = false }: PopoverTriggerProps) => (
  <div className={className}>
    {asChild ? children : <button>{children}</button>}
  </div>
);

const PopoverContent = ({ children, className, align = 'center' }: PopoverContentProps) => (
  <div 
    className={`bg-white p-4 border rounded-md shadow-lg ${className}`}
    style={{ textAlign: align }}
  >
    {children}
  </div>
);

const Popover = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">{children}</div>
);

// Temporary Calendar component - replace with your actual Calendar component
const Calendar = ({
  mode = 'single',
  selected,
  onSelect,
  className,
  ...props
}: {
  mode?: 'single' | 'range';
  selected?: any;
  onSelect?: (date: any) => void;
  className?: string;
  [key: string]: any;
}) => (
  <div className={`p-3 ${className}`}>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
        <div key={day} className="text-center text-sm font-medium text-gray-500">
          {day}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div 
          key={i} 
          className="h-8 w-8 flex items-center justify-center text-sm rounded-full hover:bg-gray-100 cursor-pointer"
          onClick={() => onSelect?.(new Date())}
        >
          {i + 1}
        </div>
      ))}
    </div>
  </div>
);

// Generate time series data
const generateTimeSeriesData = (days = 30) => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(today, days - i - 1);
    return {
      date: format(date, 'MMM dd'),
      students: Math.floor(Math.random() * 50) + 50,
      completion: Math.floor(Math.random() * 30) + 60,
      engagement: Math.floor(Math.random() * 40) + 40,
      assignments: Math.floor(Math.random() * 20) + 10,
    };
  });
};

// Generate heatmap data
const generateHeatmapData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.flatMap(hour => 
    days.map(day => ({
      day,
      hour,
      value: Math.floor(Math.random() * 100) + 1
    }))
  );
};

// Mock data - Replace with actual data from your API
const courseData = generateTimeSeriesData(30);
const heatmapData = generateHeatmapData();

// Top activities data
const topActivities = [
  {
    name: 'Interactive Coding Sessions',
    score: 85,
    participants: 125
  },
  {
    name: 'Group Projects',
    score: 78,
    participants: 95
  },
  {
    name: 'Live Q&A Sessions',
    score: 72,
    participants: 112
  },
  {
    name: 'Code Reviews',
    score: 68,
    participants: 88
  },
  {
    name: 'Study Groups',
    score: 65,
    participants: 75
  }
];

// Engagement data for the engagement tab
const engagementData = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), 'MMM dd'),
  activeUsers: Math.floor(Math.random() * 50) + 50,
  avgTimeSpent: Math.floor(Math.random() * 30) + 10,
  completionRate: Math.floor(Math.random() * 30) + 50
}));

// Student data for the students tab
const students = Array.from({ length: 10 }, (_, i) => {
  const progress = Math.floor(Math.random() * 50) + 50;
  const avgScore = Math.floor(Math.random() * 20) + 70;
  return {
    id: `student-${i}`,
    name: `Student ${i + 1}`,
    email: `student${i + 1}@example.com`,
    progress,
    avgScore,
    lastActive: `${Math.floor(Math.random() * 7) + 1}d ago`,
    projectsCompleted: Math.floor(Math.random() * 5) + 1,
    performance: {
      assignments: Math.floor(Math.random() * 100) + 1,
      quizzes: Math.floor(Math.random() * 100) + 1,
      projects: Math.floor(Math.random() * 100) + 1,
      participation: Math.floor(Math.random() * 100) + 1
    },
    status: progress > 75 ? 'Excellent' : progress > 50 ? 'Good' : 'Needs Improvement',
    avatar: `https://i.pravatar.cc/150?img=${i + 1}`
  };
});

// Project data for the projects tab
const projectData = [
  { 
    name: 'Project 1', 
    submissions: 45, 
    averageScore: 78, 
    minScore: 45, 
    maxScore: 95,
    submissionsData: [
      { name: 'Submitted', value: 45 },
      { name: 'Pending', value: 15 }
    ]
  },
  { 
    name: 'Project 2', 
    submissions: 38, 
    averageScore: 85, 
    minScore: 60, 
    maxScore: 98,
    submissionsData: [
      { name: 'Submitted', value: 38 },
      { name: 'Pending', value: 22 }
    ]
  },
  { 
    name: 'Project 3', 
    submissions: 52, 
    averageScore: 72, 
    minScore: 30, 
    maxScore: 90,
    submissionsData: [
      { name: 'Submitted', value: 52 },
      { name: 'Pending', value: 8 }
    ]
  },
  { 
    name: 'Project 4', 
    submissions: 28, 
    averageScore: 65, 
    minScore: 25, 
    maxScore: 85,
    submissionsData: [
      { name: 'Submitted', value: 28 },
      { name: 'Pending', value: 32 }
    ]
  },
  { 
    name: 'Project 5', 
    submissions: 42, 
    averageScore: 88, 
    minScore: 70, 
    maxScore: 100,
    submissionsData: [
      { name: 'Submitted', value: 42 },
      { name: 'Pending', value: 18 }
    ]
  }
];

// Student performance data for the radar chart
const studentPerformance = [
  { subject: 'Math', A: 75, B: 65 },
  { subject: 'Science', A: 80, B: 70 },
  { subject: 'History', A: 65, B: 75 },
  { subject: 'English', A: 85, B: 80 },
  { subject: 'Art', A: 70, B: 60 },
  { subject: 'PE', A: 90, B: 85 }
];

// Project performance data
const projectPerformance = [
  { subject: 'Project 1', A: 85, B: 78, fullMark: 100 },
  { subject: 'Project 2', A: 90, B: 82, fullMark: 100 },
  { subject: 'Project 3', A: 88, B: 85, fullMark: 100 },
  { subject: 'Project 4', A: 92, B: 88, fullMark: 100 }
];

// Performance distribution for pie chart
const performanceDistribution = [
  { name: 'Excellent', value: 25 },
  { name: 'Good', value: 35 },
  { name: 'Average', value: 25 },
  { name: 'Needs Improvement', value: 15 },
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const engagementMetrics = [
  { name: 'Video Views', value: '1,245', change: '+12%', icon: '▶️' },
  { name: 'Avg. Time Spent', value: '24m', change: '+5%', icon: '⏱️' },
  { name: 'Discussions', value: '89', change: '+23%', icon: '💬' },
  { name: 'Resource Downloads', value: '156', change: '+8%', icon: '📥' },
];

// Custom Tooltip Component
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: string | number; name: string; color: string; unit?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon,
  isLoading = false 
}: { 
  title: string; 
  value: string | number; 
  change: string; 
  icon: React.ReactNode;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {change} from last period
              </span>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DateRangePickerWithPresets = ({
  className,
  date,
  onDateChange,
}: {
  className?: string;
  date: { from: Date; to: Date } | undefined;
  onDateChange: (date: { from: Date; to: Date } | undefined) => void;
}) => {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default function InstructorAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(() => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  }));
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const dateRangePresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 },
  ];

  const handleDateRangePreset = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
    refreshData();
  };

  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return courseData;
    return courseData.filter(day => {
      const dayDate = new Date(day.date);
      return isWithinInterval(dayDate, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [dateRange]);

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track and analyze your course performance</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-2 p-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDateRangePreset(7)}>
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateRangePreset(30)}>
                    Last 30 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateRangePreset(90)}>
                    Last 90 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateRangePreset(365)}>
                    Last year
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem>
                    <Label htmlFor="course-filter">Course:</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        <SelectItem value="web-dev">Web Development</SelectItem>
                        <SelectItem value="data-science">Data Science</SelectItem>
                        <SelectItem value="mobile-dev">Mobile Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Total Students" 
              value="1,248" 
              change="+12.5%"
              isLoading={isLoading}
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard 
              title="Course Completion" 
              value="78%" 
              change="+5.2%"
              isLoading={isLoading}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <MetricCard 
              title="Avg. Project Score" 
              value="83.5" 
              change="+2.3%"
              isLoading={isLoading}
              icon={<Star className="h-5 w-5" />}
            />
            <MetricCard 
              title="Engagement Rate" 
              value="64%" 
              change="+8.1%"
              isLoading={isLoading}
              icon={<Activity className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>Student engagement and completion rates over time</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshData}
                  >
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={filteredData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#8884d8"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#82ca9d"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Area 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="students" 
                        name="Active Students" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.1} 
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="completion" 
                        name="Completion %" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Brush dataKey="date" height={30} stroke="#8884d8" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Distribution across performance levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {studentPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Performance</CardTitle>
                <CardDescription>Submissions and average scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="submissions" name="Submissions" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="averageScore" name="Avg. Score" stroke="#FF8042" strokeWidth={2} dot={{ r: 4 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Assessment</CardTitle>
                <CardDescription>Student performance by skill area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={studentPerformance}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Student Average" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Class Average" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Student Progress</CardTitle>
                  <CardDescription>Track individual student performance and engagement</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{student.name}</h4>
                        <Badge variant="outline" className="ml-2">
                          {student.avgScore}% Avg
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Progress</span>
                          <span>{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                          <span>Last active: {student.lastActive}</span>
                          <span>{student.projectsCompleted} projects</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>Detailed performance metrics for each project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projectData.map((project, index) => (
                  <div key={project.name} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.submissions} submissions • Avg. Score: {project.averageScore}%
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {index === projectData.length - 1 ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score Distribution</span>
                        <span className="font-medium">
                          {project.minScore} - {project.maxScore}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{
                            width: `${(project.averageScore - project.minScore) / (project.maxScore - project.minScore) * 100}%`,
                            marginLeft: `${(project.minScore / 100) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>Track student engagement across different activities</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newStartDate = subDays(dateRange?.from || new Date(), 7);
                        setDateRange({
                          from: newStartDate,
                          to: dateRange?.to || new Date()
                        });
                      }}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refreshData}
                    >
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={engagementData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="activeUsers" name="Active Users" fill="#8884d8" />
                      <Line yAxisId="right" type="monotone" dataKey="avgTimeSpent" name="Avg. Time Spent (min)" stroke="#82ca9d" />
                      <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion Rate (%)" stroke="#ffc658" />
                      <Brush dataKey="date" height={30} stroke="#8884d8" />
                      <ReferenceLine
                        yAxisId="right"
                        y={engagementData.map(d => d.completionRate).reduce((a, b) => a + b, 0) / engagementData.length}
                        stroke="#ffc658"
                        strokeDasharray="3 3"
                        label={{ value: 'Avg. Rate', position: 'left', fill: '#ffc658' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Engaged Activities</CardTitle>
                      <CardDescription>Most popular activities by student engagement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead>Engagement Score</TableHead>
                            <TableHead>Participants</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topActivities.map((activity, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{activity.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-full">
                                    <Progress value={activity.score} />
                                  </div>
                                  <span className="text-sm">{activity.score}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {activity.participants}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Student Enrollment & Completion</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="students" name="Enrolled Students" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="completion" name="Completion %" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Project Submissions & Scores</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="submissions" name="Submissions" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="averageScore" name="Avg. Score" stroke="#FF8042" strokeWidth={2} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Student Performance Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {studentPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-4">
            <button className="w-full flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Assignment
            </button>
            <button className="w-full flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Update Course Content
            </button>
            <button className="w-full flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Send Announcement
            </button>
            <button className="w-full flex items-center p-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
