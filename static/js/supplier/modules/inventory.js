import { handleApiRequest } from '../api/api-handler.js';

async function loadInventory() {
    try {
        console.log('Fetching inventory...');
        const response = await handleApiRequest('/api/inventory');
        const inventory = await response.json();
        console.log('Inventory data:', inventory);

        if (!Array.isArray(inventory)) {
            throw new Error('Invalid inventory data received');
        }

        displayInventory(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventoryList').innerHTML = `
            <p class="text-center">Error loading inventory: ${error.message}</p>
        `;
    }
}

async function displayInventory(inventory) {
    const container = document.getElementById('inventoryList');
    container.innerHTML = '';

    if (inventory.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <h3>No Products in Inventory</h3>
                <p>Click the "Add New Product to Inventory" button to start managing your inventory.</p>
            </div>
        `;
        return;
    }

    const tableContainer = document.createElement('div');
    tableContainer.className = 'inventory-table-container';

    const table = document.createElement('table');
    table.className = 'inventory-table';

    // Table Header (This part remains the same)
    table.innerHTML = `
        <thead>
            <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Brand</th>
                <th class="quantity">Quantity</th>
                <th class="actions">Actions</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    // Table Rows (Data) - Corrected Loop
    for (const item of inventory) {
        const isOutOfStock = item.quantity <= 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="product-name">${item.product.name}</td>
            <td>${item.product.category || 'N/A'}</td>
            <td class="sku">${item.product.part_number || 'N/A'}</td>
            <td class="brand">${item.product.manufacturer || 'N/A'}</td>
            <td class="quantity">
                <span class="badge badge-${isOutOfStock ? 'danger' : 'success'}">
                    ${isOutOfStock ? 'Out of Stock' : item.quantity}
                </span>
            </td>
            <td class="actions">
                <button class="btn-primary" onclick="updateInventoryItem(${item.product_id}, ${item.quantity})">Update</button>
            </td>
        `;
        tbody.appendChild(row); // Append the ENTIRE row to the tbody
    }


    tableContainer.appendChild(table); // Add the FULLY constructed table to the container
    container.appendChild(tableContainer);
}

// --- The rest of your functions (updateInventoryItem, etc.) remain unchanged ---

async function updateInventoryItem(productId, currentQuantity) {
    // Create and show a modal rather than using a dialog function
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'quantityUpdateModal';
    modal.style.display = 'flex'; // Set display to flex to make it visible immediately

    modal.innerHTML = `
        <div class="modal-content enhanced-modal" style="padding: 20px;">
            <div class="modal-header">
                <h3>Update Inventory</h3>
                <span class="close" id="closeQuantityModal">×</span>
            </div>
            <div class="modal-body">
                <p>Enter new quantity:</p>
                <div class="form-group">
                    <input type="number" id="quantityInput" min="0" value="${currentQuantity}" class="form-control">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelQuantityBtn">Cancel</button>
                <button class="btn-primary" id="saveQuantityBtn">Save</button>
            </div>
        </div>
    `;

    // Add the modal to the document body
    document.body.appendChild(modal);

    // Set up event handlers
    document.getElementById('closeQuantityModal').onclick = () => {
        document.body.removeChild(modal);
    };

    document.getElementById('cancelQuantityBtn').onclick = () => {
        document.body.removeChild(modal);
    };

    document.getElementById('saveQuantityBtn').onclick = async () => {
        const quantity = parseInt(document.getElementById('quantityInput').value);
        if (isNaN(quantity) || quantity < 0) {
            alert('Please enter a valid quantity');
            return;
        }

        // Remove the modal
        document.body.removeChild(modal);

        try {
            const response = await handleApiRequest('/api/inventory/update', {
                method: 'PUT',
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });

            if (response.ok) {
                alert('Inventory updated successfully');
                loadInventory();
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert('Failed to update inventory: ' + error.message);
        }
    };

    // Focus on the input
    document.getElementById('quantityInput').focus();
}

async function removeInventoryItem(productId) {
    if (!confirm('Are you sure you want to remove this item from your inventory?')) {
        return;
    }

    try {
        const response = await handleApiRequest('/api/inventory/update', {
            method: 'PUT',
            body: JSON.stringify({
                product_id: productId,
                quantity: 0
            })
        });

        if (response.ok) {
            alert('Item removed from inventory');
            loadInventory();
        }
    } catch (error) {
        console.error('Error removing inventory item:', error);
        alert('Failed to remove item: ' + error.message);
    }
}

// Add inventory modal functions
async function openInventoryModal() {
    try {
        // Load both products and inventory to compare
        const [productsResponse, inventoryResponse] = await Promise.all([
            handleApiRequest('/api/products'),
            handleApiRequest('/api/inventory')
        ]);

        const products = await productsResponse.json();
        const inventory = await inventoryResponse.json();

        // Create set of product IDs already in inventory
        const inventoryProductIds = new Set(inventory.map(item => item.product_id));

        // Filter products not in inventory
        const availableProducts = products.filter(product => !inventoryProductIds.has(product.id));

        const productSelect = document.getElementById('productSelect');
        productSelect.innerHTML = '<option value="">Select a product</option>';

        if (availableProducts.length === 0) {
            productSelect.innerHTML += '<option value="" disabled>All products are already in inventory</option>';
        } else {
            availableProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - ${product.part_number || 'NO SKU'}`;
                productSelect.appendChild(option);
            });
        }

        // Show the modal
        document.getElementById('addInventoryModal').style.display = 'flex';

        // Setup form submission
        const form = document.getElementById('addInventoryForm');
        form.onsubmit = addToInventory;
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products: ' + error.message);
    }
}

function closeInventoryModal() {
    document.getElementById('addInventoryModal').style.display = 'none';
    document.getElementById('addInventoryForm').reset();
}

async function addToInventory(event) {
    event.preventDefault();

    const productId = document.getElementById('productSelect').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!productId) {
        alert('Please enter a valid quantity');
        return;
    }
    if (isNaN(quantity) || quantity <= 0) {
            return;
    }

    try {
        const response = await handleApiRequest('/api/inventory/add', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });

        if (response.ok) {
            alert('Product added to inventory successfully');
            closeInventoryModal();
            loadInventory();
        }
    } catch (error) {
        console.error('Error adding product to inventory:', error);
        alert('Failed to add product to inventory: ' + error.message);
    }
}

// Add function to mark item as out of stock
async function markAsOutOfStock(productId) {
    if (!confirm('Are you sure you want to mark this item as out of stock?')) {
        return;
    }

    try {
        const response = await handleApiRequest('/api/inventory/update', {
            method: 'PUT',
            body: JSON.stringify({
                product_id: productId,
                quantity: 0
            })
        });

        if (response.ok) {
            alert('Item marked as out of stock');
            loadInventory();
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Failed to update inventory: ' + error.message);
    }
}

// Make functions available globally
window.updateInventoryItem = updateInventoryItem;
window.markAsOutOfStock = markAsOutOfStock;
window.removeInventoryItem = removeInventoryItem;
window.openInventoryModal = openInventoryModal;
window.closeInventoryModal = closeInventoryModal;

export { loadInventory };