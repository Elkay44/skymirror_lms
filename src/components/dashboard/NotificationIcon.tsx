"use client";

import Link from 'next/link';
import { Bell } from 'lucide-react';

interface NotificationIconProps {
  unreadCount?: number;
}

export default function NotificationIcon({ unreadCount = 0 }: NotificationIconProps) {
  return (
    <div className="relative">
      <Link href="/dashboard/notifications" className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none" aria-label="Notifications">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </Link>
    </div>
  );
}
