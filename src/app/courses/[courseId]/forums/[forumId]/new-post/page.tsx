import React from "react";

// Placeholder for creating a new post in a forum thread
export default function NewPostPage() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Add a Post</h1>
      <form className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Content</label>
          <textarea className="border rounded px-2 py-1 w-full" rows={5} placeholder="Write your reply..."></textarea>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Post Reply</button>
      </form>
    </div>
  );
}
