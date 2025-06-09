import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/api';
import { ListChecks, Gift, Loader2, BarChart3, ShieldX } from 'lucide-react';
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
      <div className="neumorphic-outset card-base flex items-center justify-center p-6 min-h-[400px]">
        <Loader2 className="animate-spin mr-3 h-8 w-8 text-primary" />
        <span className="text-lg">Loading Dashboard Data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 lg:space-y-10">
      <div className="neumorphic-outset card-base transition-transform hover:scale-[1.02]">
        <h2 className="text-2xl font-bold flex items-center mb-6">
          <Gift className="mr-3 text-primary" />
          Rewards Overview
        </h2>
        <div className="neumorphic-outset p-6 rounded-neo text-center bg-surface animate-pulse-glow">
            <p className="text-sm font-semibold text-textSecondary uppercase tracking-wider">Total Rewards Earned (All-Time)</p>
            <p className="text-4xl font-bold text-accent mt-2">{totalRewards} <span className="text-2xl font-medium text-textSecondary">ETH</span></p>
        </div>
      </div>

      <div className="neumorphic-outset card-base transition-transform hover:scale-[1.02]">
        <h2 className="text-2xl font-bold flex items-center mb-6">
          <ListChecks className="mr-3 text-primary" />
          Recent Transaction History
        </h2>
        <div className="overflow-x-auto neumorphic-outset rounded-neo p-2">
          {transactions.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="border-b-2 border-glassBorder">
                <tr>
                  <th className="text-left p-4 font-semibold text-textSecondary">TX Hash</th>
                  <th className="text-left p-4 font-semibold text-textSecondary">Status</th>
                  <th className="text-right p-4 font-semibold text-textSecondary">Cashback Generated</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.transaction_pk} className="border-b border-glassBorder last:border-b-0 hover:bg-surface transition-colors">
                    <td className="p-4 font-mono text-xs text-blue-500 dark:text-blue-400">
                      <a href={`https://sepolia.etherscan.io/tx/${tx.client_tx_hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline" title={tx.client_tx_hash}>
                        {`${tx.client_tx_hash.substring(0, 10)}...${tx.client_tx_hash.substring(tx.client_tx_hash.length - 8)}`}
                      </a>
                    </td>
                    <td className="p-4 text-textPrimary capitalize">{tx.final_status?.replace(/_/g, ' ') || 'Unknown'}</td>
                    <td className="p-4 text-right font-semibold text-green-500">
                      {tx.profit_share_contributed && BigInt(tx.profit_share_contributed) > 0 
                        ? `+${ethers.formatEther(tx.profit_share_contributed)} ETH` 
                        : <span className="text-textSecondary/50">N/A</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-10 text-textSecondary">
              <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-30"/>
              <p className="font-semibold text-lg">No Transactions Yet</p>
              <p className="mt-1">Once you send transactions through the Coinback RPC, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;