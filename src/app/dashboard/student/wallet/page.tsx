"use client";

import { useState } from 'react';
import { Shield } from 'lucide-react';
// Using relative path to avoid path resolution issues
import StudentLayout from '../../../../components/layouts/StudentLayout';
// Using relative path to avoid path resolution issues
import WalletConnect from '../../../../components/blockchain/WalletConnect';

const StudentWalletPage = () => {
  return (
    <StudentLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Blockchain Wallet
          </h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="max-w-3xl mx-auto w-full">
            <WalletConnect />
          </div>
          
          <div className="max-w-3xl mx-auto w-full bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">About Blockchain Certificates</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-gray-600">
                SkyMirror Academy uses blockchain technology to issue tamper-proof digital certificates.
                These certificates are stored on the Ethereum blockchain as NFTs (Non-Fungible Tokens),
                providing you with a permanent, verifiable record of your achievements.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Benefits of Blockchain Certificates</h4>
                <ul className="list-disc pl-5 text-blue-700 space-y-1">
                  <li>Tamper-proof and permanent record of your achievements</li>
                  <li>Easily verifiable by employers and educational institutions</li>
                  <li>You own your credentials - they're stored in your personal wallet</li>
                  <li>Share your certificates anywhere with a simple verification link</li>
                  <li>No need to contact SkyMirror Academy to verify your certificates</li>
                </ul>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-2">How It Works</h4>
                <ol className="list-decimal pl-5 text-gray-600 space-y-2">
                  <li>
                    <span className="font-medium">Connect your wallet</span>: Use the form above to connect your Ethereum wallet to your SkyMirror account.
                  </li>
                  <li>
                    <span className="font-medium">Complete your course</span>: Finish all required projects and assessments.
                  </li>
                  <li>
                    <span className="font-medium">Receive your certificate</span>: Your instructor will issue your blockchain certificate directly to your wallet.
                  </li>
                  <li>
                    <span className="font-medium">View and share</span>: Access your certificates from your student dashboard and share the verification link with employers.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentWalletPage;
