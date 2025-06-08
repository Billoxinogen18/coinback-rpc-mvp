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
    console.log("🧹 Clearing session data");
    localStorage.removeItem('coinback_jwt');
    setIsAuthenticated(false);
    setUserProfile(null);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    console.log("🔄 Starting profile refresh...");
    const token = localStorage.getItem('coinback_jwt');
    console.log("Token exists:", !!token);
    console.log("Wallet address:", walletAddress);
    
    if (!token || !walletAddress) {
        console.log("❌ Missing token or wallet address, clearing session");
        setIsAuthenticated(false);
        setUserProfile(null);
        return;
    };
    
    try {
      console.log("📡 Fetching user profile from API...");
      const profileData = await getUserProfile();
      console.log("Profile data received:", profileData);
      
      if (profileData && profileData.user_id) {
        console.log("✅ Profile refresh successful, user_id:", profileData.user_id);
        setUserProfile(profileData);
        setIsAuthenticated(true);
      } else {
        throw new Error("Invalid profile data received");
      }
    } catch (error) {
      console.error("❌ Profile refresh failed:", error.message);
      console.error("Full error:", error);
      clearSession();
    }
  }, [clearSession, walletAddress]);
  
  const autoConnectAndRefresh = useCallback(async () => {
    console.log("🔄 Starting auto-connect and refresh...");
    setLoadingAuth(true);
    const token = localStorage.getItem('coinback_jwt');
    console.log("Stored token exists:", !!token);
    
    try {
        if (!window.ethereum) {
          console.log("❌ No wallet detected");
          throw new Error("No wallet detected");
        }
        
        console.log("🔍 Checking for connected accounts...");
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentAddress = accounts?.[0] || null;
        console.log("Connected accounts:", accounts);
        console.log("Current address:", currentAddress);
        
        setWalletAddress(currentAddress);

        if (token && currentAddress) {
            console.log("✅ Token and address found, refreshing profile...");
            await refreshUserProfile();
        } else {
            console.log("❌ Missing token or address, clearing session");
            clearSession();
        }
    } catch (err) {
      console.error("❌ Auto-connect failed:", err);
      clearSession();
    } finally {
      setLoadingAuth(false);
      console.log("🏁 Auto-connect process completed");
    }
  }, [refreshUserProfile, clearSession]);

  useEffect(() => {
    console.log("🚀 AuthProvider mounted, starting auto-connect...");
    autoConnectAndRefresh();
  }, [autoConnectAndRefresh]);
  

  const signInWithEthereum = async (provider, address) => {
    console.log("🔐 --- Starting SIWE Authentication Flow ---");
    console.log("📍 Original address from wallet:", address);
    
    setLoadingAuth(true);
    try {
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      console.log("🌐 Network info:", { chainId: network.chainId, name: network.name });
      
      // CRITICAL FIX: Use checksummed address for SIWE, lowercase for backend
      const checksummedAddress = ethers.getAddress(address); // This gives proper checksum
      const normalizedAddress = address.toLowerCase(); // This is for backend consistency
      
      console.log("🔤 Address handling:");
      console.log("  - Original:", address);
      console.log("  - Checksummed (for SIWE):", checksummedAddress);
      console.log("  - Normalized (for backend):", normalizedAddress);
      
      console.log("📡 Requesting nonce from server...");
      const { nonce } = await getSiweNonce(normalizedAddress); // Backend uses lowercase
      if (!nonce) throw new Error("Could not retrieve nonce from server.");
      console.log("✅ Received nonce:", nonce);
      
      console.log("📝 Creating SIWE message...");
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksummedAddress, // SIWE library needs checksummed address
        statement: 'Sign in to Coinback RPC to access your dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: Number(network.chainId),
        nonce,
      });

      console.log("📋 SIWE Message details:");
      console.log("  - Domain:", siweMessage.domain);
      console.log("  - Address:", siweMessage.address);
      console.log("  - Chain ID:", siweMessage.chainId);
      console.log("  - Nonce:", siweMessage.nonce);

      const messageToSign = siweMessage.prepareMessage();
      console.log("📜 Message to sign:");
      console.log(messageToSign);
      
      console.log("✍️ Requesting user signature...");
      const signature = await signer.signMessage(messageToSign);
      console.log("✅ Signature received:", signature);
      
      console.log("🔐 Verifying signature with backend...");
      const { success, token, message } = await verifySiweSignature(siweMessage, signature);
      console.log("🔍 Verification response:", { success, hasToken: !!token, message });
      
      if (!success || !token) {
        throw new Error(message || "Signature verification failed.");
      }

      console.log("💾 Storing JWT token...");
      localStorage.setItem('coinback_jwt', token);
      setWalletAddress(address); // Keep original address for display
      
      console.log("👤 Refreshing user profile...");
      await refreshUserProfile();
      
      console.log("🎉 Sign-in successful!");
      toast.success("Sign-in successful!");
    } catch (error) {
      console.error("❌ SIWE flow failed:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", error);
      
      toast.error(`Sign-In failed: ${error.message || 'An unknown error occurred.'}`);
      clearSession();
    } finally {
      setLoadingAuth(false);
      console.log("🏁 SIWE authentication flow completed");
    }
  };
  
  const value = useMemo(() => ({
    walletAddress, setWalletAddress, userProfile, isAuthenticated,
    loadingAuth, signInWithEthereum, signOut: clearSession, refreshUserProfile
  }), [userProfile, walletAddress, isAuthenticated, loadingAuth, clearSession, refreshUserProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
