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
    console.log('--- CLEARING_SESSION ---');
    localStorage.removeItem('coinback_jwt');
    setIsAuthenticated(false);
    setUserProfile(null);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    console.log('--- REFRESHING_USER_PROFILE ---');
    const token = localStorage.getItem('coinback_jwt');
    console.log('Token exists:', !!token);
    console.log('Wallet address:', walletAddress);
    
    if (!token || !walletAddress) {
        console.log('No token or wallet address, clearing session');
        setIsAuthenticated(false);
        setUserProfile(null);
        return;
    };
    try {
      console.log('Fetching user profile...');
      const profileData = await getUserProfile();
      console.log('Profile data received:', profileData);
      
      if (profileData && profileData.user_id) {
        setUserProfile(profileData);
        setIsAuthenticated(true);
        console.log('✅ Profile refresh successful');
      } else {
        throw new Error("Invalid profile data received");
      }
    } catch (error) {
      console.error("❌ Profile refresh failed:", error.message);
      clearSession();
    }
  }, [clearSession, walletAddress]);
  
  const autoConnectAndRefresh = useCallback(async () => {
    console.log('--- AUTO_CONNECT_AND_REFRESH ---');
    setLoadingAuth(true);
    const token = localStorage.getItem('coinback_jwt');
    console.log('Existing token:', !!token);
    
    try {
        if (!window.ethereum) {
          console.log('No wallet detected');
          throw new Error("No wallet detected");
        }
        
        console.log('Checking for connected accounts...');
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAddress = accounts?.[0] || null;
        console.log('Connected accounts:', accounts);
        console.log('Current address:', currentAddress);
        
        setWalletAddress(currentAddress);

        if (token && currentAddress) {
            console.log('Token and address found, refreshing profile...');
            await refreshUserProfile();
        } else {
            console.log('Missing token or address, clearing session');
            clearSession();
        }
    } catch (err) {
      console.error("❌ Auto-connect failed:", err);
      clearSession();
    } finally {
      setLoadingAuth(false);
      console.log('Auto-connect completed');
    }
  }, [refreshUserProfile, clearSession]);

  useEffect(() => {
    autoConnectAndRefresh();
  }, [autoConnectAndRefresh]);
  

  const signInWithEthereum = async (provider, address) => {
    console.log('--- AUTH_CONTEXT_VERSION_FINAL_1.2 ---');
    console.log('Starting SIWE flow with address:', address);
    
    setLoadingAuth(true);
    try {
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      console.log('Network:', network);
      
      // CRITICAL FIX: Use checksum address for SIWE message
      // Backend should also handle both formats consistently
      const checksumAddress = ethers.getAddress(address);
      const normalizedAddress = address.toLowerCase(); // For backend API calls
      
      console.log('Original address:', address);
      console.log('Checksum address for SIWE:', checksumAddress);
      console.log('Normalized address for backend:', normalizedAddress);
      
      console.log('Requesting nonce from server...');
      // Use lowercase address for backend API call (as backend stores lowercase)
      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) throw new Error("Could not retrieve nonce from server.");
      
      console.log('Received nonce:', nonce);
      
      // CRITICAL: Use checksum address in SIWE message to match what SIWE library expects
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress, // Use checksum address here!
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: Number(network.chainId),
        nonce,
      });

      console.log('SIWE message created:', {
        domain: siweMessage.domain,
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        nonce: siweMessage.nonce
      });

      const messageToSign = siweMessage.prepareMessage();
      console.log('Message to sign:', messageToSign);
      
      console.log('Requesting signature from wallet...');
      const signature = await signer.signMessage(messageToSign);
      console.log('Signature received, length:', signature.length);
      
      console.log('Verifying signature with backend...');
      const { success, token, message } = await verifySiweSignature(siweMessage, signature);
      console.log('Verification result:', { success, hasToken: !!token, message });
      
      if (!success || !token) throw new Error(message || "Signature verification failed.");

      localStorage.setItem('coinback_jwt', token);
      setWalletAddress(address); // Keep original address for display
      
      console.log('Refreshing user profile after successful auth...');
      await refreshUserProfile();
      toast.success("Sign-in successful!");
      console.log('✅ SIWE flow completed successfully');
      
    } catch (error) {
      console.error('❌ SIWE flow failed:', error);
      console.log('Error type:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      
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
