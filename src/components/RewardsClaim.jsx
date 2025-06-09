import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import RewardDistributorABI from '../abi/RewardDistributor.json';
import { getClaimableRewards } from '../services/api';
import { DownloadCloud, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const RewardsClaim = ({ onRewardsClaimed }) => {
    const { walletAddress, isAuthenticated } = useAuth();
    const [rewardsData, setRewardsData] = useState(null);
    const [isClaiming, setIsClaiming] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const rewardDistributorAddress = import.meta.env.VITE_REWARD_DISTRIBUTOR_CONTRACT_ADDRESS;

    const fetchRewards = useCallback(async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      };
      setIsLoading(true);
      try {
        const data = await getClaimableRewards();
        setRewardsData(data);
      } catch (error) {
        console.error(error);
        toast.error("Could not fetch claimable rewards.");
      } finally {
        setIsLoading(false);
      }
    }, [isAuthenticated]);

    useEffect(() => { fetchRewards(); }, [fetchRewards, onRewardsClaimed]);

    const handleClaim = async (claim) => {
        if (!window.ethereum || !walletAddress) return toast.error("Please connect your wallet first.");
        setIsClaiming(claim.rewardId);
        const toastId = `claim-${claim.rewardId}`;
        toast.loading('Preparing on-chain claim...', { id: toastId });
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(rewardDistributorAddress, RewardDistributorABI, signer);
            
            const tx = await contract.claim(claim.leafIndex, walletAddress, claim.amountRaw, claim.proof);
            toast.loading('Claiming reward transaction submitted...', { id: toastId });
            await tx.wait();

            toast.success('Reward claimed successfully!', { id: toastId });
            if (onRewardsClaimed) onRewardsClaimed();
        } catch (error) {
            toast.error(error?.reason || error?.data?.message || 'Transaction rejected or failed.', { id: toastId });
        } finally {
            setIsClaiming(null);
        }
    };

    if (isLoading) {
      return (
        <div className="card flex items-center justify-center p-6 min-h-[160px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <span className="ml-4 text-textSecondary">Loading Claimable Rewards...</span>
        </div>
      );
    }
    
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <DownloadCloud size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Claim Rewards</h2>
        </div>
        {rewardsData?.claims && rewardsData.claims.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-textSecondary pb-2">You have rewards from previous epochs ready to be claimed.</p>
            {rewardsData.claims.map((claim) => (
                <div key={claim.rewardId} className="flex justify-between items-center p-4 rounded-xl bg-surface/50">
                    <div>
                        <p className="font-bold text-lg text-primary text-glow-primary">{claim.amountFormatted} ETH</p>
                        <p className="text-xs text-textMuted">For Epoch ID: {claim.epochId}</p>
                    </div>
                    <button onClick={() => handleClaim(claim)} disabled={isClaiming !== null} className="btn-accent min-w-[140px]">
                      {isClaiming === claim.rewardId ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18}/>}
                      <span>{isClaiming === claim.rewardId ? 'Claiming...' : 'Claim Now'}</span>
                    </button>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 text-textMuted">
            <XCircle className="mx-auto h-12 w-12 mb-4 opacity-30"/>
            <p className="font-semibold text-lg text-textSecondary">No Rewards Available</p>
            <p className="mt-1 text-sm">There are no rewards available to claim at this time.</p>
          </div>
        )}
      </div>
    );
};
export default RewardsClaim;