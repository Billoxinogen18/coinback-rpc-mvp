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
    console.group('%cAuthContext: clearSession', 'color: orange;');
    console.log('Clearing session: Removing JWT and resetting state.');
    localStorage.removeItem('coinback_jwt');
    setIsAuthenticated(false);
    setUserProfile(null);
    console.groupEnd();
  }, []);

  const refreshUserProfile = useCallback(async () => {
    console.group('%cAuthContext: refreshUserProfile', 'color: purple;');
    const token = localStorage.getItem('coinback_jwt');
    if (!token || !walletAddress) {
        setIsAuthenticated(false);
        setUserProfile(null);
        console.groupEnd();
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
    console.groupEnd();
  }, [clearSession, walletAddress]);
  
  const autoConnectAndRefresh = useCallback(async () => {
    console.group('%cAuthContext: autoConnectAndRefresh', 'color: teal;');
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
    console.groupEnd();
  }, [refreshUserProfile, clearSession]);

  useEffect(() => {
    autoConnectAndRefresh();
  }, [autoConnectAndRefresh]);
  
  const signInWithEthereum = async (provider, address) => {
    console.group('%cAuthContext: signInWithEthereum', 'font-weight: bold; color: blue;');
    setLoadingAuth(true);
    try {
      const signer = await provider.getSigner();
      const checksumAddress = ethers.getAddress(address);
      const normalizedAddress = address.toLowerCase();
      
      console.log('Requesting nonce from backend...');
      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) throw new Error("Could not retrieve nonce from server.");
      
      // --- THE FINAL FIX: HARDCODE THE SEPOLIA CHAIN ID ---
      const expectedChainId = 11155111;
      
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: expectedChainId, // ALWAYS use the Sepolia chainId
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();
      const signature = await signer.signMessage(messageToSign);
      
      console.log('Sending message and signature to backend for verification...');
      const verificationResponse = await verifySiweSignature(siweMessage, signature);

      if (!verificationResponse.success || !verificationResponse.token) {
        throw new Error(verificationResponse.message || "Signature verification failed on backend.");
      }

      localStorage.setItem('coinback_jwt', verificationResponse.token);
      setWalletAddress(address);
      await refreshUserProfile();
      
      console.log('%c--- Sign-In Process Successful ---', 'font-weight: bold; color: green;');
      toast.success("Sign-in successful!");
    } catch (error) {
      console.error('%c--- Sign-In Process FAILED ---', 'font-weight: bold; color: red;');
      console.error('Full error object:', error);
      toast.error(`Sign-In failed: ${error.message || 'An unknown error occurred.'}`);
      clearSession();
    } finally {
      setLoadingAuth(false);
      console.groupEnd();
    }
  };
  
  const value = useMemo(() => ({
    walletAddress, setWalletAddress, userProfile, isAuthenticated,
    loadingAuth, signInWithEthereum, signOut: clearSession, refreshUserProfile
  }), [userProfile, walletAddress, isAuthenticated, loadingAuth, clearSession, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
