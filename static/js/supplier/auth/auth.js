// Token management
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}

async function refreshToken() {
    try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (!refresh_token) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refresh_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
        return data.access_token;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = 'index.html';
        throw error;
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const refresh_token = localStorage.getItem('refresh_token');
    if (!token || !refresh_token) {
        window.location.href = 'index.html';
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.location.href = 'index.html';
}

export { checkAuth, refreshToken, processQueue, handleLogout };
