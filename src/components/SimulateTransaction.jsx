import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendMockTransaction } from '../services/mockRpcService'; 
import { Send, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SimulateTransaction = ({ onTransactionSimulated }) => {
  const { userId, isAuthenticated } = useAuth(); 
  const [isSimulating, setIsSimulating] = useState(false);
  const [txType, setTxType] = useState('swap');
  const [txAmount, setTxAmount] = useState('0.1');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !isAuthenticated) { 
      toast.error('Please ensure you are authenticated to simulate transactions.');
      return;
    }
    
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount for the transaction.");
      return;
    }
    if (amount > 1000) { 
        toast.error("Simulation amount too high. Please use a smaller value.");
        return;
    }

    setIsSimulating(true);
    try {
      const simulatedTx = await sendMockTransaction(userId, txType, amount);
      if (simulatedTx && onTransactionSimulated) {
        onTransactionSimulated(); 
      }
    } catch (error) {
      console.error('Error during transaction simulation:', error);
      toast.error('An unexpected error occurred during simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-xl shadow-medium mb-8 print:hidden">
      <div className="flex items-center text-primary-dark mb-4">
        <Zap size={24} className="mr-3 flex-shrink-0" />
        <h2 className="text-2xl font-semibold">Simulate Transaction</h2>
      </div>
      <p className="text-muted mb-5">
        Use this section to simulate sending a transaction through the Coinback RPC.
        This will log activity and (simulated) cashback may be generated.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="txType" className="block text-sm font-medium text-muted mb-1">Transaction Type:</label>
          <select 
            id="txType"
            value={txType}
            onChange={(e) => setTxType(e.target.value)}
            className="w-full p-3 bg-background rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            disabled={isSimulating}
          >
            <option value="swap">Swap</option>
            <option value="transfer">Transfer</option>
            <option value="nft_mint">NFT Mint</option>
            <option value="stake">Stake</option>
            <option value="contract_interaction">Contract Interaction</option>
          </select>
        </div>
        <div>
          <label htmlFor="txAmount" className="block text-sm font-medium text-muted mb-1">Amount (Simulated ETH):</label>
          <input 
            type="number"
            id="txAmount"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            step="0.001"
            min="0.0001"
            max="1000" 
            className="w-full p-3 bg-background rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            placeholder="e.g., 0.1"
            disabled={isSimulating}
          />
        </div>
        <button 
          type="submit" 
          disabled={isSimulating || !isAuthenticated} 
          className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-subtle hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
          <span>{isSimulating ? 'Simulating...' : 'Send Simulated Transaction'}</span>
        </button>
        {!isAuthenticated && (
            <p className="text-xs text-red-600 mt-2 text-center">
                Please wait for authentication to complete before simulating transactions.
            </p>
        )}
      </form>
    </div>
  );
};

export default SimulateTransaction;
