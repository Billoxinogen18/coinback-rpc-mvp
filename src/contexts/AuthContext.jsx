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
    console.log('Checking for token and wallet address...', { hasToken: !!token, walletAddress });

    if (!token || !walletAddress) {
        console.log('Token or address missing, clearing session.');
        setIsAuthenticated(false);
        setUserProfile(null);
        console.groupEnd();
        return;
    };
    try {
      console.log('Fetching user profile from backend...');
      const profileData = await getUserProfile();
      console.log('Received profile data from backend:', profileData);
      if (profileData && profileData.user_id) {
        setUserProfile(profileData);
        setIsAuthenticated(true);
        console.log('Profile refresh successful, user is authenticated.');
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
        console.log('Attempting to auto-connect via eth_accounts...');
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAddress = accounts?.[0] || null;
        console.log('eth_accounts result:', { currentAddress });
        setWalletAddress(currentAddress);

        if (token && currentAddress) {
            console.log('Token and address found, refreshing profile...');
            await refreshUserProfile();
        } else {
            console.log('Token or address not found, clearing session.');
            clearSession();
        }
    } catch (err) {
      console.error("Auto-connect failed:", err);
      clearSession();
    } finally {
      console.log('Finished auto-connect. Setting loading to false.');
      setLoadingAuth(false);
    }
    console.groupEnd();
  }, [refreshUserProfile, clearSession]);

  useEffect(() => {
    console.log('%cAuthContext: Initial mount effect running autoConnectAndRefresh...', 'color: gray;');
    autoConnectAndRefresh();
  }, [autoConnectAndRefresh]);
  
  const signInWithEthereum = async (provider, address) => {
    console.group('%cAuthContext: signInWithEthereum', 'font-weight: bold; color: blue;');
    setLoadingAuth(true);
    console.log('Step 1: Received provider and address', { provider, address });
    
    try {
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      console.log('Step 2: Got signer and network from MetaMask', { signer, network });

      const checksumAddress = ethers.getAddress(address);
      const normalizedAddress = address.toLowerCase();
      console.log('Step 3: Prepared addresses', { checksumAddress, normalizedAddress });
      
      console.log('Step 4: Requesting nonce from backend using LOWERCASE address...');
      const { nonce } = await getSiweNonce(normalizedAddress);
      if (!nonce) throw new Error("Could not retrieve nonce from server.");
      console.log('Step 5: Fetched nonce from backend', { nonce });

      // --- THE FINAL, FINAL FIX ---
      // In ethers v6, network.chainId is a BigInt. The siwe library needs a Number.
      // We explicitly convert it here.
      const chainIdAsNumber = Number(network.chainId);
      console.log(`Step 6: Converted chainId from BigInt to Number.`, { original: network.chainId, converted: chainIdAsNumber });
      
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: chainIdAsNumber, // Use the converted Number
        nonce,
      });
      console.log('Step 7: Created SIWE message object', siweMessage);

      const messageToSign = siweMessage.prepareMessage();
      console.log('Step 8: Prepared message for signing. Prompting user...', { messageToSign });

      const signature = await signer.signMessage(messageToSign);
      console.log('Step 9: User signed message, got signature', { signature });
      
      console.log('Step 10: Sending message and signature to backend for verification...');
      const verificationResponse = await verifySiweSignature(siweMessage, signature);
      console.log('Step 11: Received verification response from backend', verificationResponse);

      if (!verificationResponse.success || !verificationResponse.token) {
        throw new Error(verificationResponse.message || "Signature verification failed on backend.");
      }

      console.log('Step 12: Verification successful. Storing JWT.');
      localStorage.setItem('coinback_jwt', verificationResponse.token);
      setWalletAddress(address);
      
      console.log('Step 13: Refreshing user profile with new token...');
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
