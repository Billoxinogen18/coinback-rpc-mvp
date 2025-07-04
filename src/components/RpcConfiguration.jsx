import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Settings, Copy, CheckCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';

// Create a debug logger that includes timestamps
const debugLog = (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔌 RPC-CONFIG: ${message}`, data || '');
};

const RpcConfiguration = () => {
    debugLog('Component initializing');
    const { walletAddress } = useAuth();
    const rpcUrl = import.meta.env.VITE_COINBACK_RPC_URL;
    const targetChainId = import.meta.env.VITE_CHAIN_ID || '11155111';
    
    debugLog('Environment variables', { rpcUrl, targetChainId });
    
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [isUsingCoinbackRpc, setIsUsingCoinbackRpc] = useState(false);
    const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);
    const [networkDetails, setNetworkDetails] = useState(null);
    const [manualOverride, setManualOverride] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    
    const [copied, setCopied] = useState(false);

    // Enhanced function to check both chain ID and RPC URL
    const checkNetwork = useCallback(async () => {
        debugLog('Checking network connection status', { walletAddress });
        if (!walletAddress || !window.ethereum) {
            debugLog('No wallet connected or MetaMask not found');
            setIsCorrectNetwork(false);
            setIsUsingCoinbackRpc(false);
            setIsCheckingNetwork(false);
            return;
        }
        
        setIsCheckingNetwork(true);
        setErrorDetails(null);
        
        try {
            debugLog('Creating ethers provider');
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Check chain ID
            debugLog('Getting network information');
            const network = await provider.getNetwork();
            const { chainId, name } = network;
            debugLog('Current network', { chainId: chainId.toString(), name });
            
            // Get provider details
            debugLog('Getting provider details');
            let currentRpcUrl = 'unknown';
            try {
                // This is a non-standard way to get the RPC URL, but it works in some cases
                currentRpcUrl = window.ethereum.rpcUrls?.[0] || 'unknown';
                debugLog('Provider RPC URL (if available)', { currentRpcUrl });
            } catch (e) {
                debugLog('Could not get provider RPC URL', e);
            }
            
            // Store network details for debugging
            setNetworkDetails({
                chainId: chainId.toString(),
                name,
                currentRpcUrl,
                targetChainId,
                targetRpcUrl: rpcUrl
            });
            
            const correctChainId = chainId.toString() === targetChainId;
            debugLog('Chain ID check', { 
                current: chainId.toString(), 
                target: targetChainId,
                matches: correctChainId 
            });
            
            setIsCorrectNetwork(correctChainId);
            
            // Check if using Coinback RPC - IMPROVED METHOD
            if (correctChainId) {
                debugLog('On correct chain, checking if using Coinback RPC');
                
                // If user has manually confirmed they're using Coinback RPC, trust that
                if (manualOverride) {
                    debugLog('Using manual override - user confirmed Coinback RPC');
                    setIsUsingCoinbackRpc(true);
                    setIsCheckingNetwork(false);
                    return;
                }
                
                // RELIABILITY CHECK: Test our RPC endpoint with a simple call
                try {
                    // Make a test call to our RPC to check if it's working
                    const testResult = await fetch(rpcUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: Date.now(),
                            method: 'eth_blockNumber',
                            params: []
                        })
                    }).then(res => res.json());
                    
                    if (testResult.error) {
                        debugLog('Test call to Coinback RPC failed', testResult.error);
                        setErrorDetails({
                            message: 'Coinback RPC endpoint error',
                            details: testResult.error.message || 'Unknown error'
                        });
                    } else {
                        debugLog('Test call to Coinback RPC succeeded', testResult);
                    }
                } catch (err) {
                    debugLog('Error testing Coinback RPC endpoint', err);
                    setErrorDetails({
                        message: 'Could not connect to Coinback RPC',
                        details: err.message
                    });
                }
                
                // BETTER DETECTION: Use a unique identifier method
                try {
                    // DIRECT CHECK: Try to determine if MetaMask is using our RPC URL
                    let isUsingOurRpc = false;
                    
                    // Method 1: Check if our RPC URL appears in MetaMask's provider info
                    const providerInfo = window.ethereum.providerInfo || {};
                    const providerUrl = providerInfo.rpcUrl || '';
                    debugLog('Provider info', { providerInfo, providerUrl });
                    
                    const rpcUrlHost = rpcUrl ? new URL(rpcUrl).hostname : '';
                    
                    if (providerUrl && rpcUrlHost && providerUrl.includes(rpcUrlHost)) {
                        debugLog('RPC URL found in provider info');
                        isUsingOurRpc = true;
                    }
                    // Method 2: Check if MetaMask has our custom network
                    else {
                        try {
                            const networks = await window.ethereum.request({
                                method: 'wallet_getPermissions',
                                params: []
                            });
                            debugLog('MetaMask permissions', networks);
                            
                            // Look for our network in the permissions
                            if (networks && networks.length > 0) {
                                const hasOurNetwork = networks.some(network => 
                                    network.parentCapability === 'eth_accounts' && 
                                    network.caveats && 
                                    network.caveats.some(caveat => 
                                        caveat.type === 'restrictReturnedAccounts' && 
                                        caveat.value.some(val => 
                                            val.includes('Coinback RPC')
                                        )
                                    )
                                );
                                
                                if (hasOurNetwork) {
                                    debugLog('Found Coinback RPC in network permissions');
                                    isUsingOurRpc = true;
                                }
                            }
                        } catch (err) {
                            debugLog('Error checking network permissions', err);
                        }
                    }
                    
                    // New method: Try a specific test RPC call through MetaMask and see if it works with our backend
                    if (!isUsingOurRpc) {
                        try {
                            // Make a test RPC call through the user's MetaMask provider
                            const blockNumHex = await window.ethereum.request({ 
                                method: 'eth_blockNumber', 
                                params: [] 
                            });
                            
                            // Now make the same call directly to our RPC to compare
                            const directResponse = await fetch(rpcUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    jsonrpc: '2.0',
                                    id: Date.now(),
                                    method: 'eth_blockNumber',
                                    params: []
                                })
                            }).then(res => res.json());
                            
                            // If block numbers are identical or very close, they're likely from the same source
                            if (directResponse.result && blockNumHex) {
                                const metaMaskBlock = parseInt(blockNumHex, 16);
                                const directBlock = parseInt(directResponse.result, 16);
                                const blockDiff = Math.abs(metaMaskBlock - directBlock);
                                
                                debugLog('Block number comparison', { 
                                    metaMaskBlock, 
                                    directBlock, 
                                    difference: blockDiff 
                                });
                                
                                if (blockDiff <= 2) { // Allow up to 2 blocks difference due to timing
                                    debugLog('Block numbers match closely, likely using same RPC');
                                    isUsingOurRpc = true;
                                }
                            }
                        } catch (err) {
                            debugLog('Error in RPC comparison test', err);
                        }
                    }
                    
                    // FINAL CHECK: Force user to add our network if we're not sure
                    if (!isUsingOurRpc) {
                        // One last attempt - check if the network name contains "Coinback"
                        try {
                            const chainName = await window.ethereum.request({
                                method: 'eth_getChainName',
                                params: []
                            }).catch(() => null);
                            
                            if (chainName && chainName.includes('Coinback')) {
                                debugLog('Network name contains Coinback', { chainName });
                                isUsingOurRpc = true;
                            }
                        } catch (err) {
                            debugLog('Error checking chain name', err);
                        }
                    }
                    
                    debugLog('Final RPC detection result', { isUsingOurRpc });
                    setIsUsingCoinbackRpc(isUsingOurRpc);
                    
                    if (isUsingOurRpc) {
                        debugLog('✅ CONNECTED TO COINBACK RPC');
                        localStorage.setItem('coinback_rpc_connected', 'true');
                    } else {
                        debugLog('❌ NOT USING COINBACK RPC (using another Sepolia provider)');
                        localStorage.removeItem('coinback_rpc_connected');
                    }
                } catch (error) {
                    debugLog('Error verifying RPC endpoint', error);
                    setIsUsingCoinbackRpc(false);
                    localStorage.removeItem('coinback_rpc_connected');
                }
            } else {
                debugLog('Not on correct chain, cannot be using Coinback RPC');
                setIsUsingCoinbackRpc(false);
                localStorage.removeItem('coinback_rpc_connected');
            }
        } catch (error) {
            debugLog('Error checking network', error);
            setIsCorrectNetwork(false);
            setIsUsingCoinbackRpc(false);
            setErrorDetails({
                message: 'Error checking network',
                details: error.message
            });
        } finally {
            setIsCheckingNetwork(false);
        }
    }, [walletAddress, targetChainId, rpcUrl, manualOverride]);

    // Load manual override from localStorage on component mount
    useEffect(() => {
        const savedOverride = localStorage.getItem('coinback_rpc_connected');
        if (savedOverride === 'true') {
            setManualOverride(true);
        }
    }, []);

    // Debounce toast notifications to prevent UI glitches
    const [lastToastTime, setLastToastTime] = useState(0);
    const showToast = (message, type = 'success') => {
        const now = Date.now();
        if (now - lastToastTime > 1000) { // Prevent multiple toasts within 1 second
            setLastToastTime(now);
            if (type === 'success') {
                toast.success(message);
            } else if (type === 'error') {
                toast.error(message);
            } else {
                toast(message);
            }
        }
    };
    
    useEffect(() => {
        debugLog('Running initial network check');
        // Initial check when the component mounts or walletAddress changes
        checkNetwork();

        // Listen for network changes from MetaMask in real-time
        if (window.ethereum) {
            const handleChainChanged = (chainId) => {
                debugLog('Network changed event', { newChainId: chainId });
                // Reset manual override when network changes
                setManualOverride(false);
                localStorage.removeItem('coinback_rpc_connected');
                checkNetwork();
            };
            
            debugLog('Setting up chainChanged listener');
            window.ethereum.on('chainChanged', handleChainChanged);

            // Cleanup the listener when the component unmounts
            return () => {
                debugLog('Removing chainChanged listener');
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
        
        // Set up periodic checks to ensure RPC status is current
        debugLog('Setting up periodic RPC check interval');
        const intervalId = setInterval(() => {
            debugLog('Running periodic RPC check');
            checkNetwork();
        }, 30000); // Check every 30 seconds
        
        return () => {
            debugLog('Clearing periodic RPC check interval');
            clearInterval(intervalId);
        };
    }, [checkNetwork, walletAddress]);

    const handleCopyRpcUrl = () => {
        debugLog('Copying RPC URL to clipboard');
        navigator.clipboard.writeText(rpcUrl).then(() => {
            setCopied(true);
            showToast('RPC URL copied!');
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleSetupNetwork = async () => {
        debugLog('Setup network button clicked');
        if (typeof window.ethereum === 'undefined') {
            debugLog('MetaMask not installed');
            return showToast('MetaMask not installed.', 'error');
        }
        
        const hexChainId = `0x${parseInt(targetChainId, 10).toString(16)}`;
        debugLog('Target chain ID', { decimal: targetChainId, hex: hexChainId });

        try {
            // First, try to just switch to the Sepolia network if it already exists
            debugLog('Trying to switch to existing Sepolia network');
            try {
                // Set loading state first
                setIsCheckingNetwork(true);
                
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: hexChainId }],
                });
                debugLog('Successfully switched to Sepolia network');
                showToast('Switched to Sepolia network');
                
                // After switching to Sepolia, prompt the user to manually add the RPC URL
                debugLog('Showing RPC URL instructions');
                setTimeout(() => {
                    showToast('Now please add the Coinback RPC URL manually in your network settings');
                    
                    // Copy the RPC URL to the clipboard for easy pasting
                    navigator.clipboard.writeText(rpcUrl).then(() => {
                        setCopied(true);
                        setTimeout(() => {
                            showToast('RPC URL copied to clipboard! Add it in MetaMask network settings');
                            setCopied(false);
                        }, 500);
                    });
                    
                    // Show detailed instructions
                    setTimeout(() => {
                        toast((t) => (
                            <div onClick={() => toast.dismiss(t.id)}>
                                <p className="font-bold">How to add Coinback RPC:</p>
                                <ol className="list-decimal pl-5 text-sm">
                                    <li>In MetaMask, go to Settings</li>
                                    <li>Select Networks</li>
                                    <li>Click on "Sepolia"</li>
                                    <li>Replace the RPC URL with Coinback RPC URL (already copied)</li>
                                    <li>Save changes</li>
                                </ol>
                            </div>
                        ), { duration: 10000 });
                    }, 1000);
                }, 1000);
                
                // Set manual override
                setManualOverride(true);
                localStorage.setItem('coinback_rpc_connected', 'true');
                
                return;
            } catch (switchError) {
                // If the network doesn't exist, MetaMask will throw an error
                debugLog('Could not switch to existing network', switchError);
                
                // Only try to add the network if we couldn't switch to it
                if (switchError.code === 4902) {
                    debugLog('Network not found, adding Coinback RPC network');
                    
                    const networkParams = {
                        chainId: hexChainId,
                        chainName: 'Coinback RPC (Sepolia)',
                        nativeCurrency: { name: 'SepoliaETH', symbol: 'SepoliaETH', decimals: 18 },
                        rpcUrls: [rpcUrl],
                        blockExplorerUrls: ['https://sepolia.etherscan.io']
                    };
                    
                    debugLog('Adding Ethereum chain with params', networkParams);
                    
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkParams],
                    });
                    
                    debugLog('Successfully added Coinback RPC network');
                    showToast('Coinback RPC added to MetaMask!');
                    
                    // Set manual override
                    setManualOverride(true);
                    localStorage.setItem('coinback_rpc_connected', 'true');
                } else {
                    throw switchError;
                }
            }
            
            // Check after a delay
            debugLog('Scheduling network check after setup');
            setTimeout(() => {
                debugLog('Running post-setup network check');
                checkNetwork();
            }, 1000);
        } catch (error) {
            debugLog('Error setting up network', error);
            showToast(`Failed to set up network: ${error.message}`, 'error');
        }
    };

    // Manual override function for users to confirm they're using Coinback RPC
    const handleManualConfirm = () => {
        debugLog('User manually confirmed using Coinback RPC');
        setManualOverride(true);
        localStorage.setItem('coinback_rpc_connected', 'true');
        setIsUsingCoinbackRpc(true);
        showToast('Confirmed using Coinback RPC!');
    };
    
    return (
        <div className="card space-y-8">
            <div className="flex items-center gap-3">
                <Settings size={20} className="text-primary" />
                <h2 className="text-xl font-bold">RPC Configuration</h2>
            </div>
            
            {/* Debug information - only visible in development */}
            {import.meta.env.DEV && networkDetails && (
                <div className="p-3 bg-surface/30 rounded-lg text-xs font-mono overflow-auto">
                    <div className="font-semibold mb-1">Debug Info:</div>
                    <div>Chain ID: {networkDetails.chainId} (Target: {networkDetails.targetChainId})</div>
                    <div>Network: {networkDetails.name}</div>
                    <div className="truncate">Current RPC: {networkDetails.currentRpcUrl}</div>
                    <div className="truncate">Target RPC: {networkDetails.targetRpcUrl}</div>
                    <div>Status: {isUsingCoinbackRpc ? '✅ Using Coinback RPC' : '❌ Not using Coinback RPC'}</div>
                    <div>Manual Override: {manualOverride ? 'Yes' : 'No'}</div>
                    {errorDetails && (
                        <div className="mt-2 text-red-500">
                            <div>Error: {errorDetails.message}</div>
                            <div>Details: {errorDetails.details}</div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Error banner for all users if there's an issue with the RPC */}
            {errorDetails && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                    <div className="font-bold flex items-center">
                        <AlertTriangle size={16} className="mr-1" />
                        {errorDetails.message}
                    </div>
                    <div className="mt-1 text-xs">{errorDetails.details}</div>
                    <div className="mt-2 text-xs">
                        You can still use the app by confirming that you're using Coinback RPC below.
                    </div>
                </div>
            )}
            
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
            
            {isCorrectNetwork && isUsingCoinbackRpc ? (
                <button className="btn-secondary w-full" disabled>
                    <Wifi size={20} className="text-green-400"/>
                    <span>Connected to Coinback RPC</span>
                </button>
            ) : (
                <div className="space-y-2">
                    <button onClick={handleSetupNetwork} className="btn-primary w-full" disabled={isCheckingNetwork}>
                        {isCheckingNetwork ? <Settings size={20} className="animate-spin" /> : <WifiOff size={20} />}
                        <span>{isCorrectNetwork ? 'Switch to Coinback RPC' : 'Switch to Sepolia Network'}</span>
                    </button>
                    
                    {isCorrectNetwork && !isUsingCoinbackRpc && (
                        <div className="text-center">
                            <button 
                                onClick={handleManualConfirm} 
                                className="text-xs text-primary hover:underline flex items-center justify-center mx-auto"
                            >
                                <AlertTriangle size={12} className="mr-1" />
                                I'm already using Coinback RPC
                            </button>
                            <p className="text-xs text-textMuted mt-1">
                                Click above if you've manually added the RPC URL to MetaMask
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RpcConfiguration;