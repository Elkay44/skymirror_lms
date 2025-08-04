'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  type LucideIcon
} from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  change: string;
};

type ActivityItemProps = {
  user: string;
  action: string;
  time: string;
  icon: LucideIcon;
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
      user: 'John Doe',
      action: 'created a new course',
      time: '2 minutes ago',
      icon: ArrowUpRight,
    },
    {
      user: 'Jane Smith',
      action: 'completed a lesson',
      time: '10 minutes ago',
      icon: ArrowUpRight,
    },
    {
      user: 'Bob Johnson',
      action: 'left a review',
      time: '1 hour ago',
      icon: ArrowUpRight,
    },
    {
      user: 'Alice Williams',
      action: 'started a new course',
      time: '2 hours ago',
      icon: ArrowUpRight,
    },
  ];

  const StatCard = ({ title, value, icon: Icon, change }: StatCardProps) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
          <CardTitle className="text-sm font-medium break-words">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold break-words">{value}</div>
          <p className="text-xs text-muted-foreground">{change}</p>
        </CardContent>
      </Card>
    );
  };

  const ActivityItem = ({ user, action, time, icon: Icon }: ActivityItemProps) => (
    <div className="flex items-center min-w-0">
      <div className="flex-shrink-0 min-w-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium break-words">
          <span className="text-foreground">{user}</span> {action}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col min-w-0">
      <MainNav />
      
      <div className="flex-1 min-w-0">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight break-words">Dashboard</h1>
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
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.user}>
                      <ActivityItem 
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
          </div>
        </div>
      </div>
    </div>
  );
}
