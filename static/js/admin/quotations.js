function displayQuotations(quotations, container) {
    if (!Array.isArray(quotations) || quotations.length === 0) {
        container.innerHTML = '<p class="text-center">No quotations found</p>';
        return;
    }

    quotations.forEach(quotation => {
        const div = document.createElement('div');
        div.className = 'card quotation-card';
        
        // Get status class for badge
        const statusClass = getStatusClass(quotation.status);
        
        // Calculate total amount of quotation
        const totalAmount = quotation.items.reduce((sum, item) => sum + item.total, 0).toFixed(2);

        // Create items HTML
        const itemsHtml = quotation.items.map(item => `
            <div class="quotation-item">
                <div class="product-info">
                    <span class="product-name">${item.product.name}</span>
                </div>
                <div class="product-details">
                    <span class="price-badge">$${item.price.toFixed(2)}</span>
                    <span class="qty-badge">${item.qty} units</span>
                </div>
                <div class="item-total">
                    $${item.total.toFixed(2)}
                </div>
            </div>
        `).join('');

        div.innerHTML = `
            <div class="card-header">
                <div class="quotation-header-info">
                    <h3>Quotation No:${quotation.id}</h3>
                    <span class="status-badge ${statusClass}">${quotation.status}</span>
                </div>
                <div class="quotation-date">
                    <i class="fas fa-calendar-alt"></i> ${new Date(quotation.quotation_date).toLocaleDateString()}
                </div>
            </div>
            <div class="card-body">
                <div class="quotation-summary">
                    <div class="summary-item">
                        <span class="summary-label">Items</span>
                        <span class="summary-value">${quotation.items.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total</span>
                        <span class="summary-value highlight">$${totalAmount}</span>
                    </div>
                </div>
                
                <div class="quotation-items">
                    <h4>Items:</h4>
                    <div class="items-list">
                        ${itemsHtml}
                    </div>
                </div>
                
                ${quotation.status === 'pending' ? `
                <div class="card-actions">
                    <button onclick="approveQuotation(${quotation.id})" class="btn-primary">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="rejectQuotation(${quotation.id})" class="btn-secondary">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-badge-pending';
        case 'approved': return 'status-badge-approved';
        case 'rejected': return 'status-badge-rejected';
        default: return '';
    }
}

async function approveQuotation(quotationId) {
    try {
        const response = await fetch(`/api/quotations/${quotationId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loadSectionData('quotations');
            alert('Quotation approved successfully!');
        } else {
            throw new Error('Failed to approve quotation');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to approve quotation. Please try again.');
    }
}

async function rejectQuotation(quotationId) {
    try {
        const response = await fetch(`/api/quotations/${quotationId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loadSectionData('quotations');
            alert('Quotation rejected successfully!');
        } else {
            throw new Error('Failed to reject quotation');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to reject quotation. Please try again.');
    }
}
