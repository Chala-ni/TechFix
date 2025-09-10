async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    try {
        console.log('Verifying token...');
        const response = await fetch('/api/users/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Token verification response:', data);

        if (!response.ok) {
            console.error('Token verification failed:', data.error || 'Unknown error');
            throw new Error(data.error || 'Token verification failed');
        }

        if (data.user.role !== 'admin') {
            console.error('User is not admin:', data.user.role);
            throw new Error('Unauthorized: Admin access required');
        }
        
        console.log('Token verification successful');
    } catch (error) {
        console.error('Auth error:', error.message);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}