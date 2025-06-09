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
            const contract = new ethers.Contract(rewardDistributorAddress, RewardDistributorABI.abi, signer);
            
            const tx = await contract.claim(claim.leafIndex, walletAddress, claim.amountRaw, claim.proof);
            toast.loading('Claiming reward transaction submitted...', { id: toastId });
            await tx.wait();

            toast.success('Reward claimed successfully!', { id: toastId });
            if (onRewardsClaimed) onRewardsClaimed();
        } catch (error) {
            toast.error(error?.reason || error?.data?.message || 'Transaction rejected or failed.', { id: toastId });
            console.error("Claim Error:", error);
        } finally {
            setIsClaiming(null);
        }
    };

    if (isLoading) {
      return (
        <div className="neumorphic-outset card-base flex justify-center items-center p-6 min-h-[160px]">
          <Loader2 className="animate-spin mr-3" />
          <span>Loading Claimable Rewards...</span>
        </div>
      );
    }
    
    return (
      <div className="neumorphic-outset card-base transition-transform hover:scale-[1.02]">
        <h2 className="text-2xl font-bold flex items-center mb-6">
            <DownloadCloud className="mr-3 text-primary" />
            Claim Rewards
        </h2>
        {rewardsData?.claims && rewardsData.claims.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-textSecondary pb-2">You have rewards from previous epochs ready to be claimed.</p>
            {rewardsData.claims.map((claim) => (
                <div key={claim.rewardId} className="neumorphic-outset p-4 rounded-neo flex justify-between items-center transition-shadow duration-300 hover:shadow-neo-inset">
                    <div>
                        <p className="font-bold text-lg text-primary">{claim.amountFormatted} ETH</p>
                        <p className="text-xs text-textSecondary">For Epoch ID: {claim.epochId}</p>
                    </div>
                    <button onClick={() => handleClaim(claim)} disabled={isClaiming !== null} className="neumorphic-button bg-accent text-white dark:text-bgBase shadow-glow-accent hover:shadow-none transition-shadow">
                      {isClaiming === claim.rewardId ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18}/>}
                      <span>{isClaiming === claim.rewardId ? 'Claiming...' : 'Claim'}</span>
                    </button>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 text-textSecondary">
            <XCircle className="mx-auto h-12 w-12 mb-4 opacity-30"/>
            <p className="font-semibold text-lg">No Rewards Available</p>
            <p className="mt-1">There are no rewards available to claim at this time.</p>
          </div>
        )}
      </div>
    );
};
export default RewardsClaim;