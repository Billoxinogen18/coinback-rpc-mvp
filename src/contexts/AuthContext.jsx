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
      clearSession();
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
      const signer = await provider.getSigner();
      const chainId = (await provider.getNetwork()).chainId;

      const { nonce } = await getSiweNonce(address);
      if (!nonce) throw new Error("Failed to get a sign-in nonce.");

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Sign in to Coinback RPC to access your rewards.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
      const messageToSign = siweMessage.prepareMessage();

      const signature = await signer.signMessage(messageToSign);

      const { success, token, user, message: verifyMsg } = await verifySiweSignature(messageToSign, signature);
      if (!success || !token) throw new Error(verifyMsg || "Verification failed.");
      
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
    refreshUserProfile: () => fetchUserProfile(backendJwt),
    userId: userProfile?.user_id || null,
  }), [walletAddress, userProfile, isAuthenticated, loadingAuth, backendJwt, signInWithEthereum, clearSession, fetchUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};