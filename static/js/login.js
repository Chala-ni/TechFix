document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const togglePasswordBtn = document.querySelector('.toggle-password');

    // Password visibility toggle
    togglePasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.className = `fas fa-${type === 'password' ? 'eye' : 'eye-slash'}`;
    });

    // Input validation
    emailInput.addEventListener('input', validateEmail);
    passwordInput.addEventListener('input', validatePassword);

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!email) {
            showError(emailInput, emailError, 'Email is required');
        } else if (!emailPattern.test(email)) {
            showError(emailInput, emailError, 'Please enter a valid email address');
        } else {
            hideError(emailInput, emailError);
            return true;
        }
        return false;
    }

    function validatePassword() {
        const password = passwordInput.value;
        
        if (!password) {
            showError(passwordInput, passwordError, 'Password is required');
        } else if (password.length < 6) {
            showError(passwordInput, passwordError, 'Password must be at least 6 characters');
        } else {
            hideError(passwordInput, passwordError);
            return true;
        }
        return false;
    }

    function showError(input, errorElement, message) {
        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('visible');
    }

    function hideError(input, errorElement) {
        input.classList.remove('error');
        errorElement.classList.remove('visible');
        errorElement.textContent = '';
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            console.log('Attempting login with email:', email);
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                console.log('Login successful, tokens:', { 
                    access: data.access_token,
                    refresh: data.refresh_token 
                });
                
                // Store the tokens
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                
                if (data.user.role === 'admin') {
                    console.log('Redirecting to admin dashboard');
                    window.location.href = 'admin-dashboard.html';
                } else if (data.user.role === 'supplier') {
                    window.location.href = 'supplier-dashboard.html';
                }
            } else {
                showError(emailInput, emailError, data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(emailInput, emailError, 'An error occurred. Please try again.');
        }
    });
});
