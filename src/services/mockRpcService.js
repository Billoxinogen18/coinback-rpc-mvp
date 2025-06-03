import { addSimulatedTransaction, simulateBuilderProfitDistribution } from './firebase'; 
import toast from 'react-hot-toast';

export const sendMockTransaction = async (userId, type = 'swap', amount = 0.1) => {
  if (!userId) {
    toast.error("User not authenticated. Cannot simulate transaction.");
    return null;
  }
  
  await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 800));

  const transactionData = {
    type: type, 
    amount: Number(amount), 
    details: `Simulated ${type} of ${Number(amount).toFixed(4)} ETH on ${new Date().toLocaleDateString()}`,
  };

  const result = await addSimulatedTransaction(userId, transactionData);

  if (result && result.id) { 
    toast.success(`Simulated ${type} transaction recorded! (ID: ...${result.id.slice(-4)})`);
    
    if (result.processedByBuilder && result.profitShareContributed > 0) {
        const profitShare = parseFloat(result.profitShareContributed.toFixed(5));
        await simulateBuilderProfitDistribution(userId, profitShare); 
        toast.success(`This transaction contributed ${profitShare} ETH (simulated) to your rewards!`);

    } else if (!result.processedByBuilder) {
        toast.warn("Simulated transaction was not processed by a builder this time.");
    }
    return result;
  } else {
    toast.error("Failed to record simulated transaction in the system.");
    return null;
  }
};

export const triggerOverallBuilderProfitShare = async (userId, baseAmount = 0.005) => {
  if (!userId) {
    toast.error("User not authenticated. Cannot simulate general profit share.");
    return;
  }
  const randomProfit = baseAmount + Math.random() * baseAmount; 
  const success = await simulateBuilderProfitDistribution(userId, parseFloat(randomProfit.toFixed(5)));
  
  if (success) {
    toast.success(`A general builder profit share of ${randomProfit.toFixed(5)} ETH (simulated) has been added to your rewards!`);
  } else {
    toast.error("Failed to simulate the general builder profit share distribution.");
  }
};
