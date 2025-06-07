import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import { getSiweNonce, verifySiweSignature, getUserProfileFromApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [backendJwt, setBackendJwt] = useState(() => localStorage.getItem('coinback_jwt'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem('coinback_jwt');
    setBackendJwt(null);
    setIsAuthenticated(false);
    setUserProfile(null);
  }, []);

  const fetchUserProfile = useCallback(async (token) => {
    if (!token) return;
    try {
      const profile = await getUserProfileFromApi();
      setUserProfile(profile);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      clearSession(); // Clear session if profile fetch fails
    } finally {
      setLoadingAuth(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (backendJwt) {
      fetchUserProfile(backendJwt);
    } else {
      setLoadingAuth(false);
    }
  }, [backendJwt, fetchUserProfile]);
  
  const signInWithEthereum = async (provider, address) => {
    setLoadingAuth(true);
    try {
      if (!provider || !address) {
        throw new Error("Wallet is not connected.");
      }
      const signer = await provider.getSigner();
      const chainId = (await provider.getNetwork()).chainId;

      // 1. Get nonce from backend
      const { nonce } = await getSiweNonce(address);
      if (!nonce) throw new Error("Failed to get a sign-in nonce from the server.");

      // 2. Create SIWE message with the nonce
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
      const messageToSign = siweMessage.prepareMessage();

      // 3. Sign message
      const signature = await signer.signMessage(messageToSign);

      // 4. Verify signature with backend and get JWT
      const { success, token, user, message: verifyMsg } = await verifySiweSignature(messageToSign, signature);
      if (!success || !token) {
          throw new Error(verifyMsg || "Signature verification failed on the server.");
      }
      
      localStorage.setItem('coinback_jwt', token);
      setBackendJwt(token);
      setUserProfile(user);
      setIsAuthenticated(true);
      toast.success("Successfully signed in!");

    } catch (error) {
      console.error("SIWE sign-in error:", error);
      toast.error(`Sign-in failed: ${error.message}`);
      clearSession();
    } finally {
      setLoadingAuth(false);
    }
  };

  const value = useMemo(() => ({
    walletAddress, setWalletAddress,
    userProfile, setUserProfile,
    isAuthenticated,
    loadingAuth,
    signInWithEthereum,
    signOut: clearSession,
    refreshUserProfile: () => { if (backendJwt) fetchUserProfile(backendJwt); },
    userId: userProfile?.user_id || null,
    // Add other necessary values if they were in the original
    mEvProtectionActive: userProfile?.mev_protection_active ?? true, 
  }), [walletAddress, userProfile, isAuthenticated, loadingAuth, backendJwt, signInWithEthereum, clearSession, fetchUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};