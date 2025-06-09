import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle } from 'lucide-react';

const RpcConfiguration = () => {
  const rpcUrl = import.meta.env.VITE_COINBACK_RPC_URL;
  // Let's also log the raw env variable to ensure it's being loaded
  const chainId = import.meta.env.VITE_CHAIN_ID || '11155111'; 
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

  const setupAndSwitchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') {
      return toast.error('MetaMask not installed.');
    }
    
    // --- START DEBUGGING LOGS ---
    console.log("--- Starting Network Setup ---");
    console.log("Raw VITE_CHAIN_ID from env:", import.meta.env.VITE_CHAIN_ID);
    console.log("Using chainId:", chainId);
    // --- END DEBUGGING LOGS ---

    const hexChainId = `0x${parseInt(chainId, 10).toString(16)}`;

    try {
      // First, try to switch to the network if it already exists
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      toast.success(`Switched to ${networkName}`);
    } catch (switchError) {
      // This error code (4902) indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        
        const addParams = {
          chainId: hexChainId,
          chainName: networkName,
          nativeCurrency: { name: currencySymbol, symbol: currencySymbol, decimals: 18 },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        };
        
        // --- MORE DEBUGGING LOGS ---
        console.log("Chain not found (error 4902). Attempting to add with params:", addParams);
        // --- END DEBUGGING LOGS ---

        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [addParams],
          });
          toast.success(`Successfully added and switched to ${networkName}`);
        } catch (addError) {
          toast.error(`Failed to add network: ${addError.message}`);
          console.error("Add network error:", addError);
        }
      } else {
        toast.error(`Failed to switch network: ${switchError.message}`);
        console.error("Switch network error:", switchError);
      }
    }
  };

  return (
    <div className="card space-y-8">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-primary" />
        <h2 className="text-xl font-bold">RPC Configuration</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-textSecondary mb-2 pl-1">Network RPC URL</label>
          <div className="flex items-center">
            <input type="text" readOnly value={rpcUrl} className="input-field rounded-r-none flex-grow"/>
            <button onClick={handleCopyRpcUrl} className="btn-secondary h-14 w-14 p-0 flex-shrink-0 rounded-l-none">
              {copied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          </div>
        </div>
      </div>
      <button onClick={setupAndSwitchNetwork} className="btn-primary w-full">
        <Settings size={20} />
        <span>Add RPC to Wallet</span>
      </button>
    </div>
  );
};

export default RpcConfiguration;