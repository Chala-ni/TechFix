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

async function handleApiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        let response = await fetch(endpoint, options);

        if (response.status === 401) {
            if (isRefreshing) {
                // Wait for the refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => handleApiRequest(endpoint, options));
            }

            isRefreshing = true;

            try {
                const newToken = await refreshToken();
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
            throw new Error('API request failed');
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    const refresh_token = localStorage.getItem('refresh_token');
    if (!token || !refresh_token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    try {
        console.log('Verifying token...');
        const response = await handleApiRequest('/api/users/verify');
        const data = await response.json();
        console.log('Token verification response:', data);

        if (data.user.role !== 'admin') {
            console.error('User is not admin:', data.user.role);
            throw new Error('Unauthorized: Admin access required');
        }
        
        console.log('Token verification successful');
    } catch (error) {
        console.error('Auth error:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = 'index.html';
    }
}

// Navigation
document.getElementById('suppliersBtn').addEventListener('click', () => showSection('suppliers'));
document.getElementById('quotationsBtn').addEventListener('click', () => showSection('quotations'));
document.getElementById('ordersBtn').addEventListener('click', () => showSection('orders'));
document.getElementById('productsBtn').addEventListener('click', () => showSection('products'));
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

function showSection(section) {
    document.getElementById('suppliersSection').style.display = 'none';
    document.getElementById('quotationsSection').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    document.getElementById('productsSection').style.display = 'none';
    document.getElementById(`${section}Section`).style.display = 'block';

    if (section === 'products') {
        document.getElementById('productsSection').style.display = 'block';
    }
    loadSectionData(section);
}

// Search and filter functionality
document.getElementById('supplierSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterSuppliers(searchTerm);
});

document.getElementById('quotationStatus').addEventListener('change', () => {
    loadSectionData('quotations');
});

document.getElementById('orderStatus').addEventListener('change', () => {
    loadSectionData('orders');
});

// Data loading functions
async function loadSectionData(section) {
    try {
        let endpoint = '';
        let params = new URLSearchParams();
        
        switch(section) {
            case 'suppliers':
                endpoint = '/api/users';
                params.append('role', 'supplier');
                break;
            case 'quotations':
                endpoint = '/api/quotations';
                const quotationStatus = document.getElementById('quotationStatus').value;
                if (quotationStatus !== 'all') {
                    params.append('status', quotationStatus);
                }
                break;
            case 'orders':
                endpoint = '/api/orders';
                const orderStatus = document.getElementById('orderStatus').value;
                if (orderStatus !== 'all') {
                    params.append('status', orderStatus);
                }
                break;
            case 'products':
                endpoint = '/api/products';
                break;
        }

        // Construct URL with parameters
        let url = endpoint;
        if (params.toString()) {
            url += '?' + params.toString();
        }
        console.log('Request URL:', url);
        
        console.log(`Loading ${section} data...`);
        const response = await handleApiRequest(url);
        const data = await response.json();
        console.log(`${section} data response:`, data);
        
        displayData(section, data);
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        alert(`Failed to load ${section}: ${error.message}`);
    }
}

// Display functions
function displayData(section, data) {
    const container = document.getElementById(`${section}List`);
    container.innerHTML = '';

    switch(section) {
        case 'suppliers':
            displaySuppliers(data, container);
            break;
        case 'quotations':
            displayQuotations(data, container);
            break;
        case 'orders':
            displayOrders(data, container);
            break;
        case 'products':
            displayProducts(data, container);
            break;
    }
}

function displaySuppliers(data, container) {
    // If data is not an array or is empty, show a message
    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p class="text-center">No suppliers found</p>';
        return;
    }

    data.forEach(supplier => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>${supplier.name}</h3>
            <p>Email: ${supplier.email}</p>
            <p>Status: ${supplier.status}</p>
            <button onclick="viewSupplierDetails(${supplier.id})" class="btn-primary">View Details</button>
            ${supplier.status === 'active' ? 
                `<button onclick="blockSupplier(${supplier.id})" class="btn-secondary">Block</button>` :
                `<button onclick="unblockSupplier(${supplier.id})" class="btn-primary">Unblock</button>`
            }
        `;
        container.appendChild(div);
    });
}

function displayQuotations(quotations, container) {
    quotations.forEach(quotation => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>Quotation No:${quotation.id}</h3>
            <p>Supplier: ${quotation.supplier_name}</p>
            <p>Product: ${quotation.product_name}</p>
            <p>Quantity: ${quotation.quantity}</p>
            <p>Status: ${quotation.status}</p>
            <div class="action-buttons">
                ${quotation.status === 'pending' ? `
                    <button onclick="approveQuotation(${quotation.id})" class="btn-primary">Approve</button>
                    <button onclick="rejectQuotation(${quotation.id})" class="btn-secondary">Reject</button>
                ` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function displayOrders(orders, container) {
    if (!Array.isArray(orders) || orders.length === 0) {
        container.innerHTML = '<p class="text-center">No orders found</p>';
        return;
    }
    
    orders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>Order No:${order.id}</h3>
            <p>Supplier: ${order.supplier_name}</p>
            <p>Status: <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span></p>
            <div class="items-container">
                ${order.items.map(item => `
                    <div class="order-item">
                        <p><strong>${item.product.name}</strong> (${item.product.part_number})</p>
                        <p>Quantity: ${item.qty}</p>
                        <p>Price: $${item.price.toFixed(2)}</p>
                    </div>
                `).join('')}
            </div>
            ${order.status === 'pending' ? `
                <button onclick="updateOrderStatus(${order.id}, 'cancelled')" class="btn-danger">Cancel Order</button>
            ` : order.status === 'shipped' ? `
                <button onclick="updateOrderStatus(${order.id}, 'completed')" class="btn-primary">Mark as Completed</button>
            ` : ''}
            <button onclick="viewOrderDetails(${order.id})" class="btn-secondary">View Details</button>
        `;
        container.appendChild(div);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await handleApiRequest(`/api/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            loadSectionData('orders');
            alert(`Order ${newStatus === 'cancelled' ? 'cancelled' : 'marked as ' + newStatus} successfully`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update order status. Please try again.');
    }
}

function displayProducts(products, container) {
    container.innerHTML = '';
    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = '<p class="text-center">No products found</p>';
        return;
    }
    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>${product.name}</h3>
            <p>SKU: ${product.part_number}</p>
            <p>Brand: ${product.manufacturer || 'N/A'}</p>
            <p>Category: ${product.category || 'N/A'}</p>
            <p>Description: ${product.description || 'N/A'}</p>
            <button class="btn-secondary">Edit</button>
            <button class="btn-secondary">Delete</button>
        `;
        container.appendChild(div);
    });
}

// Modal functions
function viewSupplierDetails(supplierId) {
    document.getElementById('supplierDetailsModal').style.display = 'block';
    loadSupplierDetails(supplierId);
}

function closeSupplierModal() {
    document.getElementById('supplierDetailsModal').style.display = 'none';
}

// Filter functions
function filterSuppliers(searchTerm) {
    const suppliers = document.querySelectorAll('#suppliersList .card');
    suppliers.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Action functions
async function approveQuotation(quotationId) {
    try {
        const response = await handleApiRequest(`/api/quotations/${quotationId}/approve`, {
            method: 'POST'
        });

        if (response.ok) {
            loadSectionData('quotations');
            alert('Quotation approved successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to approve quotation. Please try again.');
    }
}

async function rejectQuotation(quotationId) {
    try {
        const response = await handleApiRequest(`/api/quotations/${quotationId}/reject`, {
            method: 'POST'
        });

        if (response.ok) {
            loadSectionData('quotations');
            alert('Quotation rejected successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to reject quotation. Please try again.');
    }
}

// Supplier blocking functions
async function blockSupplier(supplierId) {
    try {
        const response = await handleApiRequest(`/api/users/${supplierId}/block`, {
            method: 'POST'
        });

        if (response.ok) {
            loadSectionData('suppliers');
            alert('Supplier blocked successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to block supplier. Please try again.');
    }
}

async function unblockSupplier(supplierId) {
    try {
        const response = await handleApiRequest(`/api/users/${supplierId}/unblock`, {
            method: 'POST'
        });

        if (response.ok) {
            loadSectionData('suppliers');
            alert('Supplier unblocked successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to unblock supplier. Please try again.');
    }
}

// Logout function
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.location.href = 'index.html';
}

// Initialize dashboard
checkAuth();
showSection('suppliers');
