import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import StakingABI from '../abi/Staking.json';
import ERC20ABI from '../abi/ERC20.json';
import toast from 'react-hot-toast';
import { Database, Check, ChevronUp, ChevronDown, Loader2, Coins, TrendingUp } from 'lucide-react';

// IMPORTANT: Use these addresses directly without any modifications
// These are the correct addresses with proper checksums
// Corrected checksum for staking contract address
const STAKING_CONTRACT_ADDRESS = "0xa4F5D4AFD8697D35c5d5A4A9E51683f76Fb863f9";
const CBK_TOKEN_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";

// The rest of the imports and utility functions remain the same
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

// Workaround for contract creation to avoid checksum issues
const createContract = async (address, abi, signer) => {
  try {
    // Ensure address has proper checksum
    const checksumAddress = ethers.getAddress(address);
    
    // Create the contract interface directly from ABI
    const contractInterface = new ethers.Interface(abi);
    
    // Create a contract instance with the interface and address
    return new ethers.Contract(checksumAddress, contractInterface, signer);
  } catch (error) {
    console.error("Error creating contract:", error);
    throw error;
  }
};

const CbkPanel = ({ onAction }) => {
  const { walletAddress, userProfile, refreshUserProfile } = useAuth();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [allowance, setAllowance] = useState(ethers.toBigInt(0));
  // New: Track live on-chain balances
  const [walletTokenBalance, setWalletTokenBalance] = useState(ethers.toBigInt(0));
  const [stakedTokenBalance, setStakedTokenBalance] = useState(ethers.toBigInt(0));
  // Summary API values (backend-calculated)
  const [summaryWalletBalance, setSummaryWalletBalance] = useState(null);
  const [summaryStakedBalance, setSummaryStakedBalance] = useState(null);
  
  // Debug logging to help troubleshoot
  useEffect(() => {
    console.log("CbkPanel mounted with:", {
      walletAddress,
      userProfile: userProfile ? "exists" : "missing",
      stakingContract: STAKING_CONTRACT_ADDRESS,
      cbkToken: CBK_TOKEN_ADDRESS
    });
  }, [walletAddress, userProfile]);

  const getAllowance = useCallback(async () => {
    if (!walletAddress || !window.ethereum) {
      console.log("Cannot get allowance, missing wallet or ethereum provider");
      return;
    }
    
    try {
      // Create a provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Ensure addresses have proper checksum
      const checksumTokenAddress = ethers.getAddress(CBK_TOKEN_ADDRESS);
      const checksumStakingAddress = ethers.getAddress(STAKING_CONTRACT_ADDRESS);
      const checksumWalletAddress = ethers.getAddress(walletAddress);
      
      // Log the addresses being used
      console.log("Getting allowance with addresses:", {
        token: checksumTokenAddress,
        staking: checksumStakingAddress,
        wallet: checksumWalletAddress
      });
      
      // Create contract using the utility function
      const tokenContract = await createContract(checksumTokenAddress, ERC20ABI, provider);
      
      const userAllowance = await tokenContract.allowance(checksumWalletAddress, checksumStakingAddress);
      console.log("Got allowance:", userAllowance.toString());
      setAllowance(userAllowance);
    } catch (e) { 
      console.error("Failed to get allowance:", e); 
    }
  }, [walletAddress]);

  // Fetch live on-chain wallet CBK balance and staked CBK
  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Ensure checksummed addresses
      const checksumWallet = ethers.getAddress(walletAddress);
      const checksumTokenAddress = ethers.getAddress(CBK_TOKEN_ADDRESS);
      const checksumStakingAddress = ethers.getAddress(STAKING_CONTRACT_ADDRESS);

      // Token contract (read-only)
      const tokenContract = await createContract(checksumTokenAddress, ERC20ABI, provider);
      const balance = await tokenContract.balanceOf(checksumWallet);

      // Staking contract (read-only)
      const stakingContract = await createContract(checksumStakingAddress, StakingABI, provider);
      let staked = ethers.toBigInt(0);
      try {
        staked = await stakingContract.stakedBalances(checksumWallet);
      } catch (innerErr) {
        console.warn("stakedBalances() not available or failed; defaulting to 0", innerErr);
      }

      setWalletTokenBalance(balance);
      setStakedTokenBalance(staked);
    } catch (err) {
      console.error("Error fetching on-chain balances:", err);
    }
  }, [walletAddress]);

  // Fetch summary via backend API (requires auth)
  const fetchSummary = useCallback(async () => {
    try {
      const { getStakingSummary } = await import('../services/api');
      const summary = await getStakingSummary();
      if (summary) {
        const decimals = userProfile?.cbk_decimals || 18;
        setSummaryWalletBalance(ethers.parseUnits(summary.cbkBalance, decimals));
        setSummaryStakedBalance(ethers.parseUnits(summary.stakedAmount, decimals));
      }
    } catch (err) {
      console.warn('Could not fetch staking summary:', err.message);
    }
  }, [userProfile]);

  // Refresh balances whenever wallet connects or an action completes
  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
      getAllowance();
      fetchSummary();
    }
  }, [walletAddress, fetchBalances, getAllowance, fetchSummary, onAction]);
  
  const needsApproval = useCallback(() => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) return false;
    try {
      const tokenDecimals = userProfile?.cbk_decimals || 6;
      const amountInUnits = ethers.parseUnits(stakeAmount, tokenDecimals);
      return amountInUnits > 0 && amountInUnits > allowance;
    } catch { return false; }
  }, [stakeAmount, allowance, userProfile]);
  
  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading('Approving token spend...');
    try {
      // Ensure addresses have proper checksum
      const checksumTokenAddress = ethers.getAddress(CBK_TOKEN_ADDRESS);
      const checksumStakingAddress = ethers.getAddress(STAKING_CONTRACT_ADDRESS);
      
      console.log("Approving token spend with addresses:", {
        token: checksumTokenAddress,
        staking: checksumStakingAddress
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract using the utility function
      const tokenContract = await createContract(checksumTokenAddress, ERC20ABI, signer);
      
      const approveTx = await tokenContract.approve(checksumStakingAddress, ethers.MaxUint256);
      await approveTx.wait();
      toast.success('Approval successful!', { id: toastId });
      await getAllowance();
    } catch (err) {
      console.error("Approval error:", err);
      toast.error(err?.reason || err.message || 'Approval failed.', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const executeTx = async (txPromise, { processing, success, error: errorMsg }, onFinally) => {
    setIsProcessing(true);
    const toastId = toast.loading(processing);
    try {
      // 1. Send tx → wait for confirmation
      const tx = await txPromise;
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      // 2. Refresh profile so UI reflects the new stake/unstake immediately
      if (typeof refreshUserProfile === 'function') {
        await refreshUserProfile();
      }

      // 3. Success toast with a direct link to the explorer
      const explorerBase = 'https://sepolia.etherscan.io/tx/';
      const link = `${explorerBase}${tx.hash}`;
      toast.success(
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {success} – View on Etherscan
        </a>,
        { id: toastId }
      );

      // 4. Notify parent so other panels (Dashboard) refresh as needed
      onAction();

      if (onFinally) onFinally();
    } catch (err) {
      console.error("Transaction error:", err);
      toast.error(err?.reason || err.message || errorMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    if (!stakeAmount || isNaN(parseFloat(stakeAmount)) || parseFloat(stakeAmount) <= 0) return;
    
    try {
      const tokenDecimals = userProfile?.cbk_decimals || 6;
      
      // Validate the input to avoid too many decimals
      const inputAmount = parseFloat(stakeAmount);
      const maxDecimalPlaces = Math.min(tokenDecimals, 6); // Use at most 6 decimal places
      
      // Format to the correct number of decimal places
      const formattedAmount = inputAmount.toFixed(maxDecimalPlaces);
      console.log("Staking with formatted amount:", formattedAmount);
      
      const amount = ethers.parseUnits(formattedAmount, tokenDecimals);
      
      // Ensure address has proper checksum
      const checksumStakingAddress = ethers.getAddress(STAKING_CONTRACT_ADDRESS);
      
      console.log("Staking amount:", {
        originalInput: stakeAmount,
        formattedAmount,
        parsedUnits: amount.toString(),
        decimals: tokenDecimals,
        stakingContract: checksumStakingAddress
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract using the utility function
      const contract = await createContract(checksumStakingAddress, StakingABI, signer);
      
      await executeTx(contract.stake(amount), {
        processing: 'Staking CBK...',
        success: 'Stake successful!',
        error: 'Stake failed.'
      }, () => setStakeAmount(''));
    } catch (err) {
      console.error("Staking preparation error:", err);
      toast.error(`Staking failed: ${err.message}`);
    }
  };
  
  const handleUnstake = async (e) => {
    e.preventDefault();
    if (!unstakeAmount || isNaN(parseFloat(unstakeAmount)) || parseFloat(unstakeAmount) <= 0) return;
    
    try {
      const tokenDecimals = userProfile?.cbk_decimals || 6;
      
      // Validate the input to avoid too many decimals
      const inputAmount = parseFloat(unstakeAmount);
      const maxDecimalPlaces = Math.min(tokenDecimals, 6); // Use at most 6 decimal places
      
      // Format to the correct number of decimal places
      const formattedAmount = inputAmount.toFixed(maxDecimalPlaces);
      console.log("Unstaking with formatted amount:", formattedAmount);
      
      const amount = ethers.parseUnits(formattedAmount, tokenDecimals);
      
      // Ensure address has proper checksum
      const checksumStakingAddress = ethers.getAddress(STAKING_CONTRACT_ADDRESS);
      
      console.log("Unstaking amount:", {
        originalInput: unstakeAmount,
        formattedAmount,
        parsedUnits: amount.toString(),
        decimals: tokenDecimals,
        stakingContract: checksumStakingAddress
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract using the utility function
      const contract = await createContract(checksumStakingAddress, StakingABI, signer);
      
      await executeTx(contract.unstake(amount), {
        processing: 'Unstaking CBK...',
        success: 'Unstake successful!',
        error: 'Unstake failed.'
      }, () => setUnstakeAmount(''));
    } catch (err) {
      console.error("Unstaking preparation error:", err);
      toast.error(`Unstaking failed: ${err.message}`);
    }
  };
  
  // This prevents the component from rendering with stale or incomplete data
  if (!userProfile) return null;
  
  // Fix for too many decimals - ensure we don't exceed the allowed precision
  const formatBalance = (value) => {
    try {
      if (!value || value === '0') return '0';
      
      // Convert to a number first to handle scientific notation
      const balanceNum = Number(ethers.formatUnits(value, userProfile.cbk_decimals || 6));
      
      // Format with max 6 decimal places to avoid precision errors
      return balanceNum.toLocaleString(undefined, {maximumFractionDigits: 6});
    } catch (err) {
      console.error("Error formatting balance:", err);
      return '0';
    }
  };
  
  const cbkBalanceSource = summaryWalletBalance ?? walletTokenBalance;
  const stakedBalanceSource = summaryStakedBalance ?? stakedTokenBalance;

  const cbkBalanceFormatted = formatBalance(cbkBalanceSource.toString());
  const stakedCbkFormatted = formatBalance(stakedBalanceSource.toString());

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