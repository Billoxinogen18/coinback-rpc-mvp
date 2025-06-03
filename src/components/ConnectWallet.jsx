import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, XCircle } from 'lucide-react';

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
          console.warn("Could not check existing wallet connection:", error.message);
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

      const handleChainChanged = (chainId) => {
        toast.info(`Network changed to: ${chainId}. Please ensure you are on the correct network.`);
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
      console.error("Error connecting wallet:", error);
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
      <div className="flex items-center space-x-2 p-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-sm border border-green-500/30" title={`Connected Wallet: ${walletAddress}`}>
        <CheckCircle size={18} className="text-green-500" />
        <span>ETH Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-4 py-2 bg-accent text-card font-medium rounded-lg shadow-subtle hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2 transition-all duration-150 flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <Wallet size={18} />
      <span>{isConnecting ? 'Connecting Wallet...' : 'Connect ETH Wallet'}</span>
    </button>
  );
};

export default ConnectWallet;
