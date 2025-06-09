const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
