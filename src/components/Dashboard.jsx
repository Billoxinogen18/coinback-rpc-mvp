import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Corrected import: simulateBuilderProfitDistribution is aliased as firebaseTriggerProfitShare
import { getSimulatedTransactions, getUserRewards, simulateBuilderProfitDistribution as firebaseTriggerProfitShare } from '../services/firebase'; 
import { ListChecks, DollarSign, Gift, RefreshCw, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = ({ refreshTrigger }) => {
  const { userId, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState({ totalEarned: 0, claimable: 0, lastClaimed: null });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSimulatingProfit, setIsSimulatingProfit] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setIsLoadingData(false); 
      return;
    }
    setIsLoadingData(true);
    try {
      const [userTransactionsData, userRewardsData] = await Promise.all([
        getSimulatedTransactions(userId),
        getUserRewards(userId)
      ]);
      setTransactions(userTransactionsData || []); 
      setRewards(userRewardsData || { totalEarned: 0, claimable: 0, lastClaimed: null }); 
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load some dashboard data. Please try refreshing.");
    } finally {
      setIsLoadingData(false);
    }
  }, [userId, isAuthenticated]); 

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]); 

  const handleSimulateGeneralProfitShare = async () => {
    if (!userId) {
      toast.error("User not authenticated.");
      return;
    }
    setIsSimulatingProfit(true);
    // The function called here now correctly refers to simulateBuilderProfitDistribution via the alias
    await firebaseTriggerProfitShare(userId, 0.005); 
    await fetchData(); 
    setIsSimulatingProfit(false);
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return 'Invalid Date'; 
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col justify-center items-center p-10 bg-card rounded-xl shadow-medium min-h-[200px]">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-muted">Loading dashboard data...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || !userId) {
      return (
          <div className="bg-card p-6 rounded-xl shadow-medium text-center">
              <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-3" />
              <p className="text-muted">Please ensure you are authenticated to view your dashboard.</p>
              <p className="text-xs text-muted mt-1">If you've just connected, data might take a moment to appear.</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 print:space-y-4">
      <div className="bg-card p-6 rounded-xl shadow-medium">
        <div className="flex items-center text-primary-dark mb-4">
          <Gift size={24} className="mr-3 flex-shrink-0" />
          <h2 className="text-2xl font-semibold">Your Rewards (Simulated ETH)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5">
          <div className="bg-background p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-muted font-medium mb-1">Claimable Rewards</p>
            <p className="text-3xl font-bold text-accent">
              {rewards.claimable?.toFixed(5) || '0.00000'}
              <span className="text-lg ml-1">ETH</span>
            </p>
          </div>
          <div className="bg-background p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-muted font-medium mb-1">Total Earned (All Time)</p>
            <p className="text-2xl font-semibold text-primary">
              {rewards.totalEarned?.toFixed(5) || '0.00000'}
              <span className="text-base ml-1">ETH</span>
            </p>
          </div>
        </div>
        {rewards.lastClaimed && (
          <p className="text-xs text-muted mb-3">
            Last Claimed On: {formatDate(rewards.lastClaimed)}
          </p>
        )}
        <button
            onClick={handleSimulateGeneralProfitShare}
            disabled={isSimulatingProfit}
            className="mt-2 px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-all duration-150 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {isSimulatingProfit ? <Loader2 size={18} className="animate-spin"/> : <TrendingUp size={18} />}
            <span>{isSimulatingProfit ? 'Simulating...' : 'Simulate General Profit Share'}</span>
        </button>
        <p className="text-xs text-muted mt-1.5">This button simulates a general profit distribution for all users (demo only).</p>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-medium">
        <div className="flex items-center text-primary-dark mb-4">
          <ListChecks size={24} className="mr-3 flex-shrink-0" />
          <h2 className="text-2xl font-semibold">Simulated Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-muted text-center py-6">
            No simulated transactions recorded yet. <br/> Use the "Simulate Transaction" section to add some activity.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Amount (ETH)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Cashback Earned</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text">{formatDate(tx.timestamp)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text capitalize">{tx.type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text">{tx.amount?.toFixed(4) || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-text max-w-[200px] truncate" title={tx.details}>{tx.details || 'No details'}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${tx.profitShareContributed > 0 ? 'text-green-600' : 'text-muted'}`}>
                        {tx.profitShareContributed > 0 ? `+${tx.profitShareContributed.toFixed(5)} ETH` : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;