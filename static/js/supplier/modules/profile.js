import { handleApiRequest } from '../api/api-handler.js';

async function loadProfileData() {
    try {
        setupProfileSection();
        
        document.getElementById('profileInfoSection').style.display = 'block';
        document.getElementById('profilePasswordSection').style.display = 'none';
        document.getElementById('infoTab').classList.add('active');
        document.getElementById('passwordTab').classList.remove('active');
        
        // Using correct API endpoint with users prefix
        const response = await handleApiRequest('/api/users/profile');
        console.log('Profile API request sent to:', '/api/users/profile');
        const profileData = await response.json();
        console.log('API Response:', response.status);
        console.log('Profile Data:', profileData);
        
        // Improved field mapping with more robust fallbacks
        document.getElementById('fullName').value = profileData.name || profileData.full_name || '';
        document.getElementById('email').value = profileData.email || '';
        document.getElementById('phone').value = profileData.phone || profileData.contact_number || profileData.phone_number || '';
        document.getElementById('address').value = profileData.address || profileData.company_address || '';
        
        
        
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('#profileForm .error-message, #profileForm .success-message');
        existingMessages.forEach(msg => msg.remove());
        
        document.getElementById('profileForm').prepend(successDiv);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        // Don't overwrite the entire section, just show error message
        
        // Remove any existing messages first
        const existingMessages = document.querySelectorAll('#profileForm .error-message, #profileForm .success-message');
        existingMessages.forEach(msg => msg.remove());
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error loading profile: ${error.message}`;
        document.getElementById('profileForm').prepend(errorDiv);
    }
}

function setupProfileSection() {
    // Check if we've already set up the section
    if (document.getElementById('profileTabs')) {
        return;
    }
    
    const profileSection = document.getElementById('profileSection');
    
    // Create the profile section structure with tabs - removed the nested content-section divs
    profileSection.innerHTML = `
        <h2><i class="fas fa-user"></i> Profile Settings</h2>
        
        <div id="profileTabs" class="profile-tabs">
            <button id="infoTab" class="profile-tab active" onclick="showProfileTab('info')">
                <i class="fas fa-user"></i> Personal Information
            </button>
            <button id="passwordTab" class="profile-tab" onclick="showProfileTab('password')">
                <i class="fas fa-key"></i> Change Password
            </button>
        </div>
        
        <div id="profileInfoSection" class="profile-subsection">
            <form id="profileForm" class="form-container">
                <div class="form-row">
                    <div class="form-group">
                        <label for="fullName">Full Name</label>
                        <input type="text" id="fullName" name="fullName" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                </div>
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
        
        <div id="profilePasswordSection" class="profile-subsection" style="display: none;">
            <form id="passwordForm" class="form-container">
                <div class="form-group">
                    <label for="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" required>
                </div>
                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" required>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-key"></i> Update Password
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Set up event listeners for the forms
    setupProfileFormListeners();
}

function setupProfileFormListeners() {
    // Profile info form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const profileData = {
                name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            };
            
            console.log('Submitting profile data:', profileData);
            
            try {
                // Using correct API endpoint with users prefix
                const response = await handleApiRequest('/api/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(profileData)
                });
                
                if (response.ok) {
                    // Replace existing inline message with an alert
                    alert('Profile updated successfully!');
                    
                    // Reload profile data to ensure consistency
                    await loadProfileData();
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                
                // Remove any existing messages
                const existingMessages = document.querySelectorAll('#profileForm .error-message, #profileForm .success-message');
                existingMessages.forEach(msg => msg.remove());
                
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = `Error updating profile: ${error.message}`;
                document.getElementById('profileForm').prepend(errorDiv);
            }
        });
    }
    
    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                alert('New passwords do not match!');
                return;
            }
            
            try {
                // Using correct API endpoint with users prefix
                const response = await handleApiRequest('/api/users/password', {
                    method: 'PUT',
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword
                    })
                });
                
                if (response.ok) {
                    alert('Password updated successfully!');
                    passwordForm.reset();
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update password');
                }
            } catch (error) {
                console.error('Error updating password:', error);
                alert(`Error updating password: ${error.message}`);
            }
        });
    }
}

async function loadPasswordSection() {
    // First, make sure the profile section is properly set up with tabs
    setupProfileSection();
    
    // Show the password subsection
    document.getElementById('profileInfoSection').style.display = 'none';
    document.getElementById('profilePasswordSection').style.display = 'block';
    document.getElementById('infoTab').classList.remove('active');
    document.getElementById('passwordTab').classList.add('active');
    
    // Reset the password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.reset();
    }
}

// Make the showProfileTab function available globally
window.showProfileTab = function(tab) {
    // Hide all profile subsections
    document.querySelectorAll('.profile-subsection').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show the selected subsection
    document.getElementById(`profile${tab.charAt(0).toUpperCase() + tab.slice(1)}Section`).style.display = 'block';
    
    // Update active status on tab buttons
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // Load the appropriate data
    if (tab === 'info') {
        loadProfileData();
    } else if (tab === 'password') {
        loadPasswordSection();
    }
};

export { loadProfileData, loadPasswordSection };
