// This service will interact with the new Coinback backend API(production )

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'; 

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('coinback_jwt'); 
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText || `API request failed with status ${response.status}`};
      }
      console.error('API Error Data:', errorData);
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    if (response.status === 204) { 
        return null;
    }
    return response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error.message);
    throw error;
  }
}

export const getSiweNonce = (walletAddress) => {
  return request(`/users/${walletAddress}/siwe-nonce`, { method: 'GET' });
};

export const verifySiweSignature = (walletAddress, message, signature) => {
  return request(`/users/${walletAddress}/siwe-verify`, {
    method: 'POST',
    body: JSON.stringify({ message, signature }),
  });
};

export const getClaimableRewards = () => { // walletAddress is now in JWT
  return request(`/rewards/claimable`, { method: 'GET' });
};

export const getStakingSummary = () => { // walletAddress is now in JWT
  return request(`/staking/summary`, { method: 'GET' });
};

export const getUserProfileFromApi = (walletAddress) => { // walletAddress in path, protected by JWT
  return request(`/users/${walletAddress}/profile`, { method: 'GET' });
};
