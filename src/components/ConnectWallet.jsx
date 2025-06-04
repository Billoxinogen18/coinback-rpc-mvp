import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle } from 'lucide-react';

const ConnectWallet = () => {
  const { userId, isAuthenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
        }
      };
      checkConnection();

      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
          toast.info("Wallet disconnected.");
        } else {
          setWalletAddress(accounts[0]);
          toast.success(`Wallet account changed to: ${accounts[0].substring(0,6)}...`);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      const handleChainChanged = (_chainId) => {
        window.location.reload();
        toast.info(`Network changed. Reloading for consistency.`);
      };
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const handleConnect = async () => {
    if (!provider) {
      toast.error('Ethereum provider (e.g., MetaMask) not found. Please install a wallet extension.');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        toast.success(`Wallet connected: ${accounts[0].substring(0,6)}...${accounts[0].substring(accounts[0].length-4)}`);
      } else {
        toast.error('No accounts found. Please ensure your wallet is unlocked and you grant permission.');
      }
    } catch (error) {
      if (error.code === 4001) {
        toast.error('Wallet connection request rejected.');
      } else {
        toast.error(`Connection failed: ${error.message || 'Unknown wallet error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (walletAddress) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-greenHighlight/10 text-greenHighlight rounded-neo-sm text-sm border border-greenHighlight/30 shadow-neo-outset-xs" title={`Connected Wallet: ${walletAddress}`}>
        <CheckCircle size={18} />
        <span>{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="neumorphic-button neumorphic-button-accent px-4 py-2 text-sm"
    >
      <Wallet size={18} />
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
};

export default ConnectWallet;