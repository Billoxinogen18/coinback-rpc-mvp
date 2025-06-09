import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/api';
import { ListChecks, Gift, Loader2, BarChart3, ArrowRight } from 'lucide-react';
import { ethers } from 'ethers';

const Dashboard = ({ onDataChange }) => {
  const { userProfile } = useAuth(); // Depend directly on userProfile
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Only fetch if we have a valid user profile.
    if (!userProfile?.user_id) {
        setIsLoading(false); // If there's no profile, stop loading.
        return;
    }

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
  }, [userProfile]); // Dependency is now userProfile

  // This hook now re-runs whenever userProfile changes OR when an external action happens.
  useEffect(() => {
    fetchData();
  }, [fetchData, onDataChange]);

  const totalRewards = userProfile?.total_rewards_earned 
    ? parseFloat(ethers.formatEther(userProfile.total_rewards_earned)).toFixed(6) 
    : '0.000000';

  // If there is no user profile yet, we are in a loading or logged-out state.
  if (!userProfile) {
    return (
      <div className="card flex flex-col items-center justify-center p-6 min-h-[400px]">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <span className="mt-4 text-lg text-textSecondary">Waiting for user data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="card text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-neumorphic-out-lg relative overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 animate-spin-slow blur-3xl opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center text-primary mb-4">
            <Gift className="mr-3 drop-shadow-glow-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-textSecondary">Total Rewards Earned</h2>
          </div>
          <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primaryGlow to-accentGlow text-glow-primary">
            {totalRewards}
            <span className="text-3xl ml-2 text-textSecondary font-light">ETH</span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <ListChecks size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map(tx => (
              <a 
                key={tx.transaction_pk} 
                href={`https://sepolia.etherscan.io/tx/${tx.client_tx_hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-surface/50 hover:bg-surface-elevated transition-colors duration-200 group"
              >
                <div>
                  <p className="font-mono text-sm text-primary group-hover:underline">
                    {`${tx.client_tx_hash.substring(0, 12)}...${tx.client_tx_hash.substring(tx.client_tx_hash.length - 10)}`}
                  </p>
                  <p className="text-xs text-textMuted capitalize">{tx.final_status?.replace(/_/g, ' ') || 'Unknown'}</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <span className="font-semibold text-green-400">
                      {tx.profit_share_contributed && BigInt(tx.profit_share_contributed) > 0 
                        ? `+${ethers.formatEther(tx.profit_share_contributed)} ETH` 
                        : <span className="text-textMuted/50">N/A</span>}
                  </span>
                  <ArrowRight className="text-textMuted/50 group-hover:text-primary transition-transform transform group-hover:translate-x-1" size={20} />
                </div>
              </a>
            ))
          ) : (
            <div className="text-center p-10 text-textMuted">
              <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-30"/>
              <p className="font-semibold text-lg text-textSecondary">No Transactions Yet</p>
              <p className="mt-1 text-sm">Send transactions through the Coinback RPC to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;