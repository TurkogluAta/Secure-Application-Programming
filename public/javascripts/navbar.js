// Navbar update based on authentication status
function updateNavbar() {
    const navLinks = document.querySelector('.nav-links');

    if (Auth.isLoggedIn()) {
        const user = Auth.getCurrentUser();

        // Build admin link if user is admin
        const adminLink = user.is_admin ? '<a href="/admin-users.html">Admin Panel</a>' : '';

        // Replace Login link with user info and Logout
        navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="/add-pet.html">Add Pet</a>
            ${adminLink}
            <span style="color: white; padding: 0.5rem 1rem;">Welcome, ${user.username}!</span>
            <a href="#" id="logout-link">Logout</a>
        `;

        // Add logout handler
        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
            window.location.href = '/';
        });
    } else {
        // Show default navigation for non-logged-in users
        navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="/add-pet.html">Add Pet</a>
            <a href="/login.html">Login</a>
        `;
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateNavbar);
