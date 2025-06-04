import { addSimulatedTransaction, simulateBuilderProfitDistribution } from './firebase'; 
import toast from 'react-hot-toast';

export const sendMockTransaction = async (userId, type = 'swap', amount = 0.1) => {
  if (!userId) {
    toast.error("User not authenticated. Cannot process transaction.");
    return null;
  }
  
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 700));

  const transactionData = {
    type: type, 
    amount: Number(amount), 
    details: `${type.replace(/_/g, ' ')} of ${Number(amount).toFixed(4)} ETH on ${new Date().toLocaleDateString()}`,
  };

  const result = await addSimulatedTransaction(userId, transactionData);

  if (result && result.id) { 
    toast.success(`Transaction recorded (ID: ...${result.id.slice(-4)})`);
    
    if (result.processedByBuilder && result.profitShareContributed > 0) {
        const profitShare = parseFloat(result.profitShareContributed.toFixed(5));
        // The profit share from individual transaction is now directly added to rewards in addSimulatedTransaction
        // For a more direct feedback, we can still toast here.
        // await simulateBuilderProfitDistribution(userId, profitShare); // This was for general distribution, not direct per-tx cashback.
                                                                      // The per-tx cashback is now part of addSimulatedTransaction's logic.
        toast.success(`This transaction contributed ${profitShare} ETH to your rewards pool!`);
    } else if (!result.processedByBuilder) {
        toast.info("Transaction recorded but not selected by a builder for additional profit share this time.");
    }
    return result;
  } else {
    toast.error("Failed to record transaction.");
    return null;
  }
};

export const triggerOverallBuilderProfitShare = async (userId, baseAmount = 0.005) => {
  if (!userId) {
    toast.error("User not authenticated. Cannot process profit share.");
    return;
  }
  const randomProfit = baseAmount + Math.random() * baseAmount; 
  const result = await simulateBuilderProfitDistribution(userId, parseFloat(randomProfit.toFixed(5)));
  
  if (result.success) {
    toast.success(`A general builder profit share of ${result.amountDistributed.toFixed(5)} ETH has been added to your rewards!`);
  } else {
    toast.error(result.message || "Failed to process the general builder profit share.");
  }
};
