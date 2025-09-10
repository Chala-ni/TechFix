async function loadSectionData(section) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }

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
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${section}`);
        }

        const data = await response.json();
        displayData(section, data);
        
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        if (error.message.includes('Authentication failed') || error.message.includes('No token found')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        } else {
            alert(`Failed to load ${section}: ${error.message}`);
        }
    }
}

function displayData(section, data) {
    const container = document.getElementById(`${section}List`);
    if (!container) return;
    
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
