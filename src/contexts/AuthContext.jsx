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
      clearSession();
    }
  }, [clearSession, walletAddress]);

  const autoConnectAndRefresh = useCallback(async () => {
    setLoadingAuth(true);
    const token = localStorage.getItem('coinback_jwt');
    try {
        if (!window.ethereum) {
          throw new Error("No wallet detected");
        }
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAddress = accounts?.[0] || null;
        setWalletAddress(currentAddress);

        if (token && currentAddress) {
            await refreshUserProfile();
        } else {
            clearSession();
        }
    } catch (err) {
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
    try {
      const signer = await provider.getSigner();
      const checksumAddress = ethers.getAddress(address);
      const normalizedAddress = address.toLowerCase();
      const sepoliaChainId = 11155111;

      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) throw new Error("Could not retrieve nonce from server.");

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: sepoliaChainId,
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();
      const signature = await signer.signMessage(messageToSign);
      const { success, token, message } = await verifySiweSignature(siweMessage, signature);
      if (!success || !token) throw new Error(message || "Signature verification failed.");

      localStorage.setItem('coinback_jwt', token);
      setWalletAddress(address);
      await refreshUserProfile();
      toast.success("Sign-in successful!");

    } catch (error) {
      toast.error(`Sign-In failed: ${error.message || 'An unknown error occurred.'}`);
      clearSession();
    } finally {
      setLoadingAuth(false);
    }
  };

  const value = useMemo(() => ({
    walletAddress, setWalletAddress, userProfile, isAuthenticated,
    loadingAuth, signInWithEthereum, signOut: clearSession, refreshUserProfile
  }), [userProfile, walletAddress, isAuthenticated, loadingAuth, clearSession, refreshUserProfile, signInWithEthereum]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
