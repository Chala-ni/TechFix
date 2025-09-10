import { loadProducts } from '../modules/products.js';
import { loadQuotations } from '../modules/quotations.js';
import { loadOrders } from '../modules/orders.js';
import { loadProfileData, loadPasswordSection } from '../modules/profile.js';
import { loadInventory } from '../modules/inventory.js';
import { handleLogout } from '../auth/auth.js';

// Navigation event listeners
document.getElementById('productsBtn').addEventListener('click', () => showSection('products'));
document.getElementById('inventoryBtn').addEventListener('click', () => showSection('inventory'));
document.getElementById('quotationsBtn').addEventListener('click', () => showSection('quotations'));
document.getElementById('ordersBtn').addEventListener('click', () => showSection('orders'));
document.getElementById('profileBtn').addEventListener('click', () => showSection('profile'));
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

function showSection(section, subsection = null) {
    // Hide all sections
    document.getElementById('productsSection').style.display = 'none';
    document.getElementById('inventorySection').style.display = 'none';
    document.getElementById('quotationsSection').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    // Show selected section
    document.getElementById(`${section}Section`).style.display = 'block';

    // Highlight active nav button
    const navButtons = document.querySelectorAll('.nav-links button');
    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.id === `${section}Btn`) {
            button.classList.add('active');
        }
    });

    // Load section data
    loadSectionData(section, subsection);
}

async function loadSectionData(section, subsection = null) {
    try {
        // Show loading indicator
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.innerHTML = '<p>Loading data...</p>';
            
            // Only add if not already exists
            if (!sectionElement.querySelector('.loading-indicator')) {
                sectionElement.appendChild(loadingDiv);
            }
        }
        
        switch(section) {
            case 'products':
                await loadProducts();
                break;
            case 'inventory':
                await loadInventory();
                break;
            case 'quotations':
                await loadQuotations();
                break;
            case 'orders':
                await loadOrders();
                break;
            case 'profile':
                // Default to info subsection if none specified
                if (subsection === 'password') {
                    await loadPasswordSection();
                } else {
                    await loadProfileData();
                }
                break;
        }
        
        // Remove loading indicator
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            loadingElement.remove();
        }
    } catch (error) {
        console.error('Error loading section data:', error);
        
        // Remove loading indicator
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Show error message in the section
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = `Failed to load data: ${error.message}. Please try again.`;
            sectionElement.prepend(errorDiv);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        } else {
            alert('Failed to load data. Please try again.');
        }
    }
}

export { showSection };
