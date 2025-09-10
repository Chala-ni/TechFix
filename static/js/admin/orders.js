//admin order.js
let currentOrders = []; // Store orders data globally

function displayOrders(orders, container) {
    currentOrders = orders; // Store for use in other functions
    if (!Array.isArray(orders) || orders.length === 0) {
        container.innerHTML = '<p class="text-center">No orders found</p>';
        return;
    }

    orders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'card order-card';

        let itemsHtml = '';
        let totalAmount = 0;

        order.items.forEach(item => {
            const itemTotal = item.qty * item.price;
            totalAmount += itemTotal;
            itemsHtml += `
                <div class="order-item">
                    <p><strong>${item.product.name}</strong> (${item.product.part_number})</p>
                    <p>Quantity: ${item.qty}</p>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <p>Total: $${itemTotal.toFixed(2)}</p>
                </div>
            `;
        });

        div.innerHTML = `
            <h3>Order ${order.id}</h3>
            <p>Status: <span class="status-badge ${getOrderStatusClass(order.status)}">${order.status}</span></p>
            <p>Order Date: ${new Date(order.order_date).toLocaleDateString()}</p>
            <div class="items-container">
                ${itemsHtml}
            </div>
            <p class="total-amount"><strong>Total Amount: $${totalAmount.toFixed(2)}</strong></p>
            <div class="action-buttons">
                 <button onclick="viewOrderDetails(${order.id})" class="btn-primary">View Details</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function getOrderStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-badge-pending';
        case 'processing': return 'status-badge-processing';
        case 'completed': return 'status-badge-completed';
        case 'cancelled': return 'status-badge-cancelled';
        default: return '';
    }
}

function viewOrderDetails(orderId) {
    const orderModal = document.getElementById('orderDetailsModal');
    if (!orderModal) {
        console.error('Order details modal not found');
        return;
    }

    const order = currentOrders.find(o => o.id === orderId);
    if (!order) {
        console.error('Order not found');
        return;
    }

    orderModal.style.display = 'block';

    const modalContent = orderModal.querySelector('.modal-content');
    // Calculate total order amount
    const totalOrderAmount = order.items.reduce((sum, item) => sum + item.total, 0).toFixed(2);

    // Create items HTML with improved styling
    let itemsHtml = order.items.map(item => `
        <div class="order-item">
            <div class="order-item-header">
                <span class="item-name">${item.product.name}</span>
                <span class="item-quantity">${item.qty} × $${Number(item.price).toFixed(2)}</span>
            </div>
            <div class="order-item-details">
                <div class="details-row">
                    <span class="detail-label">Price per unit:</span>
                    <span class="detail-value">$${Number(item.price).toFixed(2)}</span>
                </div>
                <div class="details-row">
                    <span class="detail-label">Total for item:</span>
                    <span class="detail-value">$${Number(item.total).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>Order Details ${order.id}</h2>
            <span class="close" onclick="closeOrderModal()">&times;</span>
        </div>
        <div class="modal-body">
            <div class="order-details">
                <div class="order-info-section">
                    <div class="info-block">
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-calendar"></i> Date</span>
                            <span class="info-value">${new Date(order.order_date).toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-tag"></i> Status</span>
                            <span class="info-value status-badge ${getOrderStatusClass(order.status)}">${order.status}</span>
                        </div>
                    </div>
                    <div class="info-block">
                        <div class="info-item">
                            <span class="info-label"><i class="fas fa-file-invoice"></i> Quotation Status</span>
                            <span class="info-value status-badge ${getOrderStatusClass(order.quotation.status)}">${order.quotation.status}</span>
                        </div>
                    </div>
                </div>
                
                <h3><i class="fas fa-box"></i> Order Items</h3>
                <div class="items-container">
                    ${itemsHtml}
                </div>
                
                <div class="order-summary-footer">
                    <div class="summary-total">
                        <span class="total-label">Total Order Amount:</span>
                        <span class="total-value">$${totalOrderAmount}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeOrderModal()" class="btn-secondary">Close</button>
        </div>
    `;
}

function closeOrderModal() {
    const orderModal = document.getElementById('orderDetailsModal');
    if (orderModal) {
        orderModal.style.display = 'none';
    }
}
