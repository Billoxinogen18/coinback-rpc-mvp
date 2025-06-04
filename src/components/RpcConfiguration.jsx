import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle, ShieldCheckIcon, Info } from 'lucide-react';

const RpcConfiguration = () => {
  const mockRpcUrl = 'https://rpc.coinback.example.com/mainnet';
  const mockChainId = '1';
  const mockNetworkName = 'Coinback Mainnet RPC';
  const mockCurrencySymbol = 'ETH';
  const mockCurrencyDecimals = 18;

  const [copied, setCopied] = useState(false);

  const handleCopyRpcUrl = () => {
    navigator.clipboard.writeText(mockRpcUrl).then(() => {
      setCopied(true);
      toast.success('RPC URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      toast.error('Failed to copy RPC URL.');
    });
  };
  
  const handleAddToWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('Ethereum wallet (e.g., MetaMask) is not installed.');
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
      toast.success(`"${mockNetworkName}" network added/switched in your wallet!`);
    } catch (error) {
      if (error.code === 4001) {
        toast.error('Request to add network was rejected by user.');
      } else {
        toast.error(`Failed to add network: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="neumorphic-outset card-base">
      <div className="flex items-center text-primaryDark mb-5">
        <Settings size={28} className="mr-3 flex-shrink-0 drop-shadow-sm" />
        <h2 className="text-2xl font-semibold">RPC Configuration</h2>
      </div>
      <p className="text-textSecondary mb-4">
        Add our custom RPC to your wallet to earn cashback and enjoy enhanced MEV protection.
      </p>
      <div className="info-box info-box-blue mb-6">
        <div className="flex items-start">
            <ShieldCheckIcon size={28} className="mr-3 mt-px flex-shrink-0 text-blueHighlight"/>
            <div>
                <h3 className="font-semibold text-base">Coinback RPC Benefits:</h3>
                <ul className="list-disc list-inside text-xs mt-1.5 space-y-1">
                    <li>Transactions bypass the public mempool for enhanced privacy.</li>
                    <li>Direct routing to partnered block builders.</li>
                    <li>Protection against front-running and sandwich attacks.</li>
                    <li>Builders share profits, funding your cashback rewards.</li>
                </ul>
            </div>
        </div>
      </div>
      
      <div className="space-y-5 mb-8">
        <div>
          <label htmlFor="networkName" className="block text-sm font-medium text-textSecondary mb-1.5">Network Name:</label>
          <input id="networkName" type="text" readOnly value={mockNetworkName} className="neumorphic-input"/>
        </div>
        <div>
          <label htmlFor="rpcUrl" className="block text-sm font-medium text-textSecondary mb-1.5">New RPC URL:</label>
          <div className="flex items-center">
            <input id="rpcUrl" type="text" readOnly value={mockRpcUrl}
              className="neumorphic-input rounded-r-none border-r-0"/>
            <button onClick={handleCopyRpcUrl}
              className="neumorphic-button neumorphic-button-primary rounded-l-none px-4 py-3 h-[49px]"
              aria-label="Copy RPC URL">
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="chainId" className="block text-sm font-medium text-textSecondary mb-1.5">Chain ID:</label>
          <input id="chainId" type="text" readOnly value={mockChainId} className="neumorphic-input"/>
        </div>
         <div>
          <label htmlFor="currencySymbol" className="block text-sm font-medium text-textSecondary mb-1.5">Currency Symbol:</label>
          <input id="currencySymbol" type="text" readOnly value={mockCurrencySymbol} className="neumorphic-input"/>
        </div>
      </div>

      <button onClick={handleAddToWallet}
        className="neumorphic-button neumorphic-button-accent w-full">
        <Settings size={20} />
        <span>Add Coinback RPC to Wallet</span>
      </button>
      <div className="info-box info-box-yellow">
        <div className="flex items-start">
          <Info size={26} className="mr-2 flex-shrink-0 text-yellowHighlight" />
          <span>
            The RPC URL provided is for demonstration in this MVP. In a live environment, this would be the actual Coinback RPC endpoint.
          </span>
        </div>
      </div>
    </div>
  );
};
export default RpcConfiguration;