'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import client-side components
const MainNav = dynamic(
  () => import('@/components/admin/MainNav').then((mod) => mod.MainNav),
  { ssr: false }
);

import { 
  Users,
  BookOpen,
  BarChart2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon
} from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  change: string;
};

type ActivityItemProps = {
  id: number;
  user: string;
  action: string;
  time: string;
  icon: LucideIcon;
};

type QuickActionProps = {
  title: string;
  icon: LucideIcon;
  href: string;
};

export default function AdminDashboardPage() {
  // Mock data - replace with real data from your API
  const stats: StatCardProps[] = [
    {
      title: 'Total Students',
      value: '1,234',
      icon: Users,
      change: '+12% from last month',
    },
    {
      title: 'Total Courses',
      value: '45',
      icon: BookOpen,
      change: '+5% from last month',
    },
    {
      title: 'Active Users',
      value: '856',
      icon: BarChart2,
      change: '+8% from last month',
    },
    {
      title: 'Avg. Time on Site',
      value: '12m 34s',
      icon: Clock,
      change: '+2% from last month',
    },
  ];

  const recentActivities: ActivityItemProps[] = [
    {
      id: 1,
      user: 'John Doe',
      action: 'created a new course',
      time: '2 minutes ago',
      icon: ArrowUpRight,
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'completed a lesson',
      time: '10 minutes ago',
      icon: ArrowUpRight,
    },
    {
      id: 3,
      user: 'Bob Johnson',
      action: 'left a review',
      time: '1 hour ago',
      icon: ArrowUpRight,
    },
    {
      id: 4,
      user: 'Alice Williams',
      action: 'started a new course',
      time: '2 hours ago',
      icon: ArrowUpRight,
    },
  ];

  const quickActions: QuickActionProps[] = [
    {
      title: 'Create New Course',
      icon: BookOpen,
      href: '/admin/courses/new',
    },
    {
      title: 'Manage Users',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'View Reports',
      icon: BarChart2,
      href: '/admin/analytics',
    },
    {
      title: 'Site Settings',
      icon: Clock,
      href: '/admin/settings',
    },
  ] as const;

  const StatCard = ({ title, value, icon: Icon, change }: StatCardProps) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{change}</p>
        </CardContent>
      </Card>
    );
  };

  const ActivityItem = ({ id, user, action, time, icon: Icon }: ActivityItemProps) => (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium">
          <span className="text-foreground">{user}</span> {action}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );

  const QuickAction = ({ title, icon: Icon, href }: QuickActionProps) => (
    <Button 
      variant="outline" 
      className="flex flex-col items-center justify-center h-24 w-full"
      onClick={() => window.location.href = href}
    >
      <Icon className="h-6 w-6 mb-2" />
      <span className="text-sm">{title}</span>
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <div className="flex-1">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <StatCard 
                key={i} 
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                change={stat.change}
              />
            ))}
          </div>

          {/* Recent Activities */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id}>
                      <ActivityItem 
                        id={activity.id}
                        user={activity.user}
                        action={activity.action}
                        time={activity.time}
                        icon={activity.icon}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center"
                      onClick={() => window.location.href = action.href}
                    >
                      <action.icon className="h-6 w-6 mb-2" />
                      <span className="text-sm">{action.title}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
