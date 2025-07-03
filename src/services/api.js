const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RPC_URL = import.meta.env.VITE_COINBACK_RPC_URL;

const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('coinback_jwt');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response) => {
    if (!response.ok) {
        let error = { message: `Request failed: ${response.status} ${response.statusText}` };
        try {
            const errorBody = await response.json();
            error.message = errorBody.message || error.message;
        } catch (e) {
            // Ignore if error body isn't valid JSON
        }
        throw new Error(error.message);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return {};
};

// RPC Testing function - can be called from browser console for debugging
export const testRpcEndpoint = async () => {
    console.log('🧪 Testing Coinback RPC endpoint:', RPC_URL);
    
    try {
        // Test 1: Basic block number request
        console.log('Test 1: Basic block number request');
        const blockNumResponse = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'test-block-number',
                method: 'eth_blockNumber',
                params: []
            })
        });
        
        const blockNumData = await blockNumResponse.json();
        console.log('Block number response:', blockNumData);
        
        if (!blockNumData.result) {
            throw new Error('Failed to get block number');
        }
        
        // Test 2: Chain ID request
        console.log('Test 2: Chain ID request');
        const chainIdResponse = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'test-chain-id',
                method: 'eth_chainId',
                params: []
            })
        });
        
        const chainIdData = await chainIdResponse.json();
        console.log('Chain ID response:', chainIdData);
        
        if (!chainIdData.result) {
            throw new Error('Failed to get chain ID');
        }
        
        const chainIdHex = chainIdData.result;
        const chainIdDec = parseInt(chainIdHex, 16);
        console.log(`Chain ID: ${chainIdDec} (${chainIdHex})`);
        
        if (chainIdDec !== 11155111) {
            console.warn('⚠️ Chain ID is not Sepolia (11155111)');
        }
        
        // Test 3: Network version
        console.log('Test 3: Network version');
        const netVersionResponse = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'test-net-version',
                method: 'net_version',
                params: []
            })
        });
        
        const netVersionData = await netVersionResponse.json();
        console.log('Network version response:', netVersionData);
        
        // Test 4: Get gas price
        console.log('Test 4: Gas price');
        const gasPriceResponse = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'test-gas-price',
                method: 'eth_gasPrice',
                params: []
            })
        });
        
        const gasPriceData = await gasPriceResponse.json();
        console.log('Gas price response:', gasPriceData);
        
        console.log('✅ All RPC tests completed successfully!');
        return {
            success: true,
            blockNumber: blockNumData.result,
            chainId: chainIdHex,
            networkVersion: netVersionData.result,
            gasPrice: gasPriceData.result
        };
    } catch (error) {
        console.error('❌ RPC endpoint test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getSiweNonce = (address) => {
    const cacheBuster = `?t=${new Date().getTime()}`;
    return fetch(`${API_BASE_URL}/api/users/${address}/siwe-nonce${cacheBuster}`, {
        method: 'GET',
    }).then(handleResponse);
};

export const verifySiweSignature = (message, signature) => {
    return fetch(`${API_BASE_URL}/api/users/siwe/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
    }).then(handleResponse);
};

export const getUserProfile = () => {
    const cacheBuster = `?t=${new Date().getTime()}`;
    return fetch(`${API_BASE_URL}/api/users/profile${cacheBuster}`, { headers: getHeaders() }).then(handleResponse);
};

export const getTransactions = () => {
    const cacheBuster = `?t=${new Date().getTime()}`;
    return fetch(`${API_BASE_URL}/api/users/transactions${cacheBuster}`, { headers: getHeaders() }).then(handleResponse);
};

export const getClaimableRewards = () => {
    const cacheBuster = `?t=${new Date().getTime()}`;
    return fetch(`${API_BASE_URL}/api/rewards/claimable${cacheBuster}`, { headers: getHeaders() }).then(handleResponse);
};
