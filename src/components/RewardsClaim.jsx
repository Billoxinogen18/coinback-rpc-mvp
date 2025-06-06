import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import RewardDistributorABI from '../abi/RewardDistributor.json'; 
import { DownloadCloud, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';

const RewardsClaim = ({ onRewardsClaimed }) => {
    const { walletAddress, isAuthenticated, claimableRewards, refreshUserProfile } = useAuth();
    const [isClaiming, setIsClaiming] = useState(null); // Stores rewardId of the claim being processed

    // Load the contract address from frontend environment variables
    const rewardDistributorAddress = import.meta.env.VITE_REWARD_DISTRIBUTOR_CONTRACT_ADDRESS;

    const handleClaimReward = async (claimDetails) => {
        if (!walletAddress || !rewardDistributorAddress) {
            toast.error('Wallet or contract address not configured.');
            return;
        }
        if (!claimDetails.proof || !claimDetails.merkleRoot) {
            toast.error('Claim details from backend are incomplete.');
            return;
        }
        if (!RewardDistributorABI || RewardDistributorABI.abi.length === 0) {
            toast.error("RewardDistributor ABI is missing or empty. Cannot proceed.");
            return;
        }

        setIsClaiming(claimDetails.rewardId);
        const claimToastId = claimDetails.rewardId;

        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error("Wallet provider (e.g., MetaMask) not found!");
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const rewardContract = new ethers.Contract(rewardDistributorAddress, RewardDistributorABI.abi, signer);

            toast.loading(`Claiming ${claimDetails.amountFormatted} ${claimDetails.tokenSymbol}...`, { id: claimToastId });

            // This is the actual on-chain transaction call to the 'claim' function
            const tx = await rewardContract.claim(
                claimDetails.leafIndex,
                walletAddress,
                claimDetails.amountRaw,
                claimDetails.proof
            );

            await tx.wait(); // Wait for the transaction to be mined

            toast.success(`Successfully claimed ${claimDetails.amountFormatted} ${claimDetails.tokenSymbol}!`, { id: claimToastId });

            // Notify parent component that a claim was successful to trigger data refresh
            if (onRewardsClaimed) {
                onRewardsClaimed();
            } else if (refreshUserProfile) {
                refreshUserProfile();
            }

        } catch (error) {
            console.error("On-chain claim error:", error);
            const reason = error.reason || error.message;
            toast.error(`Claim failed: ${reason}`, { id: claimToastId });
        } finally {
            setIsClaiming(null);
        }
    };

    if (!isAuthenticated || !claimableRewards) return null;

    return (
        <div className="neumorphic-outset card-base">
            <div className="flex items-center text-primaryDark mb-4">
                <DownloadCloud size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
                <h2 className="text-2xl font-semibold">Claim Your Rewards</h2>
            </div>
            <p className="text-textSecondary mb-2">
                Total Claimable (Approx. ETH Equivalent): <strong className="text-accent font-bold text-2xl">{parseFloat(claimableRewards.claimableAmountDisplay).toFixed(5)}</strong>
            </p>
            <div className="info-box info-box-blue mb-6">
                <div className="flex items-start">
                    <Info size={28} className="mr-2.5 mt-px flex-shrink-0 text-blueHighlight" />
                    <span>Rewards are distributed via a Merkle tree. You claim your share by submitting a proof to the smart contract, which the backend provides for each reward period.</span>
                </div>
            </div>

            {claimableRewards.claims && claimableRewards.claims.length > 0 ? (
                <div className="space-y-4">
                    {claimableRewards.claims.map((claim) => (
                        <div key={claim.rewardId} className="neumorphic-outset-sm p-4 rounded-neo flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{claim.amountFormatted} {claim.tokenSymbol}</p>
                                <p className="text-xs text-textSecondary">Type: {claim.type} (Epoch: {claim.epochId})</p>
                            </div>
                            <button
                                onClick={() => handleClaimReward(claim)}
                                disabled={isClaiming === claim.rewardId}
                                className="neumorphic-button neumorphic-button-accent px-4 py-2 text-sm"
                            >
                                {isClaiming === claim.rewardId ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                <span>{isClaiming === claim.rewardId ? 'Claiming...' : 'Claim'}</span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center p-5 neumorphic-inset-sm text-textSecondary">
                    <XCircle size={22} className="mr-2.5 text-textSecondary/80" />
                    <span>No rewards are available to claim at this time.</span>
                </div>
            )}
        </div>
    );
};

export default RewardsClaim;
