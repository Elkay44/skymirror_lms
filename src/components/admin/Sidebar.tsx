'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard as DashboardIcon,
  Users as UsersIcon,
  Book as BookIcon,
  FileText as FileTextIcon,
  BarChart2 as ChartIcon,
  Settings as SettingsIcon,
  type LucideIcon
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: UsersIcon,
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: BookIcon,
  },
  {
    title: 'Content',
    href: '/admin/content',
    icon: FileTextIcon,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: ChartIcon,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: SettingsIcon,
  },
];

// Sidebar component
export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-background">
          <Link href="/admin/dashboard" className="flex items-center">
            <span className="text-xl font-bold">Admin Dashboard</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-background space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                  )}
                >
                  <Icon className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'
                  )} />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
