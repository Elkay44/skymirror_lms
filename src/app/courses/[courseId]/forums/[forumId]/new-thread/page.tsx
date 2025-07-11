import React from "react";

// Placeholder for creating a new forum thread
export default function NewThreadPage() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Create New Thread</h1>
      <form className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Thread Title</label>
          <input type="text" className="border rounded px-2 py-1 w-full" placeholder="Enter thread title..." />
        </div>
        <div>
          <label className="block mb-1 font-medium">Content</label>
          <textarea className="border rounded px-2 py-1 w-full" rows={5} placeholder="Write your post..."></textarea>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Post Thread</button>
      </form>
    </div>
  );
}
