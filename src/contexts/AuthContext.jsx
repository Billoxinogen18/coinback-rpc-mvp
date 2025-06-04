import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { auth, ensureAuthenticated, getUserProfile, onAuthStateChanged as firebaseOnAuthStateChanged } from '../services/firebase';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mEvProtectionActive, setMEvProtectionActive] = useState(true);

  useEffect(() => {
    const attemptAuth = async () => {
      if (!auth) { 
        setLoadingAuth(false); 
        return () => {}; 
      }

      setLoadingAuth(true);
      const unsubscribe = firebaseOnAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          setMEvProtectionActive(profile?.mEvProtectionActive !== undefined ? profile.mEvProtectionActive : true);
        } else {
          try {
            const ensuredUser = await ensureAuthenticated(); 
            if (ensuredUser) {
              setCurrentUser(ensuredUser);
              setIsAuthenticated(true);
              const profile = await getUserProfile(ensuredUser.uid);
              setUserProfile(profile);
              setMEvProtectionActive(profile?.mEvProtectionActive !== undefined ? profile.mEvProtectionActive : true);
            } else {
              setCurrentUser(null);
              setUserProfile(null);
              setIsAuthenticated(false);
              setMEvProtectionActive(false);
            }
          } catch (authError) {
            console.error("AuthContext: Error during ensureAuthenticated:", authError);
            setCurrentUser(null);
            setUserProfile(null);
            setIsAuthenticated(false);
            setMEvProtectionActive(false);
          }
        }
        setLoadingAuth(false);
      });
      return () => unsubscribe();
    };
    attemptAuth();
  }, []); 

  const value = useMemo(() => ({
    currentUser,
    userId: currentUser?.uid || null,
    userProfile,
    isAuthenticated,
    loadingAuth,
    mEvProtectionActive,
    setUserProfile, 
  }), [currentUser, userProfile, isAuthenticated, loadingAuth, mEvProtectionActive]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
