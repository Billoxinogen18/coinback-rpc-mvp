import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendMockTransaction } from '../services/mockRpcService';
import { Send, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
//legacy files
const SimulateTransaction = ({ onTransactionSimulated }) => {
  const { userId, isAuthenticated } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);
  const [txType, setTxType] = useState('swap');
  const [txAmount, setTxAmount] = useState('0.1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !isAuthenticated) {
      toast.error('Please authenticate to send transactions.');
      return;
    }
    
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }
    if (amount > 1000) {
        toast.error("Amount too high for this demonstration. Please use a smaller value.");
        return;
        
    }

    setIsSimulating(true);
    try {
      const simulatedTx = await sendMockTransaction(userId, txType, amount);
      if (simulatedTx && onTransactionSimulated) {
        onTransactionSimulated();
      }
    } catch (error) {
      toast.error('An unexpected error occurred during transaction processing.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="neumorphic-outset card-base">
      <div className="flex items-center text-primaryDark mb-4">
        <Zap size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
        <h2 className="text-2xl font-semibold">New Transaction</h2>
      </div>
      <p className="text-textSecondary mb-6">
        Send a transaction through the Coinback RPC to log activity and potentially earn cashback.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="txType" className="block text-sm font-medium text-textSecondary mb-1.5">Transaction Type:</label>
          <select id="txType" value={txType} onChange={(e) => setTxType(e.target.value)}
            className="neumorphic-input appearance-none"
            disabled={isSimulating}>
            <option value="swap">Swap</option>
            <option value="transfer">Transfer</option>
            <option value="nft_mint">NFT Mint</option>
            <option value="stake_assets">Stake Assets</option>
            <option value="contract_interaction">Contract Interaction</option>
          </select>
        </div>
        <div>
          <label htmlFor="txAmount" className="block text-sm font-medium text-textSecondary mb-1.5">Amount (ETH):</label>
          <input type="number" id="txAmount" value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
            step="0.001" min="0.0001" max="1000"
            className="neumorphic-input"
            placeholder="e.g., 0.1" disabled={isSimulating} />
        </div>
        <button type="submit" disabled={isSimulating || !isAuthenticated}
          className="neumorphic-button neumorphic-button-primary w-full">
          {isSimulating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          <span>{isSimulating ? 'Processing...' : 'Send Transaction'}</span>
        </button>
        {!isAuthenticated && (
            <p className="text-xs text-redHighlight mt-2 text-center">
                Please wait for authentication to complete.
            </p>
        )}
      </form>
    </div>
  );
};
export default SimulateTransaction;