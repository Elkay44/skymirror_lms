"use client";

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function MessagesPage() {
  const router = useRouter();
  const { status } = useSession();

  // Check if user is authenticated, redirect to login if not
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-gray-500">No messages yet</p>
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded"
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
