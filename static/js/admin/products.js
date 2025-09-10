// Load products from server
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        const products = await response.json();
        displayProducts(products, document.getElementById('productsList'));
    } catch (err) {
        console.error(err);
        alert('Error loading products');
    }
}

// Update the displayProducts function
function displayProducts(products, container) {
    container.innerHTML = '';
    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = '<p class="text-center">No products found</p>';
        return;
    }
    
    const productGrid = document.createElement('div');
    productGrid.className = 'product-grid';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Image section (removed category badge)
        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image';
        if (product.image) {
            imageContainer.innerHTML = `
                <img src="/${product.image}" alt="${product.name}" />
            `;
        } else {
            imageContainer.innerHTML = `
                <div class="no-image">
                    <i class="fas fa-image"></i>
                    <span>No Image</span>
                </div>
            `;
        }
        
        // Product content
        const content = document.createElement('div');
        content.className = 'product-card-body';
        content.innerHTML = `
            <h3 class="product-title">${product.name}</h3>
            <div class="product-info-grid">
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-hashtag"></i> SKU:</span>
                    <span class="info-value">${product.part_number || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-building"></i> Brand:</span>
                    <span class="info-value">${product.manufacturer || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-layer-group"></i> Category:</span>
                    <span class="info-value">${product.category || 'Uncategorized'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-clock"></i> Updated:</span>
                    <span class="info-value">${new Date(product.updated_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="product-description">
                <p>${product.description || 'No description available'}</p>
            </div>
        `;
        
        // Actions footer
        const footer = document.createElement('div');
        footer.className = 'product-card-footer';
        footer.innerHTML = `
            <button class="btn-primary edit-product" data-id="${product.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-secondary delete-product" data-id="${product.id}">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        `;
        
        card.appendChild(imageContainer);
        card.appendChild(content);
        card.appendChild(footer);
        productGrid.appendChild(card);
    });
    
    container.appendChild(productGrid);
    
    // Add this line at the end of displayProducts
    attachProductEventListeners();
}

// Update handleImagePreview function
function handleImagePreview(input) {
    const previewContainer = document.getElementById('image-preview');
    const file = input.files[0];
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size too large. Please select an image under 5MB.');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Preview" />
                <button type="button" class="remove-image" onclick="removePreviewImage()">
                    <i class="fas fa-times"></i>
                </button>`;
        };
        reader.readAsDataURL(file);
    } else {
        showUploadPrompt();
    }
}

// Add function to show upload prompt
function showUploadPrompt() {
    const previewContainer = document.getElementById('image-preview');
    previewContainer.innerHTML = `
        <div class="upload-prompt">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Click or drag image to upload</span>
            <small>Supports: JPG, PNG (Max 5MB)</small>
        </div>`;
}

// Update removePreviewImage function
function removePreviewImage() {
    document.getElementById('product-image').value = '';
    showUploadPrompt();
}

// Add drag and drop support
document.addEventListener('DOMContentLoaded', () => {
    const imagePreview = document.getElementById('image-preview');
    const fileInput = document.getElementById('product-image');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imagePreview.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        imagePreview.addEventListener(eventName, () => {
            imagePreview.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        imagePreview.addEventListener(eventName, () => {
            imagePreview.classList.remove('drag-over');
        });
    });

    imagePreview.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        fileInput.files = dt.files;
        handleImagePreview(fileInput);
    });
});

// Handle product form submission (add or update)
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const productId = form.getAttribute('data-edit-id');
    const formData = new FormData(form);

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        let response;
        if (productId) {
            // Update existing product
            response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        } else {
            // Create new product
            response = await fetch(`/api/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        }

        if (response.ok) {
            loadProducts();
            form.reset();
            form.style.display = 'none';
            alert(`Product ${productId ? 'updated' : 'created'} successfully`);
        } else {
            const error = await response.json();
            throw new Error(error.error || `Failed to ${productId ? 'update' : 'create'} product`);
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// Update the click handler for add product button
document.getElementById('btn-add-product').addEventListener('click', () => {
    const form = document.getElementById('product-form');
    form.reset(); // Clear form
    form.removeAttribute('data-edit-id'); // Remove any edit ID
    document.querySelector('#product-form h3').textContent = 'Add New Product';
    
    // Show the upload prompt
    showUploadPrompt();
    
    form.style.display = 'block';
});

document.getElementById('cancel-product-form').addEventListener('click', () => {
    document.getElementById('product-form').style.display = 'none';
});

// Search products functionality
document.getElementById('productSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = 
            text.includes(searchTerm) ? 'block' : 'none';
    });
});

// Edit product functionality
async function editProduct(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        
        const response = await fetch(`/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            let errorText = 'Failed to fetch product details';
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorData.message || errorText;
            } catch (jsonError) {
                // If not JSON, keep generic error
            }
            throw new Error(errorText);
        }
        
        const product = await response.json();
        
        // Store original product data for comparison
        const originalProduct = JSON.parse(JSON.stringify(product));
        
        // Populate the form
        const form = document.getElementById('product-form');
        form.setAttribute('data-edit-id', productId);
        document.querySelector('#product-form h3').textContent = 'Edit Product';
        
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-part-number').value = product.part_number || '';
        document.getElementById('product-manufacturer').value = product.manufacturer || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-description').value = product.description || '';
        
        // Update image preview
        const previewContainer = document.getElementById('image-preview');
        if (product.image) {
            previewContainer.innerHTML = `
                <img src="/${product.image}" alt="${product.name}" />
                <button type="button" class="remove-image" onclick="removePreviewImage()">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            previewContainer.innerHTML = '<div class="no-image">No Image</div>';
        }
        
        // Show the form
        form.style.display = 'block';
        
        // Modify form submission to handle updates
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            // Only include part_number if it changed
            if (formData.get('part_number') === originalProduct.part_number) {
                formData.delete('part_number');
            }
            
            try {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (response.ok) {
                    form.style.display = 'none';
                    loadProducts();
                    form.onsubmit = null; // Remove the submit handler
                    return;
                }

                // Try to parse response as JSON
                let errorData;
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    // If not JSON, use text
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to update product');
                }
                
                throw new Error(errorData.error || errorData.message || 'Failed to update product');
            } catch (err) {
                console.error('Product update error:', err);
                alert(err.message);
            }
        };
        
    } catch (err) {
        console.error('Error fetching product:', err);
        alert('Error fetching product details: ' + err.message);
    }
}

// Delete the specified product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadProducts();
            alert('Product deleted successfully');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete product');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting product: ' + err.message);
    }
}

// Add these event listeners after the displayProducts function
function attachProductEventListeners() {
    // Attach edit button listeners
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.id;
            editProduct(productId);
        });
    });

    // Attach delete button listeners
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.id;
            deleteProduct(productId);
        });
    });
}
