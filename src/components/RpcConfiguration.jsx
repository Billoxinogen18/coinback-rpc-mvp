import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const RpcConfiguration = () => {
  const mockRpcUrl = 'https://rpc.coinback-mvp.example.com/mainnet-simulated'; 
  const mockChainId = '1'; 
  const mockNetworkName = 'Coinback MVP Mainnet (Simulated)';
  const mockCurrencySymbol = 'ETH';
  const mockCurrencyDecimals = 18;

  const [copied, setCopied] = useState(false);

  const handleCopyRpcUrl = () => {
    const textarea = document.createElement('textarea');
    textarea.value = mockRpcUrl;
    textarea.style.position = 'fixed'; 
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy'); 
      setCopied(true);
      toast.success('RPC URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Failed to copy RPC URL.');
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  };
  
  const handleAddToWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask (or other Ethereum wallet) is not installed. Please install it to use this feature.');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${parseInt(mockChainId, 10).toString(16)}`, 
            chainName: mockNetworkName,
            nativeCurrency: {
              name: mockCurrencySymbol, 
              symbol: mockCurrencySymbol, 
              decimals: mockCurrencyDecimals,
            },
            rpcUrls: [mockRpcUrl], 
          },
        ],
      });
      toast.success(`"${mockNetworkName}" network added/switched in your wallet (simulated)!`);
    } catch (error) {
      console.error('Failed to add/switch chain:', error);
      if (error.code === 4001) { 
        toast.error('Request to add network was rejected.');
      } else {
        toast.error(`Failed to add network: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="bg-card p-6 rounded-xl shadow-medium mb-8 print:hidden">
      <div className="flex items-center text-primary-dark mb-4">
        <Settings size={24} className="mr-3 flex-shrink-0" />
        <h2 className="text-2xl font-semibold">RPC Configuration (Simulated)</h2>
      </div>
      <p className="text-muted mb-5">
        To (simulate) earning cashback on your transactions, add our custom RPC to your wallet.
        All transactions routed through this RPC are (simulated to be) eligible for rewards and MEV protection.
      </p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="networkName" className="block text-sm font-medium text-muted mb-1">Network Name:</label>
          <input id="networkName" type="text" readOnly value={mockNetworkName} className="w-full text-text p-3 bg-background rounded-lg border border-gray-300 focus:outline-none"/>
        </div>
        <div>
          <label htmlFor="rpcUrl" className="block text-sm font-medium text-muted mb-1">New RPC URL:</label>
          <div className="flex items-center">
            <input 
              id="rpcUrl"
              type="text" 
              readOnly 
              value={mockRpcUrl} 
              className="flex-grow p-3 bg-background rounded-l-lg border border-r-0 border-gray-300 focus:outline-none"
            />
            <button 
              onClick={handleCopyRpcUrl}
              className="p-3 bg-primary text-white rounded-r-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors duration-150 flex items-center"
              aria-label="Copy RPC URL"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="chainId" className="block text-sm font-medium text-muted mb-1">Chain ID:</label>
          <input id="chainId" type="text" readOnly value={mockChainId} className="w-full text-text p-3 bg-background rounded-lg border border-gray-300 focus:outline-none"/>
        </div>
      </div>

      <button
        onClick={handleAddToWallet}
        className="w-full px-6 py-3 bg-accent text-card font-semibold rounded-lg shadow-subtle hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center space-x-2"
      >
        <Settings size={20} />
        <span>Add Coinback RPC to Wallet (Simulated)</span>
      </button>
      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700 dark:text-yellow-400 text-xs flex items-start">
        <AlertTriangle size={28} className="mr-2 flex-shrink-0 text-yellow-500" />
        <span>
          <strong>Important:</strong> This is a simulation. The RPC URL provided is a placeholder and will not connect to a real network for cashback. 
          This feature demonstrates how a user would typically add a custom RPC.
        </span>
      </div>
    </div>
  );
};

export default RpcConfiguration;
