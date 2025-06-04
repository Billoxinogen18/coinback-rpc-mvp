import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRewards, claimUserRewards as firebaseClaimRewards } from '../services/firebase';
import toast from 'react-hot-toast';
import { DownloadCloud, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';

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
      toast.error("Could not load claimable rewards.");
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
      toast.error('User not authenticated.');
      return;
    }
    if (claimableAmount <= 0) {
      toast.info('No rewards available to claim.');
      return;
    }
    setIsClaiming(true);
    try {
      const result = await firebaseClaimRewards(userId, claimableAmount);
      if (result.success) {
        toast.success(result.message || 'Rewards claimed successfully!');
        setClaimableAmount(0);
        if (onRewardsClaimed) onRewardsClaimed();
      } else {
        toast.error(result.message || 'Failed to claim rewards.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred while claiming rewards.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isAuthenticated || !userId) return null;

  if (isLoadingRewards) {
    return (
      <div className="neumorphic-outset card-base text-center min-h-[120px] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary mr-2.5"/>
        <p className="text-textSecondary">Loading Claimable Rewards...</p>
      </div>
    );
  }
  
  return (
    <div className="neumorphic-outset card-base">
      <div className="flex items-center text-primaryDark mb-4">
        <DownloadCloud size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
        <h2 className="text-2xl font-semibold">Claim Your Rewards</h2>
      </div>
      <p className="text-textSecondary mb-2">
        You have <strong className="text-accent font-bold text-2xl">{parseFloat(claimableAmount).toFixed(5)} ETH</strong> available to claim.
      </p>
      <p className="text-xs text-textSecondary mb-5">
        Rewards are accrued over a cycle from shared builder profits.
      </p>
       <div className="info-box info-box-blue mb-6">
        <div className="flex items-start">
            <Info size={28} className="mr-2.5 mt-px flex-shrink-0 text-blueHighlight"/>
            <span>
                <strong>Note:</strong> In a production system, rewards are often distributed using a Merkle tree for gas efficiency and security. Users would submit a Merkle proof to a smart contract to claim their ETH. This MVP uses a direct claim for demonstration.
            </span>
        </div>
      </div>
      
      {claimableAmount > 0 ? (
        <button onClick={handleClaimRewards} disabled={isClaiming || claimableAmount <= 0}
          className="neumorphic-button neumorphic-button-accent w-full">
          {isClaiming ? <Loader2 size={20} className="animate-spin"/> : <CheckCircle size={20} />}
          <span>{isClaiming ? 'Processing Claim...' : `Claim ${parseFloat(claimableAmount).toFixed(5)} ETH`}</span>
        </button>
      ) : (
        <div className="flex items-center justify-center p-5 neumorphic-inset-sm text-textSecondary">
          <XCircle size={22} className="mr-2.5 text-textSecondary/80" />
          <span>No rewards available to claim at this time.</span>
        </div>
      )}
       <div className="info-box info-box-yellow">
        <div className="flex items-start">
          <Info size={24} className="mr-2.5 flex-shrink-0 text-yellowHighlight" />
          <span>
            Claiming does not involve real cryptocurrency transfers in this MVP.
          </span>
        </div>
      </div>
    </div>
  );
};
export default RewardsClaim;