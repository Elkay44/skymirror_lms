'use client';
import { useState } from 'react';

const faqs = [
  { q: 'How do I reset my password?', a: 'Go to settings > account and click reset password.' },
  { q: 'How do I contact my instructor?', a: 'Use the Messages feature or the course forum.' },
  { q: 'Where can I download my certificates?', a: 'Visit the Certificates page from your dashboard.' },
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 break-words">Support & Help Center</h1>
      <div className="mb-8">
        <h2 className="font-semibold mb-2 break-words">Frequently Asked Questions</h2>
        <ul className="space-y-2">
          {faqs.map((faq, idx) => (
            <li key={idx} className="bg-white rounded shadow p-4 overflow-hidden">
              <button className="w-full text-left font-semibold break-words" onClick={() => setOpen(open === idx ? null : idx)}>{faq.q}</button>
              {open === idx && <div className="mt-2 text-gray-700">{faq.a}</div>}
            </li>
          ))}
        </ul>
      </div>
      <form className="bg-white rounded shadow p-4 max-w-lg overflow-hidden">
        <label className="block mb-2 font-semibold break-words">Contact Support</label>
        <input type="email" placeholder="Your email" className="border rounded w-full p-2 mb-2" />
        <textarea className="border rounded w-full p-2 mb-4" rows={3} placeholder="Describe your issue..." />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send</button>
      </form>
    </div>
  );
}

