import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRewards, claimUserRewards as firebaseClaimRewards } from '../services/firebase'; 
import toast from 'react-hot-toast';
import { DownloadCloud, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const RewardsClaim = ({ onRewardsClaimed }) => {
  const { userId, isAuthenticated } = useAuth();
  const [claimableAmount, setClaimableAmount] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);

  const fetchRewardsData = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setIsLoadingRewards(false);
      setClaimableAmount(0);
      return;
    }
    setIsLoadingRewards(true);
    try {
      const rewardsData = await getUserRewards(userId);
      setClaimableAmount(rewardsData?.claimable || 0);
    } catch (error) {
      console.error("Error fetching rewards for claim section:", error);
      toast.error("Could not load claimable rewards amount.");
      setClaimableAmount(0);
    } finally {
      setIsLoadingRewards(false);
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    fetchRewardsData();
  }, [fetchRewardsData, onRewardsClaimed]);

  const handleClaimRewards = async () => {
    if (!userId) {
      toast.error('User not authenticated. Cannot claim rewards.');
      return;
    }
    if (claimableAmount <= 0) {
      toast.info('No rewards available to claim at the moment.');
      return;
    }

    setIsClaiming(true);
    try {
      const result = await firebaseClaimRewards(userId, claimableAmount);
      if (result.success) {
        toast.success(result.message || 'Rewards claimed successfully! (Simulated)');
        setClaimableAmount(0); 
        if (onRewardsClaimed) {
          onRewardsClaimed(); 
        } else {
          fetchRewardsData(); 
        }
      } else {
        toast.error(result.message || 'Failed to claim rewards. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error claiming rewards:', error);
      toast.error('An unexpected error occurred while claiming rewards.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isAuthenticated || !userId) {
      return null; 
  }

  if (isLoadingRewards) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-medium text-center min-h-[100px] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary mr-2"/> 
        <p className="text-muted">Loading claimable rewards...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-card p-6 rounded-xl shadow-medium print:hidden">
      <div className="flex items-center text-primary-dark mb-4">
        <DownloadCloud size={24} className="mr-3 flex-shrink-0" />
        <h2 className="text-2xl font-semibold">Claim Your Rewards</h2>
      </div>
      <p className="text-muted mb-2">
        You have <strong className="text-accent font-bold">{parseFloat(claimableAmount).toFixed(5)} ETH</strong> (simulated) available to claim.
      </p>
      <p className="text-xs text-muted mb-5">
        In a real system, claiming would involve an on-chain transaction and may incur gas fees. This is a .
      </p>
      
      {claimableAmount > 0 ? (
        <button
          onClick={handleClaimRewards}
          disabled={isClaiming || claimableAmount <= 0} 
          className="w-full px-6 py-3 bg-accent text-card font-semibold rounded-lg shadow-subtle hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2 transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isClaiming ? <Loader2 size={20} className="animate-spin"/> : <CheckCircle size={20} />}
          <span>{isClaiming ? 'Processing Claim...' : `Claim ${parseFloat(claimableAmount).toFixed(5)} ETH`}</span>
        </button>
      ) : (
        <div className="flex items-center justify-center p-4 bg-background rounded-lg text-muted border border-gray-200">
          <XCircle size={20} className="mr-2 text-gray-400" />
          <span>No rewards available to claim at this time.</span>
        </div>
      )}
       <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700 dark:text-yellow-400 text-xs flex items-start">
        <AlertTriangle size={20} className="mr-2 flex-shrink-0 text-yellow-500" />
        <span>
          Claiming is simulated and does not involve real cryptocurrency transfers.
        </span>
      </div>
    </div>
  );
};

export default RewardsClaim;
