import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle } from 'lucide-react';

const RpcConfiguration = () => {
  const rpcUrl = import.meta.env.VITE_COINBACK_RPC_URL;
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
    <div className="card space-y-6">
      <h2 className="text-2xl font-bold flex items-center">
        <Settings size={24} className="mr-3 text-primary" />
        RPC Configuration
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-textSecondary mb-2 pl-1">Network RPC URL</label>
          <div className="flex items-center">
            <input type="text" readOnly value={rpcUrl} className="input-field rounded-r-none"/>
            <button onClick={handleCopyRpcUrl} className="btn-secondary h-[58px] aspect-square p-0 flex-shrink-0 rounded-l-none">
              {copied ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleAddToWallet} className="btn-primary w-full">
        <Settings size={20} />
        <span>Add RPC to Wallet</span>
      </button>
    </div>
  );
};
export default RpcConfiguration;