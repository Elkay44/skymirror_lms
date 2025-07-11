"use client";

import { useEffect, useState } from 'react';

interface Certificate {
  id: string;
  courseTitle: string;
  issuedAt: string;
  blockchainUrl: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificates() {
      setLoading(true);
      setError(null);
      try {
        // Try user-specific endpoint first, fallback to automation endpoint
        let res = await fetch('/api/certificates/user');
        if (!res.ok) {
          // fallback: try automation endpoint (mock user param)
          res = await fetch('/api/certificates/automation?user=current');
        }
        if (!res.ok) throw new Error('Failed to fetch certificates');
        const data = await res.json();
        // Normalize data (assume array of certificates)
        const certs = Array.isArray(data) ? data : (data.certificates || []);
        setCertificates(certs.map((c: any) => ({
          id: c.id,
          courseTitle: c.courseTitle || c.course || 'Certificate',
          issuedAt: c.issuedAt || c.completedAt,
          blockchainUrl: c.blockchainUrl || c.certificateUrl || c.verificationUrl,
        })));
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  if (loading) {
    return <div className="p-8">Loading certificates...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!certificates || certificates.length === 0) {
    return <div className="p-8">No certificates found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Certificates</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map(cert => (
          <div key={cert.id} className="bg-white rounded shadow p-4 flex flex-col">
            <div className="font-semibold text-lg mb-2">{cert.courseTitle}</div>
            <div className="text-sm text-gray-500 mb-4">Completed: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '-'}</div>
            <a href={cert.blockchainUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 w-max">View Certificate</a>
          </div>
        ))}
      </div>
    </div>
  );
}

