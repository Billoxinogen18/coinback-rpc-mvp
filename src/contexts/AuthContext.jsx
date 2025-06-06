import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { auth, onAuthStateChanged as firebaseOnAuthStateChanged } from '../services/firebase'; 
import { getSiweNonce, verifySiweSignature, getUserProfileFromApi, getStakingSummary, getClaimableRewards as getApiClaimableRewards } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [stakedInfo, setStakedInfo] = useState({ stakedAmount: '0', cbkBalance: '0', tokenAddress: null, rewardTier: null });
  const [claimableRewards, setClaimableRewards] = useState({ claimableAmountDisplay: '0.0', claims: [] });
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthenticatedWithBackend, setIsAuthenticatedWithBackend] = useState(false); 
  const [mEvProtectionActive, setMEvProtectionActive] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [backendJwt, setBackendJwt] = useState(() => localStorage.getItem('coinback_jwt'));

  const clearBackendSession = useCallback(() => {
    localStorage.removeItem('coinback_jwt');
    setBackendJwt(null);
    setIsAuthenticatedWithBackend(false);
    setUserProfile(null);
    setStakedInfo({ stakedAmount: '0', cbkBalance: '0', tokenAddress: null, rewardTier: null });
    setClaimableRewards({ claimableAmountDisplay: '0.0', claims: [] });
  }, []);

  const fetchFullUserProfile = useCallback(async (currentAddress, token) => {
    if (!currentAddress || !token) {
      clearBackendSession();
      setLoadingAuth(false);
      return;
    }
    setLoadingAuth(true);
    try {
      // Ensure Authorization header is set for these calls if using a new token
      const tempHeaders = { 'Authorization': `Bearer ${token}` };
      
      const [profileData, stakingData, rewardsData] = await Promise.all([
        getUserProfileFromApi(currentAddress).catch(e => { console.error("Error fetching profile:", e); return null; }),
        getStakingSummary().catch(e => { console.error("Error fetching staking summary:", e); return { stakedAmount: '0', cbkBalance: '0' }; }),
        getApiClaimableRewards().catch(e => { console.error("Error fetching claimable rewards:", e); return { claimableAmountDisplay: '0.0', claims: [] }; })
      ]);

      if (profileData) {
        setUserProfile(profileData);
        setMEvProtectionActive(profileData?.mEvProtectionActive !== undefined ? profileData.mEvProtectionActive : true);
        setIsAuthenticatedWithBackend(true);
      } else {
        // Profile fetch failed with valid token - could mean backend issue or data inconsistency
        toast.error("Could not load user profile from server.");
        clearBackendSession(); // Or handle more gracefully
      }
      setStakedInfo(stakingData || { stakedAmount: '0', cbkBalance: '0' });
      setClaimableRewards(rewardsData || { claimableAmountDisplay: '0.0', claims: [] });

    } catch (error) {
      console.error("AuthContext: Error fetching full user profile:", error);
      toast.error("Session error. Please sign in again.");
      clearBackendSession();
    } finally {
      setLoadingAuth(false);
    }
  }, [clearBackendSession]);


  useEffect(() => {
    // Firebase listener for basic session (optional)
    const unsubscribeFirebase = firebaseOnAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      // If not using backend JWT, this might be where initial loading stops
      if (!backendJwt && !user) setLoadingAuth(false); 
    });

    // Initial load or on wallet/JWT change
    if (backendJwt && walletAddress) {
      fetchFullUserProfile(walletAddress, backendJwt);
    } else if (!backendJwt) {
      // No backend session, ensure authenticated is false
      setIsAuthenticatedWithBackend(false);
      setUserProfile(null);
      setStakedInfo({ stakedAmount: '0', cbkBalance: '0', tokenAddress: null, rewardTier: null });
      setClaimableRewards({ claimableAmountDisplay: '0.0', claims: [] });
      setLoadingAuth(false); // Stop loading if no JWT to check
    }
    return () => unsubscribeFirebase();
  }, [walletAddress, backendJwt, fetchFullUserProfile]);


  const signInWithEthereum = async (provider, currentWalletAddr) => {
    if (!provider || !currentWalletAddr) {
      toast.error("Wallet not connected or address missing.");
      return false;
    }
    setLoadingAuth(true);
    try {
      const signer = await provider.getSigner();
      const { nonce } = await getSiweNonce(currentWalletAddr);
      if (!nonce) throw new Error("Failed to get nonce from backend.");

      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      const messageToSign = 
        `${window.location.host} wants you to sign in with your Ethereum account:\n` +
        `${currentWalletAddr}\n\n` +
        `Sign in with Ethereum to the app.\n\n` +
        `URI: ${window.location.origin}\n` +
        `Version: 1\n` +
        `Chain ID: ${chainId}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${new Date().toISOString()}`;
      
      const signature = await signer.signMessage(messageToSign);
      const { success, token, message: verifyMessage } = await verifySiweSignature(currentWalletAddr, messageToSign, signature);

      if (success && token) {
        localStorage.setItem('coinback_jwt', token);
        setBackendJwt(token); // This will trigger the useEffect to fetch profile
        setWalletAddress(currentWalletAddr); // Ensure walletAddress is set
        // fetchFullUserProfile will be called by useEffect due to backendJwt/walletAddress change
        toast.success("Signed in successfully!");
        return true;
      } else {
        throw new Error(verifyMessage || "SIWE verification failed.");
      }
    } catch (error) {
      console.error("SIWE Error:", error);
      toast.error(`Sign-In failed: ${error.message}`);
      clearBackendSession();
      return false;
    } finally {
      setLoadingAuth(false);
    }
  };

  const signOut = useCallback(async () => {
    if (auth.currentUser) await auth.signOut().catch(e => console.error("Firebase signout error", e));
    clearBackendSession();
    setWalletAddress(null); 
    toast.success("Signed out.");
  }, [clearBackendSession]);

  const refreshAllUserData = useCallback(() => {
    if (walletAddress && backendJwt) {
        fetchFullUserProfile(walletAddress, backendJwt);
    }
  }, [walletAddress, backendJwt, fetchFullUserProfile]);


  const value = useMemo(() => ({
    firebaseUser,
    userId: userProfile?.user_id || null, 
    walletAddress,
    userProfile, // From backend
    stakedInfo, // From backend
    claimableRewards, // From backend
    isAuthenticated: isAuthenticatedWithBackend,
    loadingAuth,
    mEvProtectionActive,
    backendJwt,
    setWalletAddress, 
    signInWithEthereum,
    signOut,
    refreshUserProfile: refreshAllUserData, // Consolidated refresh
    setMEvProtectionActive, // Allow toggling if it's a user setting
  }), [firebaseUser, walletAddress, userProfile, stakedInfo, claimableRewards, isAuthenticatedWithBackend, loadingAuth, mEvProtectionActive, backendJwt, signInWithEthereum, signOut, refreshAllUserData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
