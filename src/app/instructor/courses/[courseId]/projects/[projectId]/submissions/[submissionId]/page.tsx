import React from "react";

// Placeholder for instructor project review UI
export default function ProjectReviewPage() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Review Project Submission</h1>
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Student Project</h2>
        <div className="mb-2">[Student's project files and description go here]</div>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Grade</label>
        <input type="number" className="border rounded px-2 py-1 w-32" placeholder="Score" />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Feedback</label>
        <textarea className="border rounded px-2 py-1 w-full" rows={3} placeholder="Write feedback..."></textarea>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Submit Grade</button>
    </div>
  );
}
