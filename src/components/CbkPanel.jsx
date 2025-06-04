import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stakeCbkTokens, unstakeCbkTokens, getUserProfile } from '../services/firebase';
import toast from 'react-hot-toast';
import { Database, Layers, DollarSign, Info, Loader2, ShieldAlert } from 'lucide-react';

const CbkPanel = ({ onCbkAction }) => {
  const { userId, userProfile: initialProfile, isAuthenticated, setUserProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState(initialProfile);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!initialProfile);

  const cbkTokenAddress = "0x2e19067cbeb38d6554d31a1a83aefc4018a1688a";

  useEffect(() => {
    const fetchProfileData = async () => {
      if (userId && isAuthenticated && !initialProfile) {
        setIsLoadingProfile(true);
        const profile = await getUserProfile(userId);
        setLocalProfile(profile);
        setUserProfile(profile);
        setIsLoadingProfile(false);
      } else if (initialProfile) {
        setLocalProfile(initialProfile);
        setIsLoadingProfile(false);
      }
    };
    fetchProfileData();
  }, [userId, isAuthenticated, initialProfile, setUserProfile]);

  const handleStake = async (e) => {
    e.preventDefault();
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount to stake.");
      return;
    }
    setIsProcessing(true);
    const result = await stakeCbkTokens(userId, amount);
    if (result.success) {
      toast.success(result.message);
      const updatedProfile = await getUserProfile(userId);
      setLocalProfile(updatedProfile);
      setUserProfile(updatedProfile);
      if (onCbkAction) onCbkAction();
    } else {
      toast.error(result.message);
    }
    setStakeAmount('');
    setIsProcessing(false);
  };

  const handleUnstake = async (e) => {
    e.preventDefault();
    const amount = parseFloat(unstakeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount to unstake.");
      return;
    }
    setIsProcessing(true);
    const result = await unstakeCbkTokens(userId, amount);
    if (result.success) {
      toast.success(result.message);
      const updatedProfile = await getUserProfile(userId);
      setLocalProfile(updatedProfile);
      setUserProfile(updatedProfile);
      if (onCbkAction) onCbkAction();
    } else {
      toast.error(result.message);
    }
    setUnstakeAmount('');
    setIsProcessing(false);
  };
  
  const getTransactionCreditInfo = () => {
    if (!localProfile || localProfile.stakedCbk < 30000) {
        return "Stake 30,000+ CBK to earn a daily transaction credit. Lesser amounts earn proportionally.";
    }
    return `Earning 1 additional transaction credit daily for staking ${localProfile.stakedCbk.toLocaleString()} CBK.`;
  };

  if (!isAuthenticated || !userId) return null;
  if (isLoadingProfile) {
    return (
      <div className="neumorphic-outset card-base text-center">
        <Loader2 size={28} className="animate-spin text-primary mx-auto mb-2" />
        <p className="text-textSecondary">Loading CBK Panel...</p>
      </div>
    );
  }
  if (!localProfile) {
      return (
          <div className="neumorphic-outset card-base text-center">
              <ShieldAlert size={32} className="mx-auto text-yellowHighlight mb-2" />
              <p className="text-textSecondary">Could not load CBK token information.</p>
          </div>
      )
  }

  return (
    <div className="neumorphic-outset card-base">
      <div className="flex items-center text-primaryDark mb-5">
        <Database size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
        <h2 className="text-2xl font-semibold">CBK Token Panel</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="neumorphic-outset-sm p-5">
          <p className="text-sm text-textSecondary font-medium mb-1.5">Your CBK Balance</p>
          <p className="text-3xl font-bold text-primary">
            {(localProfile?.cbkBalance || 0).toLocaleString()} <span className="text-lg">CBK</span>
          </p>
        </div>
        <div className="neumorphic-outset-sm p-5">
          <p className="text-sm text-textSecondary font-medium mb-1.5">Currently Staked CBK</p>
          <p className="text-3xl font-bold text-indigoHighlight">
            {(localProfile?.stakedCbk || 0).toLocaleString()} <span className="text-lg">CBK</span>
          </p>
        </div>
      </div>

      <div className="info-box info-box-blue mb-6">
        <div className="flex items-start">
            <Info size={24} className="mr-2.5 mt-px flex-shrink-0 text-blueHighlight"/>
            <p><strong>Transaction Credits:</strong> {getTransactionCreditInfo()}</p>
        </div>
        <p className="mt-1.5">Transaction credits boost your share of periodic rewards.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <form onSubmit={handleStake} className="space-y-3">
          <label htmlFor="stakeAmount" className="block text-sm font-medium text-textSecondary">Stake CBK Tokens:</label>
          <input
            type="number" id="stakeAmount" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)}
            className="neumorphic-input"
            placeholder="Amount to stake" min="1" disabled={isProcessing} />
          <button type="submit" disabled={isProcessing || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > (localProfile?.cbkBalance || 0)}
            className="neumorphic-button neumorphic-button-primary w-full">
            {isProcessing && stakeAmount ? <Loader2 size={20} className="animate-spin mr-2"/> : <Layers size={20} className="mr-2"/>}
            Stake CBK
          </button>
        </form>
        <form onSubmit={handleUnstake} className="space-y-3">
          <label htmlFor="unstakeAmount" className="block text-sm font-medium text-textSecondary">Unstake CBK Tokens:</label>
          <input type="number" id="unstakeAmount" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)}
            className="neumorphic-input"
            placeholder="Amount to unstake" min="1" disabled={isProcessing} />
          <button type="submit" disabled={isProcessing || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > (localProfile?.stakedCbk || 0)}
            className="neumorphic-button bg-indigoHighlight text-white w-full">
            {isProcessing && unstakeAmount ? <Loader2 size={20} className="animate-spin mr-2"/> : <DollarSign size={20} className="mr-2"/>}
            Unstake CBK
          </button>
        </form>
      </div>

      <div className="info-box info-box-indigo">
        <div className="flex items-start">
          <Info size={28} className="mr-2.5 flex-shrink-0 text-indigoHighlight" />
          <div>
            <p>The CBK token contract (<code>{cbkTokenAddress.substring(0,10)}...</code>) reportedly has a 2% transfer tax for non-exempt addresses, which may affect real transactions. This tax is not applied in this MVP.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CbkPanel;