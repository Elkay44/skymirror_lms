"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Award, ExternalLink, RefreshCw, AlertTriangle, Share } from 'lucide-react';
// Using relative path to avoid path resolution issues
import StudentLayout from '../../../../components/layouts/StudentLayout';
import Link from 'next/link';
import Image from 'next/image';

interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  tokenId: string;
  transactionHash: string;
  issuedAt: string;
  expiresAt: string | null;
  metadataURI: string;
  course: {
    title: string;
    slug: string;
    coverImage: string;
  };
}

const StudentCertificatesPage = () => {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await fetch('/api/certificates');
        const data = await response.json();
        
        if (response.ok) {
          setCertificates(data.certificates);
        } else {
          setError(data.error || 'Failed to fetch certificates');
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setError('An error occurred while fetching your certificates. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchCertificates();
    }
  }, [session]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Share certificate via a verification URL
  const shareCertificate = (id: string) => {
    const verificationUrl = `${window.location.origin}/verify?id=${id}`;
    navigator.clipboard.writeText(verificationUrl);
    alert('Verification link copied to clipboard!');
  };
  
  return (
    <StudentLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center break-words min-w-0">
            <Award className="h-6 w-6 mr-2 text-blue-600" />
            My Certificates
          </h1>
          
          <div className="mt-4 md:mt-0">
            <Link 
              href="/dashboard/student/wallet"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 break-words min-w-0"
            >
              Manage Wallet
            </Link>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12 min-w-0">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading your certificates...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-8">
            <div className="flex min-w-0">
              <div className="flex-shrink-0 min-w-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 break-words">{error}</p>
              </div>
            </div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-8">
            <div className="flex min-w-0">
              <div className="flex-shrink-0 min-w-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 break-words">
                  You don't have any certificates yet. Complete your courses to earn blockchain-verified certificates.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col min-w-0 overflow-hidden">
                <div className="relative h-40 bg-gray-200">
                  {certificate.course.coverImage ? (
                    <Image
                      src={certificate.course.coverImage}
                      alt={certificate.course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-100 min-w-0">
                      <Award className="h-16 w-16 text-blue-400" />
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex-grow min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-1 break-words">{certificate.course.title}</h3>
                  <div className="text-sm text-gray-500 space-y-1 break-words">
                    <p>Issued: {formatDate(certificate.issuedAt)}</p>
                    {certificate.expiresAt && (
                      <p>Expires: {formatDate(certificate.expiresAt)}</p>
                    )}
                    <p className="font-mono text-xs mt-2">Token ID: {certificate.tokenId}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                  <div className="flex justify-between space-x-2 min-w-0">
                    <Link
                      href={`/verify?id=${certificate.id}`}
                      target="_blank"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 justify-center break-words min-w-0"
                    >
                      View
                      <ExternalLink className="ml-1.5 h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => shareCertificate(certificate.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 justify-center break-words min-w-0"
                    >
                      Share
                      <Share className="ml-1.5 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Information about blockchain certificates */}
        {!isLoading && !error && (
          <div className="mt-12 bg-white rounded-lg shadow overflow-hidden overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 break-words">About Your Blockchain Certificates</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-gray-600">
                Your SkyMirror Academy certificates are secured on the Ethereum blockchain, making them tamper-proof
                and permanently verifiable. Each certificate is a unique NFT (Non-Fungible Token) stored in your
                Ethereum wallet.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2 break-words">Sharing Your Certificates</h4>
                <p className="text-blue-700 mb-2">
                  You can share your certificates with employers or on social media using the verification link.
                  Anyone with this link can verify the authenticity of your certificate without needing access
                  to your account or wallet.
                </p>
                <p className="text-sm text-blue-600 break-words">
                  <strong>Tip:</strong> Click the "Share" button to copy the verification link to your clipboard.
                </p>
              </div>
              
              {certificates.length === 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2 break-words">How to Get Your Certificate</h4>
                  <ol className="list-decimal pl-5 text-gray-600 space-y-2">
                    <li>
                      <span className="font-medium break-words">Connect your wallet</span>: Go to the Wallet page and connect your Ethereum wallet.
                    </li>
                    <li>
                      <span className="font-medium break-words">Complete all course requirements</span>: Finish all required projects and assessments.
                    </li>
                    <li>
                      <span className="font-medium break-words">Certificate issuance</span>: Your instructor will issue your certificate to your wallet.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentCertificatesPage;
