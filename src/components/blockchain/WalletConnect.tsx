"use client";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, ExternalLink, AlertTriangle, Check } from 'lucide-react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  isSaving: boolean;
  error: string | null;
  success: string | null;
}

const WalletConnect = () => {
  const { data: session } = useSession();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isSaving: false,
    error: null,
    success: null,
  });
  const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  
  // Fetch saved wallet address on component mount
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const response = await fetch('/api/user/wallet');
        const data = await response.json();
        
        if (response.ok && data.walletAddress) {
          setSavedWalletAddress(data.walletAddress);
        }
      } catch (error) {
        console.error('Error fetching wallet address:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchWalletAddress();
    } else {
      setIsLoading(false);
    }
  }, [session]);
  
  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setWalletState(prev => ({
          ...prev,
          isConnected: false,
          address: null,
        }));
      } else {
        // User switched accounts
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
        }));
      }
    };
    
    const handleChainChanged = (chainId: string) => {
      setWalletState(prev => ({
        ...prev,
        chainId,
      }));
      
      // Reload the page when the chain changes
      window.location.reload();
    };
    
    // Subscribe to events if ethereum is available
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Clean up event listeners on component unmount
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isMetaMaskInstalled]);
  
  // Connect wallet function
  const connectWallet = async () => {
    if (!isMetaMaskInstalled || !window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: 'Please install MetaMask to connect your wallet.'
      }));
      return;
    }
    
    setWalletState(prev => ({ ...prev, isSaving: true, error: null, success: null }));
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      const address = accounts[0];
      
      // Save wallet address to the server
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save wallet address');
      }
      
      setWalletState({
        isConnected: true,
        address,
        chainId,
        isSaving: false,
        error: null,
        success: 'Wallet connected successfully!',
      });
      
      setSavedWalletAddress(address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  };
  
  // Save wallet address to user profile
  const saveWalletAddress = async () => {
    if (!walletState.address) return;
    
    setWalletState(prev => ({ ...prev, isSaving: true, error: null, success: null }));
    
    try {
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletState.address,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSavedWalletAddress(walletState.address);
        setWalletState(prev => ({
          ...prev,
          isSaving: false,
          success: 'Wallet address saved successfully!',
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          isSaving: false,
          error: data.error || 'Failed to save wallet address.',
        }));
      }
    } catch (error) {
      console.error('Error saving wallet address:', error);
      setWalletState(prev => ({
        ...prev,
        isSaving: false,
        error: 'Failed to save wallet address. Please try again.',
      }));
    }
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Blockchain Wallet
        </h3>
      </div>
      
      <div className="px-6 py-5 space-y-4">
        {!isMetaMaskInstalled ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">MetaMask Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    To receive blockchain-verified certificates, you need to install MetaMask.
                    MetaMask is a crypto wallet and gateway to blockchain apps.
                  </p>
                  <p className="mt-2">
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-yellow-800 hover:text-yellow-900 flex items-center w-fit"
                    >
                      Install MetaMask
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {savedWalletAddress ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Wallet Connected</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your wallet address <span className="font-mono">{formatAddress(savedWalletAddress)}</span> is connected to your account.
                        You can receive blockchain certificates to this address.
                      </p>
                      {walletState.address && walletState.address.toLowerCase() !== savedWalletAddress.toLowerCase() && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-md p-2 text-yellow-800">
                          <p className="text-xs">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            The connected wallet ({formatAddress(walletState.address)}) is different from your saved wallet.
                            Update your wallet address if you want to use the new one for certificates.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Wallet Required</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        To receive blockchain-verified certificates, you need to connect your Ethereum wallet.
                        Your certificates will be issued as NFTs to your wallet address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {walletState.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{walletState.error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {walletState.success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{walletState.success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {!walletState.isConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Connect MetaMask Wallet
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Connected Wallet</p>
                      <p className="text-sm font-mono text-gray-900">{walletState.address}</p>
                    </div>
                    <a
                      href={`https://etherscan.io/address/${walletState.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  {(!savedWalletAddress || savedWalletAddress.toLowerCase() !== walletState.address?.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={saveWalletAddress}
                      disabled={walletState.isSaving}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {walletState.isSaving ? 'Saving...' : 'Save Wallet Address'}
                    </button>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                By connecting your wallet, you'll be able to receive blockchain-verified certificates as NFTs.
                Your wallet address will be saved to your SkyMirror Academy profile.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletConnect;
