'use client';

import React from "react";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string | Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  isPriority?: boolean;
  relatedItemId?: string;
  relatedItemType?: string;
}

export default function NotificationDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notificationId = searchParams.get("notificationId") || "";
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!notificationId) {
      setError("No notification ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/notifications/${notificationId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Notification not found");
        const data = await res.json();
        setNotification(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load notification.");
        setLoading(false);
      });
  }, [notificationId]);

  if (loading) return <div className="px-6 py-8">Loading...</div>;
  if (error) return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Notification Details</h1>
      <div className="p-4 border rounded bg-red-50 text-red-700">{error}</div>
    </div>
  );
  if (!notification) return null;

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Notification Details</h1>
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">{notification.title}</h2>
        <p className="mb-2">{notification.message}</p>
        <div className="text-xs text-gray-500 mb-2">
          {notification.timestamp && (typeof notification.timestamp === 'string' ? new Date(notification.timestamp).toLocaleString() : notification.timestamp.toLocaleString())}
        </div>
        {notification.isPriority && (
          <div className="mb-2 text-red-600 font-semibold">Priority Notification</div>
        )}
        {notification.actionLabel && notification.actionUrl && (
          <a href={notification.actionUrl} className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200">
            {notification.actionLabel}
          </a>
        )}
        {notification.senderName && (
          <div className="mt-2 text-xs text-gray-400">From: {notification.senderName}</div>
        )}
      </div>
    </div>
  );
}

