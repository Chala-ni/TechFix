// Sidebar toggle functionality
document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
});

document.getElementById('overlay').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('active');
    this.classList.remove('active');
});

// Close sidebar when a navigation item is clicked on mobile
const navButtons = document.querySelectorAll('.nav-links button');
navButtons.forEach(button => {
    button.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        }
    });
});
