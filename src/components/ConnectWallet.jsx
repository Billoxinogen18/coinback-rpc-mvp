import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, LogIn, LogOut, Loader2 } from 'lucide-react';

const baseButtonStyles = "flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn font-semibold transition-all duration-200 focus:outline-none transform active:scale-[0.97] focus:ring-2 focus:ring-primary/50";

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
    return <button onClick={connectAction} className={`${baseButtonStyles} bg-primary text-white shadow-button hover:bg-blue-500 hover:shadow-button-hover`}><Wallet size={18} /><span>Connect Wallet</span></button>;
  }

  return (
    <div className="flex items-center space-x-3">
      <div className={`${baseButtonStyles} bg-surface text-textPrimary shadow-sm`} title={walletAddress}>
        <CheckCircle size={18} className="text-green-500" />
        <span>{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
      </div>
      {isAuthenticated ? (
        <button onClick={signOut} className={`${baseButtonStyles} bg-surface text-textPrimary shadow-sm hover:bg-white/10 dark:hover:bg-white/5`}><LogOut size={16}/><span>Sign Out</span></button>
      ) : (
        <button onClick={signInAction} disabled={loadingAuth} className={`${baseButtonStyles} bg-primary text-white shadow-button hover:bg-blue-500 hover:shadow-button-hover`}>
          {loadingAuth ? <Loader2 size={16} className="animate-spin"/> : <LogIn size={16}/>}
          <span>{loadingAuth ? 'Verifying...' : 'Sign In'}</span>
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;