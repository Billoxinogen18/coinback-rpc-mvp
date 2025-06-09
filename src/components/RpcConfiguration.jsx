import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';

const RpcConfiguration = () => {
    const { walletAddress } = useAuth();
    const rpcUrl = import.meta.env.VITE_COINBACK_RPC_URL;
    const targetChainId = import.meta.env.VITE_CHAIN_ID || '11155111';
    
    // --- START: NEW LOGIC FOR NETWORK AWARENESS ---
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);
    // --- END: NEW LOGIC FOR NETWORK AWARENESS ---
    
    const [copied, setCopied] = useState(false);

    // --- START: NEW FUNCTION TO CHECK THE NETWORK ---
    const checkNetwork = useCallback(async () => {
        if (!walletAddress || !window.ethereum) {
            setIsCorrectNetwork(false);
            setIsCheckingNetwork(false);
            return;
        }
        setIsCheckingNetwork(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const { chainId } = await provider.getNetwork();
            setIsCorrectNetwork(chainId.toString() === targetChainId);
        } catch (error) {
            console.error("Could not check network:", error);
            setIsCorrectNetwork(false);
        } finally {
            setIsCheckingNetwork(false);
        }
    }, [walletAddress, targetChainId]);

    useEffect(() => {
        // Initial check when the component mounts or walletAddress changes
        checkNetwork();

        // Listen for network changes from MetaMask in real-time
        if (window.ethereum) {
            const handleChainChanged = (chainId) => {
                console.log("Network changed to:", chainId);
                checkNetwork();
            };
            window.ethereum.on('chainChanged', handleChainChanged);

            // Cleanup the listener when the component unmounts
            return () => {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [checkNetwork, walletAddress]);
    // --- END: NEW FUNCTION AND EFFECT ---


    const handleCopyRpcUrl = () => {
        navigator.clipboard.writeText(rpcUrl).then(() => {
            setCopied(true);
            toast.success('RPC URL copied!');
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleSetupNetwork = async () => {
        if (typeof window.ethereum === 'undefined') {
            return toast.error('MetaMask not installed.');
        }
        const hexChainId = `0x${parseInt(targetChainId, 10).toString(16)}`;

        try {
            // First, try to switch to it, as this is the most common case
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            });
        } catch (switchError) {
            // This error code means the chain is not in the wallet, so we add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: hexChainId,
                            chainName: 'Coinback RPC (Sepolia)',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: [rpcUrl],
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }],
                    });
                } catch (addError) {
                    toast.error(`Failed to add network: ${addError.message}`);
                }
            } else {
                 toast.error(`Failed to switch network: ${switchError.message}`);
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
            
          
            {isCorrectNetwork ? (
                <button className="btn-secondary w-full" disabled>
                    <Wifi size={20} className="text-green-400"/>
                    <span>Connected to Coinback RPC</span>
                </button>
            ) : (
                <button onClick={handleSetupNetwork} className="btn-primary w-full" disabled={isCheckingNetwork}>
                    {isCheckingNetwork ? <Settings size={20} className="animate-spin" /> : <WifiOff size={20} />}
                    <span>Switch to Coinback RPC</span>
                </button>
            )}
        
            
        </div>
    );
};

export default RpcConfiguration;