import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, LogIn, LogOut } from 'lucide-react';

const ConnectWallet = () => {
  const { 
    walletAddress, 
    setWalletAddress, 
    isAuthenticated, 
    signInWithEthereum, 
    signOut, 
    loadingAuth 
  } = useAuth();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const checkConnectionAndSet = async () => {
        setIsConnecting(true);
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && accounts[0]) {
            setWalletAddress(accounts[0]);
          } else {
            setWalletAddress(null);
            // If no accounts, ensure any lingering session is cleared
            if(isAuthenticated) signOut(); 
          }
        } catch (error) {
          console.error("Error checking initial wallet connection:", error);
          setWalletAddress(null);
        } finally {
          setIsConnecting(false);
        }
      };
      checkConnectionAndSet();

      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0 || !accounts[0]) {
          toast.info("Wallet disconnected.");
          setWalletAddress(null);
          signOut(); // Sign out from backend when wallet disconnects
        } else {
          toast.info(`Account changed to: ${accounts[0].substring(0,6)}...`);
          setWalletAddress(accounts[0]);
          // Require re-authentication with the new account
          signOut(); // Clear old session, user needs to click "Sign In" again
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      const handleChainChanged = (_chainId) => {
        toast.info(`Network changed. Please re-connect and sign in if necessary.`);
        window.location.reload(); // Simplest way to handle chain changes
      };
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    } else {
        toast.error("MetaMask or similar wallet not detected. Please install one.");
    }
  }, [setWalletAddress, signOut, isAuthenticated]);

  const handleConnect = async () => {
    if (!provider) {
      toast.error('Ethereum provider (e.g., MetaMask) not found.');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts && accounts.length > 0 && accounts[0]) {
        setWalletAddress(accounts[0]);
        toast.success(`Wallet connected: ${accounts[0].substring(0,6)}...`);
      } else {
        toast.error('No accounts found or permission denied.');
        setWalletAddress(null);
      }
    } catch (error) {
      toast.error(`Connection failed: ${error.message || 'Unknown wallet error'}`);
      setWalletAddress(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignIn = async () => {
    if (!provider || !walletAddress) {
        toast.error("Connect wallet first.");
        return;
    }
    setIsSigningIn(true);
    await signInWithEthereum(provider, walletAddress);
    setIsSigningIn(false);
  };
  
  const handleSignOut = async () => {
    await signOut();
  };

  if (loadingAuth && !walletAddress) { 
    return <div className="text-sm text-textSecondary animate-pulse">Loading Wallet...</div>;
  }

  if (walletAddress) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-3 py-2 bg-greenHighlight/10 text-greenHighlight rounded-neo-sm text-sm border border-greenHighlight/30 shadow-neo-outset-xs" title={`Connected: ${walletAddress}`}>
          <CheckCircle size={18} />
          <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
        </div>
        {!isAuthenticated && (
            <button
                onClick={handleSignIn}
                disabled={isSigningIn || loadingAuth}
                className="neumorphic-button neumorphic-button-primary px-3 py-2 text-xs"
            >
                <LogIn size={16} />
                <span>{isSigningIn ? 'Signing In...' : 'Sign In'}</span>
            </button>
        )}
         {isAuthenticated && (
            <button
                onClick={handleSignOut}
                className="neumorphic-button px-3 py-2 text-xs bg-redHighlight/10 text-redHighlight border-redHighlight/30"
            >
                <LogOut size={16}/>
                <span>Sign Out</span>
            </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting || loadingAuth}
      className="neumorphic-button neumorphic-button-accent px-4 py-2 text-sm"
    >
      <Wallet size={18} />
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
};

export default ConnectWallet;
