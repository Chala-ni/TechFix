document.getElementById('suppliersBtn').addEventListener('click', () => showSection('suppliers'));
document.getElementById('quotationsBtn').addEventListener('click', () => showSection('quotations'));
document.getElementById('ordersBtn').addEventListener('click', () => showSection('orders'));
document.getElementById('productsBtn').addEventListener('click', () => showSection('products'));
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

function showSection(section) {
    // Hide all sections
    document.getElementById('suppliersSection').style.display = 'none';
    document.getElementById('quotationsSection').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    document.getElementById('productsSection').style.display = 'none';
    
    // Show the requested section
    document.getElementById(section + 'Section').style.display = 'block';
    
    // Highlight active nav button
    const navButtons = document.querySelectorAll('.nav-links button');
    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.id === `${section}Btn`) {
            button.classList.add('active');
        }
    });
    
    if (section === 'products') {
        loadProducts();
    }
    
    loadSectionData(section);
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
