import { checkAuth } from './supplier/auth/auth.js';
import { showSection } from './supplier/ui/navigation.js';
import { openQuotationModal, closeQuotationModal, addQuotationItem } from './supplier/modules/quotations.js';
import { loadProfileData, loadPasswordSection } from './supplier/modules/profile.js';

// Initialize modal functions globally for HTML onclick access
window.openQuotationModal = openQuotationModal;
window.closeQuotationModal = closeQuotationModal;
window.addQuotationItem = addQuotationItem;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    showSection('products'); // Show products section by default

    // Make the profile tab switcher accessible globally
    window.showProfileTab = window.showProfileTab || function(tab) {
        // Hide all profile subsections
        document.querySelectorAll('.profile-subsection').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show the selected subsection
        document.getElementById(`profile${tab.charAt(0).toUpperCase() + tab.slice(1)}Section`).style.display = 'block';
        
        // Update active status on tab buttons
        document.querySelectorAll('.profile-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');
        
        // Load the appropriate data
        if (tab === 'info') {
            loadProfileData();
        } else if (tab === 'password') {
            loadPasswordSection();
        }
    };
});
