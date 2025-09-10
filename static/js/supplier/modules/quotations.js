import { handleApiRequest } from '../api/api-handler.js';

async function loadQuotations() {
    try {
        const response = await handleApiRequest('/api/quotations');
        const quotations = await response.json();
        displayQuotations(quotations);
    } catch (error) {
        console.error('Error loading quotations:', error);
        throw error;
    }
}

function openQuotationModal() {
    const modal = document.getElementById('quotationModal');
    modal.style.display = 'block';
    // Clear previous items and add one fresh item
    document.getElementById('quotationItems').innerHTML = '';
    addQuotationItem();
}

function closeQuotationModal() {
    const modal = document.getElementById('quotationModal');
    const form = document.getElementById('quotationForm');
    form.reset();
    document.getElementById('quotationItems').innerHTML = '';
    addQuotationItem();
    modal.style.display = 'none';
}

function addQuotationItem() {
    const itemsContainer = document.getElementById('quotationItems');
    const newItem = document.createElement('div');
    newItem.className = 'quotation-item';
    
    // Improved HTML structure with proper ID and name attributes
    const itemId = `item_${Date.now()}`;
    newItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label for="product_${itemId}">Product</label>
                <select id="product_${itemId}" name="product" class="product-select" required>
                    <option value="">Select Product</option>
                </select>
            </div>
            <div class="form-group">
                <label for="qty_${itemId}">Quantity</label>
                <input type="number" id="qty_${itemId}" name="qty" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label for="price_${itemId}">Price</label>
                <div class="price-input">
                    <span class="currency-symbol">$</span>
                    <input type="number" id="price_${itemId}" name="price" step="0.01" min="0" value="0.00" required>
                </div>
            </div>
        </div>
        ${itemsContainer.children.length > 0 ? '<button type="button" class="btn-danger remove-item" aria-label="Remove item"><i class="fas fa-times"></i></button>' : ''}
    `;
    
    // Add event listener to the remove button
    const removeButton = newItem.querySelector('.remove-item');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            removeQuotationItem(this);
        });
    }
    
    itemsContainer.appendChild(newItem);
    populateProductSelect(newItem.querySelector('.product-select'));
}

function removeQuotationItem(button) {
    button.closest('.quotation-item').remove();
}

async function populateProductSelect(select) {
    try {
        const response = await handleApiRequest('/api/products');
        const products = await response.json();
        const selects = select ? [select] : document.querySelectorAll('.product-select');
        
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Product</option>';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.part_number})`;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please try again.');
    }
}

function displayQuotations(quotations) {
    const container = document.getElementById('quotationsList');
    container.innerHTML = '';

    if (!Array.isArray(quotations) || quotations.length === 0) {
        container.innerHTML = `
            <div class="no-quotations">
                <i class="fas fa-file-invoice"></i>
                <p>No quotations found</p>
                <button class="create-quotation-btn" onclick="openQuotationModal()">
                    <i class="fas fa-plus"></i> Create New Quotation
                </button>
            </div>
        `;
        return;
    }

    // Add section wrapper and header, with only the filter (removed New Quotation button)
    container.innerHTML = `
        <div class="quotations-section">
            <div class="quotations-header">
                <div class="quotations-controls">
                    <div class="quotations-filter">
                        <label for="statusFilter">Filter by:</label>
                        <select id="statusFilter" onchange="filterQuotations(this.value)">
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="quotationsGrid"></div>
        </div>
    `;

    const quotationsGrid = document.getElementById('quotationsGrid');

    quotations.forEach(quotation => {
        const div = document.createElement('div');
        div.className = 'quotation-card';
        div.setAttribute('data-status', quotation.status);
        
        let itemsHtml = '';
        let totalAmount = 0;
        
        quotation.items.forEach(item => {
            const itemTotal = item.qty * item.price;
            totalAmount += itemTotal;
            itemsHtml += `
                <div class="quotation-item">
                    <div class="item-header">
                        <h4>${item.product.name}</h4>
                    </div>
                    <div class="item-details">
                        <span class="item-price">$${item.price.toFixed(2)}</span>
                    </div>
                    <p><strong>SKU:</strong> ${item.product.part_number}</p>
                    <p><strong>Quantity:</strong> ${item.qty}</p>
                    <p><strong>Subtotal:</strong> $${itemTotal.toFixed(2)}</p>
                </div>
            `;
        });

        const statusClass = quotation.status === 'pending' ? 'status-pending' : 
                           quotation.status === 'accepted' ? 'status-accepted' : 'status-rejected';
                           
        const formattedDate = new Date(quotation.quotation_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        div.innerHTML = `
            <h3>
                Quotation No:${quotation.id}
            </h3>
            <div class="quotation-info">
                <p>
                    <span class="status-badge ${statusClass}">${quotation.status}</span>
                </p>
                <p>
                    <span class="quotation-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                </p>
            </div>
            <div class="items-container">
                <div class="quotation-items-grid">
                    ${itemsHtml}
                </div>
            </div>
            <p class="total-amount">Total: $${totalAmount.toFixed(2)}</p>
        `;
        quotationsGrid.appendChild(div);
    });
}

// Filter quotations by status
window.filterQuotations = function(status) {
    const quotationCards = document.querySelectorAll('.quotation-card');
    
    quotationCards.forEach(card => {
        if (status === 'all' || card.getAttribute('data-status') === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
};

// Initialize form submission handler - improved with better debugging
document.addEventListener('DOMContentLoaded', () => {
    const quotationForm = document.getElementById('quotationForm');
    
    if (quotationForm) {
        quotationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submission started');
            
            const items = [];
            const quotationItems = document.querySelectorAll('#quotationItems .quotation-item');
            console.log(`Found ${quotationItems.length} quotation items`);
            
            if (quotationItems.length === 0) {
                alert('Please add at least one item to the quotation.');
                return;
            }
            
            try {
                quotationItems.forEach((item, index) => {
                    console.log(`Processing item ${index + 1}`);
                    
                    // Improved selectors - more specific and robust
                    const productSelect = item.querySelector('select.product-select');
                    const qtyInput = item.querySelector('input[name="qty"]');
                    const priceInput = item.querySelector('input[name="price"]');
                    
                    console.log(`Product select found: ${!!productSelect}`);
                    console.log(`Quantity input found: ${!!qtyInput}`);
                    console.log(`Price input found: ${!!priceInput}`);
                    
                    // Check if all required elements exist before accessing their values
                    if (!productSelect || !qtyInput || !priceInput) {
                        throw new Error(`Missing form elements in item ${index + 1}. Please check the form structure.`);
                    }
                    
                    // Check for valid values
                    if (!productSelect.value) {
                        throw new Error(`Please select a product for item ${index + 1}.`);
                    }
                    
                    // Create the item object with proper validation
                    items.push({
                        product_id: parseInt(productSelect.value),
                        qty: parseInt(qtyInput.value) || 1,
                        price: parseFloat(priceInput.value) || 0
                    });
                });
                
                console.log('Sending request with items:', items);
                
                const response = await handleApiRequest('/api/quotations', {
                    method: 'POST',
                    body: JSON.stringify({ items })
                });

                if (response.ok) {
                    console.log('Quotation submitted successfully');
                    closeQuotationModal();
                    loadQuotations();
                    alert('Quotation submitted successfully');
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to submit quotation');
                }
            } catch (error) {
                console.error('Error during submission:', error);
                alert(error.message || 'An error occurred while submitting the quotation.');
            }
        });
    } else {
        console.error('Quotation form not found in the document');
    }
});

// Make the function available globally
window.removeQuotationItem = removeQuotationItem;

export { 
    loadQuotations, 
    openQuotationModal, 
    closeQuotationModal, 
    addQuotationItem, 
    removeQuotationItem 
};
