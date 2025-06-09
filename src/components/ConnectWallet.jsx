import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, LogIn, LogOut, Loader2 } from 'lucide-react';

const ConnectWallet = () => {
  const { walletAddress, setWalletAddress, isAuthenticated, signInWithEthereum, signOut, loadingAuth } = useAuth();
  const [provider, setProvider] = useState(null);

  const handleAccountsChanged = useCallback(() => {
    signOut();
    window.location.reload();
  }, [signOut]);
  
  useEffect(() => {
    if (window.ethereum) {
      setProvider(new ethers.BrowserProvider(window.ethereum, 'any'));
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, [handleAccountsChanged]);

  const connectAction = useCallback(async () => {
    if (!provider) return toast.error('MetaMask is not installed.');
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0] || null);
    } catch (e) {
        toast.error("Could not connect wallet. User rejected request.");
    }
  }, [provider, setWalletAddress]);

  const signInAction = useCallback(() => {
    if (provider && walletAddress) {
        signInWithEthereum(provider, walletAddress);
    }
  }, [provider, walletAddress, signInWithEthereum]);
  
  if (!walletAddress) {
    return <button onClick={connectAction} className="neumorphic-button bg-accent text-white dark:text-bgBase shadow-glow-accent transition-shadow duration-300 hover:shadow-none"><Wallet size={18} /><span>Connect Wallet</span></button>;
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="neumorphic-button" title={walletAddress}>
        <CheckCircle size={18} className="text-green-500" /><span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
      </div>
      {isAuthenticated ? (
        <button onClick={signOut} className="neumorphic-button glow-on-hover"><LogOut size={16}/><span>Sign Out</span></button>
      ) : (
        <button onClick={signInAction} disabled={loadingAuth} className="neumorphic-button bg-primary text-white dark:text-bgBase shadow-glow-primary transition-shadow duration-300 hover:shadow-none">
          {loadingAuth ? <Loader2 size={16} className="animate-spin"/> : <LogIn size={16}/>}
          <span>{loadingAuth ? 'Verifying...' : 'Sign In'}</span>
        </button>
      )}
    </div>
  );
};
export default ConnectWallet;