import { handleApiRequest } from '../api/api-handler.js';

async function loadProducts() {
    try {
        // First fetch all products
        console.log('Fetching all products...');
        const productsResponse = await handleApiRequest('/api/products');
        const products = await productsResponse.json();
        console.log('Products data:', products);

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsList').innerHTML = `
            <p class="text-center">Error loading products: ${error.message}</p>
        `;
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
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
                    <span class="info-label"><i class="fas fa-clock"></i> Last Updated:</span>
                    <span class="info-value">${new Date(product.updated_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="product-description">
                <p>${product.description || 'No description available'}</p>
            </div>
        `;
        
        card.appendChild(imageContainer);
        card.appendChild(content);
        productGrid.appendChild(card);
    });
    
    container.appendChild(productGrid);
}

export { loadProducts };
