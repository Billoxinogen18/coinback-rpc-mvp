import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import StakingABI from '../abi/Staking.json';
import ERC20ABI from '../abi/ERC20.json';
import toast from 'react-hot-toast';
import { Database, Check, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

const StatCard = ({ label, value, isPrimary = false }) => (
  <div className="bg-bgBase p-4 rounded-xl text-center" style={{ boxShadow: 'var(--shadow-in)' }}>
    <p className="text-sm font-medium text-textSecondary">{label}</p>
    <p className={`text-2xl font-bold ${isPrimary ? 'text-primary' : 'text-textPrimary'}`}>{value}</p>
  </div>
);

const CbkPanel = ({ onAction }) => {
  const { walletAddress, userProfile } = useAuth();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [allowance, setAllowance] = useState(ethers.toBigInt(0));
  
  const stakingContractAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  const cbkTokenAddress = userProfile?.cbk_token_address;

  const getAllowance = useCallback(async () => {
    if (!walletAddress || !cbkTokenAddress || !stakingContractAddress || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(cbkTokenAddress, ERC20ABI, provider);
      const userAllowance = await tokenContract.allowance(walletAddress, stakingContractAddress);
      setAllowance(userAllowance);
    } catch (e) { console.error("Failed to get allowance:", e); }
  }, [walletAddress, cbkTokenAddress, stakingContractAddress]);

  useEffect(() => {
    if (userProfile && walletAddress) {
      getAllowance();
    }
  }, [userProfile, walletAddress, getAllowance, onAction]);
  
  const needsApproval = useCallback(() => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) return false;
    try {
      const amountInUnits = ethers.parseUnits(stakeAmount, 18);
      return amountInUnits > 0 && amountInUnits > allowance;
    } catch { return false; }
  }, [stakeAmount, allowance]);
  
  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading('Approving token spend...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(cbkTokenAddress, ERC20ABI, signer);
      const approveTx = await tokenContract.approve(stakingContractAddress, ethers.MaxUint256);
      await approveTx.wait();
      toast.success('Approval successful!', { id: toastId });
      await getAllowance();
    } catch (err) {
      toast.error(err?.reason || err.message || 'Approval failed.', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const executeTx = async (txPromise, { processing, success, error: errorMsg }, onFinally) => {
    setIsProcessing(true);
    const toastId = toast.loading(processing);
    try {
      const tx = await txPromise;
      await tx.wait();
      toast.success(success, { id: toastId });
      onAction(); 
      if (onFinally) onFinally();
    } catch(err) {
      toast.error(err?.reason || err.message || errorMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleStake = (e) => {
    e.preventDefault();
    if (!stakeAmount || isNaN(parseFloat(stakeAmount)) || parseFloat(stakeAmount) <= 0) return;
    const amount = ethers.parseUnits(stakeAmount, 18);
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then(signer => {
      const contract = new ethers.Contract(stakingContractAddress, StakingABI, signer);
      executeTx(contract.stake(amount), {
        processing: 'Staking CBK...',
        success: 'Stake successful!',
        error: 'Stake failed.'
      }, () => setStakeAmount(''));
    });
  };
  
  const handleUnstake = (e) => {
    e.preventDefault();
    if (!unstakeAmount || isNaN(parseFloat(unstakeAmount)) || parseFloat(unstakeAmount) <= 0) return;
    const amount = ethers.parseUnits(unstakeAmount, 18);
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then(signer => {
      const contract = new ethers.Contract(stakingContractAddress, StakingABI, signer);
      executeTx(contract.unstake(amount), {
        processing: 'Unstaking CBK...',
        success: 'Unstake successful!',
        error: 'Unstake failed.'
      }, () => setUnstakeAmount(''));
    });
  };
  
  if (!userProfile) return null;
  
  const cbkBalanceFormatted = parseFloat(ethers.formatUnits(userProfile.cbk_balance || '0', 18)).toLocaleString(undefined, {maximumFractionDigits: 2});
  const stakedCbkFormatted = parseFloat(ethers.formatUnits(userProfile.staked_cbk || '0', 18)).toLocaleString(undefined, {maximumFractionDigits: 2});

  return (
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center">
        <Database size={24} className="mr-3 text-primary"/>
        CBK Staking
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Wallet Balance" value={cbkBalanceFormatted} />
        <StatCard label="Amount Staked" value={stakedCbkFormatted} isPrimary />
      </div>

      <div className="space-y-6 pt-2">
        <form onSubmit={handleStake} className="space-y-3">
          <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="input-field" placeholder="Amount to stake"/>
          {needsApproval() ? (
            <button type="button" onClick={handleApprove} disabled={isApproving || isProcessing} className="btn w-full bg-accent/80 text-white hover:bg-accent">
              {isApproving ? <Loader2 className="animate-spin" /> : <Check size={20} />}
              Approve CBK
            </button>
          ) : (
            <button type="submit" disabled={isProcessing || isApproving || !stakeAmount} className="btn-primary w-full">
              {isProcessing ? <Loader2 className="animate-spin" /> : <ChevronUp size={20} />}
              Stake
            </button>
          )}
        </form>
        <form onSubmit={handleUnstake} className="space-y-3">
          <input type="number" value={unstakeAmount} onChange={e => setUnstakeAmount(e.target.value)} className="input-field" placeholder="Amount to unstake"/>
          <button type="submit" disabled={isProcessing || isApproving || !unstakeAmount} className="btn-secondary w-full">
            {isProcessing ? <Loader2 className="animate-spin" /> : <ChevronDown size={20} />}
            Unstake
          </button>
        </form>
      </div>
    </div>
  );
};
export default CbkPanel;