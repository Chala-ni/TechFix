import { refreshToken, processQueue } from '../auth/auth.js';

let isRefreshing = false;
let failedQueue = [];

async function handleApiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        console.log('Token found:', !!token);
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('Making API request to:', endpoint, 'with method:', options.method || 'GET');
        if (options.body) {
            console.log('Request payload:', JSON.parse(options.body));
        }
        
        let response = await fetch(endpoint, options);
        console.log('Response status:', response.status);

        if (response.status === 401) {
            console.log('Received 401, attempting token refresh...');
            if (isRefreshing) {
                // Wait for the refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => handleApiRequest(endpoint, options));
            }

            isRefreshing = true;

            try {
                const newToken = await refreshToken();
                console.log('Token refreshed successfully');
                isRefreshing = false;
                processQueue(null, newToken);

                // Retry the request with new token
                options.headers['Authorization'] = `Bearer ${newToken}`;
                return fetch(endpoint, options);
            } catch (error) {
                isRefreshing = false;
                processQueue(error);
                throw error;
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('API request failed:', response.status, errorData);
            if (response.status === 404) {
                throw new Error('API endpoint not found. Please check the URL.');
            }
            if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            }
            if (response.status === 403) {
                throw new Error('You do not have permission to access this resource.');
            }
            throw new Error(errorData?.error || errorData?.message || 'API request failed');
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

export { handleApiRequest };
