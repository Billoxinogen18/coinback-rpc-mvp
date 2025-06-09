import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import StakingABI from '../abi/Staking.json';
import ERC20ABI from '../abi/ERC20.json';
import toast from 'react-hot-toast';
import { Database, Check, ChevronUp, ChevronDown, Loader2, Coins, TrendingUp } from 'lucide-react';

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  useEffect(() => {
    const updateMousePosition = ev => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};

const CardWrapper = ({ children, className }) => {
  const cardRef = useRef(null);
  const { x, y } = useMousePosition();

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const auroraX = ((x - rect.left) / rect.width) * 100;
      const auroraY = ((y - rect.top) / rect.height) * 100;
      cardRef.current.style.setProperty('--aurora-x', `${auroraX}%`);
      cardRef.current.style.setProperty('--aurora-y', `${auroraY}%`);
    }
  }, [x, y]);

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  );
};

const ButtonWrapper = ({ children, onClick, disabled, className }) => {
    const btnRef = useRef(null);
    const { x, y } = useMousePosition();
  
    useEffect(() => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const spotlightX = ((x - rect.left) / rect.width) * 100;
        const spotlightY = ((y - rect.top) / rect.height) * 100;
        btnRef.current.style.setProperty('--spotlight-x', `${spotlightX}%`);
        btnRef.current.style.setProperty('--spotlight-y', `${spotlightY}%`);
      }
    }, [x, y]);
  
    return (
      <button ref={btnRef} onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    );
  };
  

const StatCard = ({ label, value, isPrimary = false, icon: Icon, subtitle }) => (
  <div className={`${isPrimary ? 'stat-card-primary' : 'stat-card'} group hover:scale-105 transition-transform duration-200`}>
    <div className="flex items-center justify-center mb-3">
      {Icon && <Icon size={24} className={`${isPrimary ? 'text-primary' : 'text-textSecondary'} icon-neumorphic`} />}
    </div>
    <p className="text-xs font-medium text-textMuted uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold mb-1 ${isPrimary ? 'text-primary text-glow-primary' : 'text-textPrimary'}`}>
      {value}
    </p>
    {subtitle && (
      <p className="text-xs text-textMuted">{subtitle}</p>
    )}
  </div>
);

const CbkPanel = ({ onAction }) => {
  const { walletAddress, userProfile } = useAuth();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [allowance, setAllowance] = useState(ethers.toBigInt(0));
  
  // --- DEFINITIVE FIX ---
  // Source contract addresses from secure, static environment variables.
  const stakingContractAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  const cbkTokenAddress = import.meta.env.VITE_CBK_TOKEN_ADDRESS;
  // --- END OF FIX ---

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
    // Only run if we have a profile and wallet connected.
    if (userProfile && walletAddress) {
      getAllowance();
    }
  }, [userProfile, walletAddress, getAllowance, onAction]); // This will re-run when onAction is called
  
  const needsApproval = useCallback(() => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) return false;
    try {
      const amountInUnits = ethers.parseUnits(stakeAmount, 18);
      return amountInUnits > 0 && amountInUnits > allowance;
    } catch { return false; }
  }, [stakeAmount, allowance]);
  
  const handleApprove = async () => {
    if (!cbkTokenAddress || !stakingContractAddress) {
        toast.error("App configuration is missing. Please contact support.");
        return;
    }
    
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
  
  // This prevents the component from rendering with stale or incomplete data
  if (!userProfile) return null;
  
  // Now these values will be correctly populated from the API response
  const cbkBalanceFormatted = parseFloat(ethers.formatUnits(userProfile.cbk_balance || '0', 18)).toLocaleString(undefined, {maximumFractionDigits: 2});
  const stakedCbkFormatted = parseFloat(ethers.formatUnits(userProfile.staked_cbk || '0', 18)).toLocaleString(undefined, {maximumFractionDigits: 2});

  return (
    <CardWrapper className="card space-y-8">
      <div className="flex items-center gap-3">
        <Database size={20} className="text-primary icon-neumorphic"/>
        <h2 className="text-xl font-bold">CBK Staking</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Wallet Balance" value={cbkBalanceFormatted} icon={Coins} subtitle="CBK"/>
        <StatCard label="Amount Staked" value={stakedCbkFormatted} isPrimary icon={TrendingUp} subtitle="CBK"/>
      </div>

      <div className="space-y-6 pt-2">
        <form onSubmit={e => e.preventDefault()} className="space-y-4">
          <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="input-field" placeholder="Amount to stake"/>
          {needsApproval() ? (
            <ButtonWrapper onClick={handleApprove} disabled={isApproving || isProcessing} className="btn-accent w-full">
              {(isApproving) ? <Loader2 className="animate-spin-slow" /> : <Check size={20} className="icon-neumorphic"/>}
              Approve CBK Spend
            </ButtonWrapper>
          ) : (
            <ButtonWrapper onClick={handleStake} disabled={isProcessing || !stakeAmount || isApproving} className="btn-primary w-full">
              {isProcessing && !isApproving ? <Loader2 className="animate-spin-slow" /> : <ChevronUp size={20} className="icon-neumorphic"/>}
              Stake
            </ButtonWrapper>
          )}
        </form>
        <form onSubmit={e => e.preventDefault()} className="space-y-4">
          <input type="number" value={unstakeAmount} onChange={e => setUnstakeAmount(e.target.value)} className="input-field" placeholder="Amount to unstake"/>
          <ButtonWrapper onClick={handleUnstake} disabled={isProcessing || !unstakeAmount} className="btn-secondary w-full">
            {isProcessing ? <Loader2 className="animate-spin-slow" /> : <ChevronDown size={20} className="icon-neumorphic"/>}
            Unstake
          </ButtonWrapper>
        </form>
      </div>
    </CardWrapper>
  );
};
export default CbkPanel;