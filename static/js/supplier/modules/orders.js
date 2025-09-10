import { handleApiRequest } from '../api/api-handler.js';

async function loadOrders() {
    try {
        const response = await handleApiRequest('/api/orders/supplier');
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        throw error;
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    container.innerHTML = '';

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
            <h3>Order No:${order.id}</h3>
            <p>Status: <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span></p>
            <p>Order Date: ${new Date(order.created_at).toLocaleDateString()}</p>
            <div class="items-container">
                ${itemsHtml}
            </div>
            <p class="total-amount"><strong>Total Amount: $${totalAmount.toFixed(2)}</strong></p>
            <div class="action-buttons">
                ${order.status === 'pending' ? `
                    <button onclick="updateOrderStatus(${order.id}, 'confirmed')" class="btn-primary">Confirm Order</button>
                    <button onclick="updateOrderStatus(${order.id}, 'cancelled')" class="btn-danger">Cancel Order</button>
                ` : order.status === 'confirmed' ? `
                    <button onclick="updateOrderStatus(${order.id}, 'shipped')" class="btn-primary">Mark as Shipped</button>
                ` : ''}
            </div>
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
            loadOrders();
            alert(`Order status updated to ${newStatus}`);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update order status');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// Make updateOrderStatus available globally for the onclick handlers
window.updateOrderStatus = updateOrderStatus;

export { loadOrders };
