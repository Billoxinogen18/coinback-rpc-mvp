import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import toast from 'react-hot-toast';
import { getSiweNonce, verifySiweSignature, getUserProfile } from '../services/api';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

const AuthContext = createContext(undefined);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem('coinback_jwt');
    setIsAuthenticated(false);
    setUserProfile(null);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const token = localStorage.getItem('coinback_jwt');
    if (!token || !walletAddress) {
        setIsAuthenticated(false);
        setUserProfile(null);
        return;
    };
    try {
      const profileData = await getUserProfile();
      if (profileData && profileData.user_id) {
        setUserProfile(profileData);
        setIsAuthenticated(true);
      } else {
        throw new Error("Invalid profile data received");
      }
    } catch (error) {
      console.error("Profile refresh failed:", error.message);
      clearSession();
    }
  }, [clearSession, walletAddress]);
  
  const autoConnectAndRefresh = useCallback(async () => {
    setLoadingAuth(true);
    const token = localStorage.getItem('coinback_jwt');
    try {
        if (!window.ethereum) throw new Error("No wallet detected");
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAddress = accounts?.[0] || null;
        setWalletAddress(currentAddress);

        if (token && currentAddress) {
            await refreshUserProfile();
        } else {
            clearSession();
        }
    } catch (err) {
      console.error("Auto-connect failed:", err);
      clearSession();
    } finally {
      setLoadingAuth(false);
    }
  }, [refreshUserProfile, clearSession]);

  useEffect(() => {
    autoConnectAndRefresh();
  }, [autoConnectAndRefresh]);
  

  const signInWithEthereum = async (provider, address) => {
    setLoadingAuth(true);
    console.log('--- AUTH_CONTEXT_VERSION_FINAL_1.1 ---');
    console.log('Starting SIWE flow with address:', address);
    
    try {
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      // CRITICAL FIX: Always normalize address to lowercase consistently
      const normalizedAddress = ethers.getAddress(address).toLowerCase();
      console.log('Normalized address for SIWE:', normalizedAddress);
      
      console.log('Requesting nonce from server...');
      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) throw new Error("Could not retrieve nonce from server.");
      
      console.log('Received nonce:', nonce);
      
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: normalizedAddress, // Use consistently normalized address
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: Number(network.chainId),
        nonce,
      });

      console.log('Created SIWE message:', siweMessage);
      
      const messageToSign = siweMessage.prepareMessage();
      console.log('Message to sign:', messageToSign);
      
      console.log('Requesting signature from wallet...');
      const signature = await signer.signMessage(messageToSign);
      console.log('Received signature:', signature);
      
      console.log('Verifying signature with server...');
      const { success, token, message } = await verifySiweSignature(siweMessage, signature);
      
      console.log('Server verification response:', { success, token: token ? 'RECEIVED' : 'NULL', message });
      
      if (!success || !token) throw new Error(message || "Signature verification failed.");

      localStorage.setItem('coinback_jwt', token);
      setWalletAddress(address); // Keep original address for display
      await refreshUserProfile();
      toast.success("Sign-in successful!");
      console.log('SIWE flow completed successfully');
    } catch (error) {
      console.error('SIWE flow failed:', error);
      console.error('Error stack:', error.stack);
      toast.error(`Sign-In failed: ${error.message || 'An unknown error occurred.'}`);
      clearSession();
    } finally {
      setLoadingAuth(false);
    }
  };
  
  const value = useMemo(() => ({
    walletAddress, setWalletAddress, userProfile, isAuthenticated,
    loadingAuth, signInWithEthereum, signOut: clearSession, refreshUserProfile
  }), [userProfile, walletAddress, isAuthenticated, loadingAuth, clearSession, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
