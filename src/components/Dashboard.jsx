import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/api';
import { ListChecks, Gift, Loader2, BarChart3, ArrowRight } from 'lucide-react';
import { ethers } from 'ethers';

const Dashboard = ({ onDataChange }) => {
  const { isAuthenticated, userProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const txs = await getTransactions();
      setTransactions(txs || []);
    } catch (e) {
      console.error("Dashboard fetch error", e);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData, onDataChange]);

  const totalRewards = userProfile?.total_rewards_earned 
    ? parseFloat(ethers.formatEther(userProfile.total_rewards_earned)).toFixed(6) 
    : '0.000000';

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center p-6 min-h-[400px]">
        <Loader2 className="animate-spin mr-3 h-8 w-8 text-primary" />
        <span className="text-lg text-textSecondary">Loading Dashboard Data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Rewards Overview Hero */}
      <div className="card text-center bg-primary/5 dark:bg-primary/10 transition-transform hover:scale-[1.01] hover:shadow-lg">
        <div className="flex items-center justify-center text-primary mb-4">
          <Gift className="mr-3 drop-shadow-glow-primary" />
          <h2 className="text-lg font-semibold uppercase tracking-wider">Total Rewards Earned</h2>
        </div>
        <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          {totalRewards}
          <span className="text-3xl ml-2">ETH</span>
        </p>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-2xl font-bold flex items-center mb-6">
          <ListChecks className="mr-3 text-primary" />
          Transaction History
        </h2>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <a 
                key={tx.transaction_pk} 
                href={`https://sepolia.etherscan.io/tx/${tx.client_tx_hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-btn bg-bgBase hover:bg-surface transition-colors duration-200 shadow-inset-soft group"
              >
                <div>
                  <p className="font-mono text-sm text-primary group-hover:underline">
                    {`${tx.client_tx_hash.substring(0, 12)}...${tx.client_tx_hash.substring(tx.client_tx_hash.length - 10)}`}
                  </p>
                  <p className="text-xs text-textSecondary capitalize">{tx.final_status?.replace(/_/g, ' ') || 'Unknown'}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <span className="font-semibold text-green-500">
                      {tx.profit_share_contributed && BigInt(tx.profit_share_contributed) > 0 
                        ? `+${ethers.formatEther(tx.profit_share_contributed)} ETH` 
                        : <span className="text-textSecondary/50">N/A</span>}
                  </span>
                  <ArrowRight className="text-textSecondary/50 group-hover:text-primary transition-colors transform group-hover:translate-x-1" size={20} />
                </div>
              </a>
            ))
          ) : (
            <div className="text-center p-10 text-textSecondary">
              <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-30"/>
              <p className="font-semibold text-lg">No Transactions Yet</p>
              <p className="mt-1">Send transactions through the Coinback RPC to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;