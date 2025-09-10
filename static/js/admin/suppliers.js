// Global variable to store suppliers data
let currentSuppliers = [];

function displaySuppliers(data, container) {
    // Store suppliers data in the global variable for later use
    currentSuppliers = data;

    // If data is not an array or is empty, show a message
    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p class="empty-message">No suppliers found</p>';
        return;
    }

    container.innerHTML = ''; // Clear existing content

    data.forEach(supplier => {
        const supplierCard = document.createElement('div');
        supplierCard.className = 'supplier-card-wrapper';

        const statusClass = supplier.status === 'active' ? 'status-badge-active' : 'status-badge-inactive';

        supplierCard.innerHTML = `
            <div class="supplier-header">
                <h3 class="supplier-name">${supplier.name}</h3>
                <span class="supplier-status ${statusClass}">${supplier.status}</span>
            </div>
            <div class="supplier-body">
                <div class="supplier-contact">
                    <p><i class="fas fa-envelope"></i> ${supplier.email}</p>
                </div>
                <div class="supplier-actions">
                    <button onclick="viewSupplierDetails(${supplier.id})" class="action-button view-button">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${supplier.status === 'active' ?
                        `<button onclick="blockSupplier(${supplier.id})" class="action-button block-button">
                            <i class="fas fa-ban"></i>
                        </button>` :
                        `<button onclick="unblockSupplier(${supplier.id})" class="action-button unblock-button">
                            <i class="fas fa-check-circle"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
        container.appendChild(supplierCard);
    });
}

function viewSupplierDetails(supplierId) {
    // Find the supplier from the already loaded data
    const supplier = currentSuppliers.find(s => s.id === supplierId);

    if (!supplier) {
        console.error('Supplier not found');
        alert('Failed to find supplier details');
        return;
    }

    // Show the modal with the supplier details
    const modal = document.getElementById('supplierDetailsModal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>Supplier Details</h2>
            <span class="close" onclick="closeSupplierModal()">×</span>
        </div>
        <div class="modal-body">
            <div class="supplier-details">
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-user"></i> Name:</span>
                    <span class="detail-value">${supplier.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-envelope"></i> Email:</span>
                    <span class="detail-value">${supplier.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-phone"></i> Contact Number:</span>
                    <span class="detail-value">${supplier.contact_number || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-map-marker-alt"></i> Address:</span>
                    <span class="detail-value">${supplier.address || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-info-circle"></i> Status:</span>
                    <span class="detail-value status-badge ${supplier.status === 'active' ? 'status-badge-active' : 'status-badge-inactive'}">${supplier.status}</span>
                </div>
                ${supplier.blocked_at ? `
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-clock"></i> Blocked At:</span>
                    <span class="detail-value">${new Date(supplier.blocked_at).toLocaleString()}</span>
                </div>` : ''}
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeSupplierModal()" class="btn-secondary">Close</button>
        </div>
    `;

    modal.style.display = 'block';
}

function closeSupplierModal() {
    document.getElementById('supplierDetailsModal').style.display = 'none';
}

function filterSuppliers(searchTerm) {
    const suppliers = document.querySelectorAll('#suppliersList .supplier-card-wrapper');
    suppliers.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

async function blockSupplier(supplierId) {
    try {
        const response = await fetch(`/api/users/${supplierId}/block`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loadSectionData('suppliers');
            alert('Supplier blocked successfully!');
        } else {
            throw new Error('Failed to block supplier');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to block supplier. Please try again.');
    }
}

async function unblockSupplier(supplierId) {
    try {
        const response = await fetch(`/api/users/${supplierId}/unblock`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loadSectionData('suppliers');
            alert('Supplier unblocked successfully!');
        } else {
            throw new Error('Failed to unblock supplier');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to unblock supplier. Please try again.');
    }
}