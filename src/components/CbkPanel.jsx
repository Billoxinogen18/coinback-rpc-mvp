import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import StakingABI from '../abi/Staking.json';
import ERC20ABI from '../abi/ERC20.json';
import toast from 'react-hot-toast';
import { Database, Layers, Check, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

const CbkPanel = ({ onAction }) => {
  const { walletAddress, userProfile, refreshUserProfile } = useAuth();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [allowance, setAllowance] = useState(ethers.toBigInt(0));
  
  const stakingContractAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  const cbkTokenAddress = userProfile?.cbk_token_address;

  const getAllowance = useCallback(async () => {
    if (!walletAddress || !cbkTokenAddress || !stakingContractAddress || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(cbkTokenAddress, ERC20ABI.abi, provider);
      const userAllowance = await tokenContract.allowance(walletAddress, stakingContractAddress);
      setAllowance(userAllowance);
    } catch (e) {
      console.error("Failed to get allowance:", e);
    }
  }, [walletAddress, cbkTokenAddress, stakingContractAddress]);

  useEffect(() => {
    if (userProfile && walletAddress) {
      getAllowance();
    }
  }, [userProfile, walletAddress, getAllowance]);
  
  const needsApproval = useCallback(() => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) return false;
    try {
      return ethers.parseUnits(stakeAmount, 18) > allowance;
    } catch { return false; }
  }, [stakeAmount, allowance]);
  
  const handleApprove = async () => {
    setIsProcessing(true);
    const toastId = toast.loading('Approving token spend...');
    try {
      if (!stakingContractAddress || !cbkTokenAddress || !window.ethereum) throw new Error("Wallet not configured");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(cbkTokenAddress, ERC20ABI.abi, signer);
      const approveTx = await tokenContract.approve(stakingContractAddress, ethers.MaxUint256);
      await approveTx.wait();
      toast.success('Approval successful!', { id: toastId });
      await getAllowance();
    } catch (err) {
      toast.error(err?.reason || err.message || 'Approval failed.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeOnChainTx = async (txPromise, processingMessage, successMessage) => {
    setIsProcessing(true);
    const toastId = toast.loading(processingMessage);
    try {
      const tx = await txPromise;
      await tx.wait();
      toast.success(successMessage, { id: toastId });
      onAction();
      setStakeAmount('');
      setUnstakeAmount('');
    } catch(err) {
      toast.error(err?.reason || err.message || 'Transaction failed.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleStake = (e) => {
    e.preventDefault();
    if (!stakeAmount) return;
    const amount = ethers.parseUnits(stakeAmount, 18);
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then(signer => {
      const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI.abi, signer);
      executeOnChainTx(stakingContract.stake(amount), 'Staking CBK...', 'Stake successful!');
    });
  };
  
  const handleUnstake = (e) => {
    e.preventDefault();
    if (!unstakeAmount) return;
    const amount = ethers.parseUnits(unstakeAmount, 18);
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then(signer => {
      const stakingContract = new ethers.Contract(stakingContractAddress, StakingABI.abi, signer);
      executeOnChainTx(stakingContract.unstake(amount), 'Unstaking CBK...', 'Unstake successful!');
    });
  };
  
  if (!userProfile) return null;
  const cbkBalanceFormatted = parseFloat(ethers.formatUnits(userProfile.cbk_balance || '0', 18)).toLocaleString(undefined, {maximumFractionDigits: 2});
  const stakedCbkFormatted = parseFloat(ethers.formatUnits(userProfile.staked_cbk || '0', 18)).toLocaleString(undefined, {maximumFractionDigits: 2});

  return (
    <div className="neumorphic-outset card-base space-y-6 transition-transform hover:scale-[1.02]">
      <div className="flex items-center text-textPrimary">
        <Database size={24} className="mr-3 text-primary"/>
        <h2 className="text-2xl font-bold">CBK Staking</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="neumorphic-outset p-4 rounded-neo"><p className="text-sm font-medium text-textSecondary">Wallet Balance</p><p className="text-2xl font-bold">{cbkBalanceFormatted}</p></div>
        <div className="neumorphic-outset p-4 rounded-neo"><p className="text-sm font-medium text-textSecondary">Amount Staked</p><p className="text-2xl font-bold text-primary">{stakedCbkFormatted}</p></div>
      </div>
      <div className="space-y-6 pt-2">
        <form onSubmit={handleStake} className="space-y-3">
          <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="neumorphic-input" placeholder="Amount to stake"/>
          {needsApproval() ? (
            <button type="button" onClick={handleApprove} disabled={isProcessing} className="neumorphic-button w-full bg-accent text-white dark:text-bgBase shadow-glow-accent hover:shadow-none transition-shadow"><Check size={20} />Approve CBK</button>
          ) : (
            <button type="submit" disabled={isProcessing || !stakeAmount} className="neumorphic-button w-full bg-primary text-white dark:text-bgBase glow-on-hover"><ChevronUp size={20}/>Stake</button>
          )}
        </form>
        <form onSubmit={handleUnstake} className="space-y-3">
          <input type="number" value={unstakeAmount} onChange={e => setUnstakeAmount(e.target.value)} className="neumorphic-input" placeholder="Amount to unstake"/>
          <button type="submit" disabled={isProcessing || !unstakeAmount} className="neumorphic-button w-full glow-on-hover"><ChevronDown size={20}/>Unstake</button>
        </form>
      </div>
    </div>
  );
};
export default CbkPanel;