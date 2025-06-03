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
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTee559lASlHD_nS5_UfyrJd2jeh0LoQQ", //  REPLACE WITH YOUR ACTUAL CONFIG
  authDomain: "wanlive2-1518047494273.firebaseapp.com", //  REPLACE WITH YOUR ACTUAL CONFIG
  databaseURL: "https://wanlive2-1518047494273.firebaseio.com", //  REPLACE WITH YOUR ACTUAL CONFIG
  projectId: "wanlive2-1518047494273", //  REPLACE WITH YOUR ACTUAL CONFIG
  storageBucket: "wanlive2-1518047494273.appspot.com", //  REPLACE WITH YOUR ACTUAL CONFIG
  messagingSenderId: "673023203315", //  REPLACE WITH YOUR ACTUAL CONFIG
  appId: "1:673023203315:web:6369e5add0d783f5ee6486", //  REPLACE WITH YOUR ACTUAL CONFIG
  measurementId: "G-3R2HTDYQY9" //  REPLACE WITH YOUR ACTUAL CONFIG
};

let app;
let auth;
let db;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  analytics = getAnalytics(app); 
  console.log("Firebase initialized successfully with provided config.");
} catch (error) {
  console.error("Error initializing Firebase with provided config:", error);
  app = null;
  auth = null;
  db = null;
  analytics = null;
}

const currentAppId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId; 
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const getUserDataPath = (userId) => `/artifacts/${currentAppId}/users/${userId}`;
const getUserTransactionsPath = (userId) => `${getUserDataPath(userId)}/transactions`;
const getUserRewardsPath = (userId) => `${getUserDataPath(userId)}/rewards`;

const ensureAuthenticated = async () => {
  if (!auth) {
    console.error("Firebase Auth is not initialized.");
    return null;
  }
  if (auth.currentUser) {
    return auth.currentUser;
  }
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); 
      if (user) {
        resolve(user);
      } else {
        try {
          if (initialAuthToken) {
            console.log("Attempting to sign in with custom token...");
            const userCredential = await signInWithCustomToken(auth, initialAuthToken);
            resolve(userCredential.user);
          } else {
            console.log("No custom token, attempting to sign in anonymously...");
            const userCredential = await signInAnonymously(auth);
            resolve(userCredential.user);
          }
        } catch (error) {
          console.error("Error during sign-in attempt:", error);
          reject(error);
        }
      }
    }, (error) => { 
      console.error("Auth state change error:", error);
      reject(error);
    });
  });
};

const getUserProfile = async (userId) => {
  if (!db || !userId) {
    console.error("Firestore DB not initialized or no User ID provided for getUserProfile.");
    return null;
  }
  try {
    const userDocRef = doc(db, getUserDataPath(userId), 'profile');
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      const profileData = {
        userId: userId,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        rpcConfigured: false, 
      };
      await setDoc(userDocRef, profileData);
      return profileData;
    }
  } catch (error) {
    console.error("Error getting/creating user profile for " + userId + ":", error);
    return null;
  }
};

const updateUserProfile = async (userId, data) => {
  if (!db || !userId) {
    console.error("Firestore DB not initialized or no User ID provided for updateUserProfile.");
    return false;
  }
  try {
    const userDocRef = doc(db, getUserDataPath(userId), 'profile');
    await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating user profile for " + userId + ":", error);
    return false;
  }
};

const addSimulatedTransaction = async (userId, transactionData) => {
  if (!db || !userId) {
    console.error("Firestore DB not initialized or no User ID provided for addSimulatedTransaction.");
    return null;
  }
  try {
    const transactionsColRef = collection(db, getUserTransactionsPath(userId));
    const newTransaction = {
      ...transactionData,
      userId: userId,
      timestamp: serverTimestamp(),
      processedByBuilder: Math.random() > 0.1, 
      profitShareContributed: Math.random() * 0.001 
    };
    const docRef = await addDoc(transactionsColRef, newTransaction);
    
    const userSummaryRef = doc(db, getUserDataPath(userId), 'summary');
    await setDoc(userSummaryRef, {
        totalTransactions: increment(1),
        lastTransactionAt: serverTimestamp()
    }, { merge: true }); 

    return { id: docRef.id, ...newTransaction }; 
  } catch (error) {
    console.error("Error adding simulated transaction for " + userId + ":", error);
    return null;
  }
};

const getSimulatedTransactions = async (userId) => {
  if (!db || !userId) {
    console.error("Firestore DB not initialized or no User ID provided for getSimulatedTransactions.");
    return [];
  }
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
    console.error("Error getting simulated transactions for " + userId + ":", error);
    return [];
  }
};

const getUserRewards = async (userId) => {
  if (!db || !userId) {
    console.error("Firestore DB not initialized or no User ID provided for getUserRewards.");
    return { totalEarned: 0, lastClaimed: null, claimable: 0 };
  }
  try {
    const rewardsDocRef = doc(db, getUserRewardsPath(userId), 'summary');
    const docSnap = await getDoc(rewardsDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      const initialRewards = { 
        totalEarned: 0, 
        lastClaimed: null, 
        claimable: 0, 
        userId: userId,
        createdAt: serverTimestamp()
      };
      await setDoc(rewardsDocRef, initialRewards);
      return initialRewards;
    }
  } catch (error) {
    console.error("Error getting user rewards for " + userId + ":", error);
    return { totalEarned: 0, lastClaimed: null, claimable: 0 }; 
  }
};

const simulateBuilderProfitDistribution = async (userId, amount) => {
  if (!db || !userId || typeof amount !== 'number' || amount <= 0) {
    console.error("Invalid parameters for simulateBuilderProfitDistribution.");
    return false;
  }
  try {
    const rewardsDocRef = doc(db, getUserRewardsPath(userId), 'summary');
    await setDoc(rewardsDocRef, {
      claimable: increment(amount),
      totalEarned: increment(amount),
      lastDistributionAt: serverTimestamp()
    }, { merge: true }); 
    return true;
  } catch (error) {
    console.error("Error simulating builder profit distribution for " + userId + ":", error);
    return false;
  }
};

const claimUserRewards = async (userId, claimAmount) => {
  if (!db || !userId || typeof claimAmount !== 'number' || claimAmount <= 0) {
    console.error("Invalid parameters for claimUserRewards.");
    return { success: false, message: "Invalid claim request." };
  }
  try {
    const rewardsDocRef = doc(db, getUserRewardsPath(userId), 'summary');
    const currentRewardsData = await getUserRewards(userId); 

    if (!currentRewardsData || currentRewardsData.claimable < claimAmount) {
      console.error("Attempting to claim more than available or rewards data missing.");
      return { success: false, message: "Insufficient claimable balance or error fetching rewards." };
    }

    await updateDoc(rewardsDocRef, {
      claimable: increment(-claimAmount), 
      lastClaimed: serverTimestamp(),
    });

    const claimsColRef = collection(db, getUserRewardsPath(userId), 'claims');
    await addDoc(claimsColRef, {
        userId: userId,
        amountClaimed: claimAmount,
        timestamp: serverTimestamp()
    });
    return { success: true, message: `Successfully claimed ${claimAmount.toFixed(5)} ETH (simulated).` };
  } catch (error) {
    console.error("Error claiming user rewards for " + userId + ":", error);
    return { success: false, message: "An error occurred during the claim process." };
  }
};

export {
  app,
  auth, 
  db,   
  analytics,
  ensureAuthenticated,
  getUserProfile,
  updateUserProfile,
  addSimulatedTransaction,
  getSimulatedTransactions,
  getUserRewards,
  simulateBuilderProfitDistribution,
  claimUserRewards,
  onAuthStateChanged 
};
