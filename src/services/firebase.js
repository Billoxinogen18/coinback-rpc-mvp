import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  getDocs,
  updateDoc,
  increment,
  runTransaction
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTee559lASlHD_nS5_UfyrJd2jeh0LoQQ",
  authDomain: "wanlive2-1518047494273.firebaseapp.com",
  databaseURL: "https://wanlive2-1518047494273.firebaseio.com",
  projectId: "wanlive2-1518047494273",
  storageBucket: "wanlive2-1518047494273.appspot.com",
  messagingSenderId: "673023203315",
  appId: "1:673023203315:web:6369e5add0d783f5ee6486",
  measurementId: "G-3R2HTDYQY9"
};

let app;
let auth;
let db;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app); 
  }
  console.log("Firebase initialized successfully with Coinback credentials.");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  app = null; auth = null; db = null; analytics = null;
}

const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId; 
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const getUserDataPath = (userId) => `/artifacts/${currentAppId}/users/${userId}`;
const getUserTransactionsPath = (userId) => `${getUserDataPath(userId)}/transactions`;
const getUserRewardsPath = (userId) => `${getUserDataPath(userId)}/rewards`;

const ensureAuthenticated = async () => {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); 
      if (user) {
        resolve(user);
      } else {
        try {
          if (initialAuthToken) {
            const userCredential = await signInWithCustomToken(auth, initialAuthToken);
            resolve(userCredential.user);
          } else {
            const userCredential = await signInAnonymously(auth);
            resolve(userCredential.user);
          }
        } catch (error) {
          console.error("Firebase sign-in error:", error);
          reject(error);
        }
      }
    }, (error) => { 
      console.error("Firebase auth state error:", error);
      reject(error);
    });
  });
};

const getUserProfile = async (userId) => {
  if (!db || !userId) return null;
  try {
    const userDocRef = doc(db, getUserDataPath(userId)); 
    const docSnap = await getDoc(userDocRef);
    let profileData;
    if (docSnap.exists()) {
      profileData = { id: docSnap.id, ...docSnap.data() };
    } else {
      profileData = {
        userId: userId,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        rpcConfigured: false,
        cbkBalance: 50000, 
        stakedCbk: 0,
        transactionCredits: 0,
        mEvProtectionActive: true, 
      };
      await setDoc(userDocRef, profileData);
    }
    profileData.cbkBalance = typeof profileData.cbkBalance === 'number' ? profileData.cbkBalance : 50000;
    profileData.stakedCbk = typeof profileData.stakedCbk === 'number' ? profileData.stakedCbk : 0;
    profileData.transactionCredits = typeof profileData.transactionCredits === 'number' ? profileData.transactionCredits : 0;
    profileData.mEvProtectionActive = typeof profileData.mEvProtectionActive === 'boolean' ? profileData.mEvProtectionActive : true;
    return profileData;
  } catch (error) {
    console.error("Error getting/creating user profile:", error);
    return null;
  }
};

const updateUserProfile = async (userId, data) => {
  if (!db || !userId) return false;
  try {
    const userDocRef = doc(db, getUserDataPath(userId)); 
    await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
};

const stakeCbkTokens = async (userId, amountToStake) => {
  if (!db || !userId || typeof amountToStake !== 'number' || amountToStake <= 0) {
    return { success: false, message: "Invalid stake amount." };
  }
  const userProfileRef = doc(db, getUserDataPath(userId)); 
  try {
    await runTransaction(db, async (transaction) => {
      const profileSnap = await transaction.get(userProfileRef);
      if (!profileSnap.exists()) throw "User profile not found.";
      const currentBalance = profileSnap.data().cbkBalance || 0;
      if (amountToStake > currentBalance) throw "Insufficient CBK balance.";
      
      transaction.update(userProfileRef, {
        cbkBalance: increment(-amountToStake),
        stakedCbk: increment(amountToStake),
        updatedAt: serverTimestamp(),
      });
    });
    return { success: true, message: `${amountToStake} CBK staked successfully.` };
  } catch (error) {
    console.error("Error staking CBK tokens:", error);
    return { success: false, message: typeof error === 'string' ? error : "Staking failed due to a server error." };
  }
};

const unstakeCbkTokens = async (userId, amountToUnstake) => {
  if (!db || !userId || typeof amountToUnstake !== 'number' || amountToUnstake <= 0) {
    return { success: false, message: "Invalid unstake amount." };
  }
  const userProfileRef = doc(db, getUserDataPath(userId)); 
  try {
    await runTransaction(db, async (transaction) => {
      const profileSnap = await transaction.get(userProfileRef);
      if (!profileSnap.exists()) throw "User profile not found.";
      const currentStaked = profileSnap.data().stakedCbk || 0;
      if (amountToUnstake > currentStaked) throw "Amount exceeds staked CBK.";

      transaction.update(userProfileRef, {
        cbkBalance: increment(amountToUnstake),
        stakedCbk: increment(-amountToUnstake),
        updatedAt: serverTimestamp(),
      });
    });
    return { success: true, message: `${amountToUnstake} CBK unstaked successfully.` };
  } catch (error) {
    console.error("Error unstaking CBK tokens:", error);
    return { success: false, message: typeof error === 'string' ? error : "Unstaking failed due to a server error." };
  }
};

const addSimulatedTransaction = async (userId, transactionData) => {
  if (!db || !userId) return null;
  try {
    const transactionsColRef = collection(db, getUserTransactionsPath(userId));
    const newTransaction = {
      ...transactionData,
      userId: userId,
      timestamp: serverTimestamp(),
      processedByBuilder: Math.random() > 0.05, 
      profitShareContributed: Math.random() * 0.0005 + 0.0001 
    };
    const docRef = await addDoc(transactionsColRef, newTransaction);
    
    const userSummaryRef = doc(db, getUserDataPath(userId), 'summary');
    await setDoc(userSummaryRef, {
        totalTransactions: increment(1),
        lastTransactionAt: serverTimestamp()
    }, { merge: true }); 

    const userProfile = await getUserProfile(userId);
    if (userProfile && userProfile.stakedCbk >= 30000) {
        const profileRef = doc(db, getUserDataPath(userId)); 
        await updateDoc(profileRef, {
            transactionCredits: increment(1)
        });
    }
    return { id: docRef.id, ...newTransaction }; 
  } catch (error) {
    console.error("Error adding transaction:", error);
    return null;
  }
};

const getSimulatedTransactions = async (userId) => {
  if (!db || !userId) return [];
  try {
    const transactionsColRef = collection(db, getUserTransactionsPath(userId));
    const q = query(transactionsColRef); 
    const querySnapshot = await getDocs(q);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions.sort((a,b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0));
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
};

const getUserRewards = async (userId) => {
  if (!db || !userId) return { totalEarned: 0, lastClaimed: null, claimable: 0, transactionCreditsDisplay: 0 };
  try {
    const rewardsDocRef = doc(db, getUserRewardsPath(userId), 'summary');
    const rewardsSnap = await getDoc(rewardsDocRef);
    
    const userProfile = await getUserProfile(userId);
    const transactionCreditsDisplay = userProfile?.transactionCredits || 0;

    if (rewardsSnap.exists()) {
      return { id: rewardsSnap.id, ...rewardsSnap.data(), transactionCreditsDisplay };
    } else {
      const initialRewards = { 
        totalEarned: 0, 
        lastClaimed: null, 
        claimable: 0, 
        userId: userId,
        createdAt: serverTimestamp(),
        transactionCreditsDisplay: transactionCreditsDisplay
      };
      await setDoc(rewardsDocRef, initialRewards);
      return initialRewards;
    }
  } catch (error) {
    console.error("Error getting user rewards:", error);
    return { totalEarned: 0, lastClaimed: null, claimable: 0, transactionCreditsDisplay: 0 }; 
  }
};

const simulateBuilderProfitDistribution = async (userId, baseAmount) => {
  if (!db || !userId || typeof baseAmount !== 'number' || baseAmount <= 0) {
    return { success: false, message: "Invalid distribution parameters."};
  }
  try {
    const rewardsDocRef = doc(db, getUserRewardsPath(userId), 'summary');
    let distributedAmount = baseAmount;

    const userProfile = await getUserProfile(userId);
    if (userProfile && userProfile.transactionCredits > 0) {
        const creditBonusFactor = Math.min(0.5, (userProfile.transactionCredits / 10) * 0.1);
        distributedAmount += baseAmount * creditBonusFactor;
    }
    
    if (userProfile) {
        const profileRef = doc(db, getUserDataPath(userId)); 
        await updateDoc(profileRef, { transactionCredits: 0, updatedAt: serverTimestamp() });
    }

    await setDoc(rewardsDocRef, {
      claimable: increment(distributedAmount),
      totalEarned: increment(distributedAmount),
      lastDistributionAt: serverTimestamp()
    }, { merge: true }); 
    return { success: true, amountDistributed: distributedAmount };
  } catch (error) {
    console.error("Error distributing profits:", error);
    return { success: false, message: "Profit distribution failed."};
  }
};

const claimUserRewards = async (userId, claimAmount) => {
  if (!db || !userId || typeof claimAmount !== 'number' || claimAmount <= 0) {
    return { success: false, message: "Invalid claim amount." };
  }
  const rewardsDocRef = doc(db, getUserRewardsPath(userId), 'summary');
  try {
    await runTransaction(db, async (transaction) => {
      const rewardsSnap = await transaction.get(rewardsDocRef);
      if (!rewardsSnap.exists()) throw "Rewards data not found.";
      
      const currentClaimable = rewardsSnap.data().claimable || 0;
      if (currentClaimable < claimAmount) throw "Insufficient claimable balance.";

      transaction.update(rewardsDocRef, {
        claimable: increment(-claimAmount), 
        lastClaimed: serverTimestamp(),
      });

      const claimsColRef = collection(db, getUserRewardsPath(userId), 'claims');
      transaction.set(doc(claimsColRef), { 
          userId: userId,
          amountClaimed: claimAmount,
          timestamp: serverTimestamp()
      });
    });
    return { success: true, message: `Successfully claimed ${claimAmount.toFixed(5)} ETH.` };
  } catch (error) {
    console.error("Error claiming user rewards:", error);
    return { success: false, message: typeof error === 'string' ? error : "Claim process failed." };
  }
};

export {
  app, auth, db, analytics,
  ensureAuthenticated,
  getUserProfile, updateUserProfile,
  stakeCbkTokens, unstakeCbkTokens,
  addSimulatedTransaction, getSimulatedTransactions,
  getUserRewards, simulateBuilderProfitDistribution, claimUserRewards,
  onAuthStateChanged 
};