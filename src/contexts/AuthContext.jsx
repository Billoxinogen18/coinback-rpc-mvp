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
  
  // FINAL, SIMPLIFIED SIGN-IN FLOW
  const signInWithEthereum = async (provider, address) => {
    setLoadingAuth(true);
    try {
      // Step 1: Get a fresh nonce from the backend. This is the only place we fetch it.
      const normalizedAddress = address.toLowerCase();
      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) {
        throw new Error("Could not retrieve a sign-in nonce from the server.");
      }

      // Step 2: Create the SIWE message with the fetched nonce.
      const signer = await provider.getSigner();
      const checksumAddress = ethers.getAddress(address);
      const expectedChainId = 11155111; // Sepolia Testnet

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: expectedChainId,
        nonce, // Use the fresh nonce
      });

      // Step 3: Sign the message and verify on the backend.
      const messageToSign = siweMessage.prepareMessage();
      const signature = await signer.signMessage(messageToSign);
      const verificationResponse = await verifySiweSignature(siweMessage, signature);

      if (!verificationResponse.success || !verificationResponse.token) {
        throw new Error(verificationResponse.message || "Signature verification failed.");
      }

      // Step 4: Complete the login process.
      localStorage.setItem('coinback_jwt', verificationResponse.token);
      setWalletAddress(address);
      await refreshUserProfile();
      toast.success("Sign-in successful!");

    } catch (error) {
      toast.error(`Sign-In failed: ${error.message}`);
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
