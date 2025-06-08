import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle } from 'lucide-react';

const RpcConfiguration = () => {
  const rpcUrl = import.meta.env.VITE_COINBACK_RPC_URL;
  // FINAL FIX: Hardcode the chainId to Sepolia to ensure consistency across the app.
  const chainId = '11155111'; 
  const networkName = 'Coinback RPC (Sepolia)';
  const currencySymbol = 'ETH';
  const [copied, setCopied] = useState(false);

  const handleCopyRpcUrl = () => {
    navigator.clipboard.writeText(rpcUrl).then(() => {
      setCopied(true);
      toast.success('RPC URL copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };
  
  const handleAddToWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      return toast.error('MetaMask not installed.');
    }
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${parseInt(chainId, 10).toString(16)}`,
          chainName: networkName,
          nativeCurrency: { name: currencySymbol, symbol: currencySymbol, decimals: 18 },
          rpcUrls: [rpcUrl],
        }],
      });
      toast.success(`Successfully added "${networkName}" to wallet!`);
    } catch (error) {
      toast.error(`Failed to add network: ${error.message}`);
    }
  };

  return (
    <div className="neumorphic-outset card-base">
      <div className="flex items-center text-textPrimary mb-6">
        <Settings size={24} className="mr-3 text-primary" />
        <h2 className="text-2xl font-bold">RPC Configuration</h2>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-textSecondary mb-2">Network RPC URL</label>
          <div className="flex items-center">
            <input type="text" readOnly value={rpcUrl} className="neumorphic-input rounded-r-none"/>
            <button onClick={handleCopyRpcUrl} className="neumorphic-button h-[50px] aspect-square flex items-center justify-center rounded-l-none bg-primary text-white">
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleAddToWallet} className="neumorphic-button w-full bg-accent text-white dark:text-bgBase">
        <Settings size={20} />
        <span>Add RPC to Wallet</span>
      </button>
    </div>
  );
};
export default RpcConfiguration;
