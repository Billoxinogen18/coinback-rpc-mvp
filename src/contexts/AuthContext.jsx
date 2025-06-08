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
    // ...
  }, []);

  const refreshUserProfile = useCallback(async () => {
    // ...
  }, [clearSession, walletAddress]);
  
  const autoConnectAndRefresh = useCallback(async () => {
    // ...
  }, [refreshUserProfile, clearSession]);

  useEffect(() => {
    // ...
  }, [autoConnectAndRefresh]);
  
  const signInWithEthereum = async (provider, address) => {
    console.group('%cAuthContext: signInWithEthereum', 'font-weight: bold; color: blue;');
    setLoadingAuth(true);
    try {
      const signer = await provider.getSigner();
      const checksumAddress = ethers.getAddress(address);
      const normalizedAddress = address.toLowerCase();
      
      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) throw new Error("Could not retrieve nonce from server.");
      
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
      
      const verificationResponse = await verifySiweSignature(siweMessage, signature);

      if (!verificationResponse.success || !verificationResponse.token) {
        throw new Error(verificationResponse.message || "Signature verification failed on backend.");
      }

      localStorage.setItem('coinback_jwt', verificationResponse.token);
      setWalletAddress(address);
      await refreshUserProfile();
      
      toast.success("Sign-in successful!");
    } catch (error) {
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
