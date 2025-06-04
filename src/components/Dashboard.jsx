import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSimulatedTransactions, getUserRewards, simulateBuilderProfitDistribution as firebaseTriggerProfitShare } from '../services/firebase';
import { ListChecks, Gift, TrendingUp, AlertTriangle, Loader2, Stars } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = ({ refreshTrigger }) => {
  const { userId, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState({ totalEarned: 0, claimable: 0, lastClaimed: null, transactionCreditsDisplay: 0 });
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
      setRewards(userRewardsData || { totalEarned: 0, claimable: 0, lastClaimed: null, transactionCreditsDisplay: 0 });
    } catch (error) {
      toast.error("Failed to load dashboard data.");
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
    const result = await firebaseTriggerProfitShare(userId, 0.005);
    if (result.success) {
        toast.success(`Periodic profit share of ${result.amountDistributed.toFixed(5)} ETH added to your rewards! Transaction credits (if any) have been applied and reset.`);
    } else {
        toast.error(result.message || "Failed to process profit share.");
    }
    await fetchData();
    setIsSimulatingProfit(false);
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date instanceof Date && !isNaN(date) ? date.toLocaleString() : 'Invalid Date';
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col justify-center items-center p-10 neumorphic-outset card-base min-h-[200px]">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p className="text-textSecondary text-lg">Loading Dashboard...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || !userId) {
      return (
          <div className="neumorphic-outset card-base text-center">
              <AlertTriangle size={36} className="mx-auto text-yellowHighlight mb-3" />
              <p className="text-textSecondary text-lg">Please connect to view your dashboard.</p>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <div className="neumorphic-outset card-base">
        <div className="flex items-center text-primaryDark mb-5">
          <Gift size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
          <h2 className="text-2xl font-semibold">Your Rewards</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 mb-6">
          <div className="neumorphic-outset-sm p-5">
            <p className="text-sm text-textSecondary font-medium mb-1.5">Claimable Rewards</p>
            <p className="text-4xl font-bold text-accent">
              {rewards.claimable?.toFixed(5) || '0.00000'}
              <span className="text-xl ml-1.5">ETH</span>
            </p>
          </div>
          <div className="neumorphic-outset-sm p-5">
            <p className="text-sm text-textSecondary font-medium mb-1.5">Total Earned</p>
            <p className="text-3xl font-semibold text-primary">
              {rewards.totalEarned?.toFixed(5) || '0.00000'}
              <span className="text-lg ml-1.5">ETH</span>
            </p>
          </div>
          <div className="neumorphic-outset-sm p-5">
            <p className="text-sm text-textSecondary font-medium mb-1.5">Transaction Credits</p>
            <div className="flex items-baseline">
                <p className="text-3xl font-semibold text-indigoHighlight">
                {rewards.transactionCreditsDisplay || 0}
                </p>
                <Stars size={22} className="ml-2 text-indigoHighlight" />
            </div>
            <p className="text-xs text-textSecondary mt-1.5">Earned from CBK staking this cycle.</p>
          </div>
        </div>
        {rewards.lastClaimed && (
          <p className="text-xs text-textSecondary mb-1.5">
            Last Claimed On: {formatDate(rewards.lastClaimed)}
          </p>
        )}
        {rewards.lastDistributionAt && (
             <p className="text-xs text-textSecondary mb-4">
                Last Profit Share: {formatDate(rewards.lastDistributionAt)}
            </p>
        )}
        <button
            onClick={handleSimulateGeneralProfitShare}
            disabled={isSimulatingProfit}
            className="neumorphic-button bg-indigoHighlight text-white"
        >
            {isSimulatingProfit ? <Loader2 size={18} className="animate-spin"/> : <TrendingUp size={18} />}
            <span>{isSimulatingProfit ? 'Processing...' : 'Process Periodic Profit Share'}</span>
        </button>
        <p className="text-xs text-textSecondary mt-2">This processes a periodic profit distribution. Rewards are influenced by your transactions and CBK stake. Transaction credits will reset.</p>
      </div>

      <div className="neumorphic-outset card-base">
        <div className="flex items-center text-primaryDark mb-5">
          <ListChecks size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
          <h2 className="text-2xl font-semibold">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-textSecondary text-center py-8">
            No transactions recorded yet. Use the "New Transaction" section to add activity.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-neo-lg neumorphic-inset p-1">
            <table className="min-w-full divide-y divide-shadowDark/30">
              <thead className="bg-surface/50">
                <tr>
                  <th scope="col" className="table-header">Date & Time</th>
                  <th scope="col" className="table-header">Type</th>
                  <th scope="col" className="table-header">Amount (ETH)</th>
                  <th scope="col" className="table-header">Details</th>
                  <th scope="col" className="table-header">Cashback Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shadowDark/30">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="table-row-hover">
                    <td className="table-cell">{formatDate(tx.timestamp)}</td>
                    <td className="table-cell capitalize">{tx.type?.replace(/_/g, ' ')}</td>
                    <td className="table-cell">{tx.amount?.toFixed(4) || 'N/A'}</td>
                    <td className="table-cell max-w-[180px] sm:max-w-[250px] truncate" title={tx.details}>{tx.details || 'No details'}</td>
                    <td className={`table-cell font-medium ${tx.profitShareContributed > 0 ? 'text-greenHighlight' : 'text-textSecondary'}`}>
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