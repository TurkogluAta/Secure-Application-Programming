// SECURE: Navbar update based on backend session authentication
async function updateNavbar() {
    const navLinks = document.querySelector('.nav-links');

    // SECURE: Check authentication status from backend session (not localStorage!)
    const user = await Session.checkAuth();

    if (user) {
        // User is authenticated via backend session
        const adminLink = user.is_admin ? '<a href="/admin-users.html">Admin Panel</a>' : '';

        navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="/add-pet.html">Add Pet</a>
            ${adminLink}
            <span style="color: white; padding: 0.5rem 1rem;">Welcome, ${user.username}!</span>
            <a href="#" id="logout-link">Logout</a>
        `;

        // Add logout handler
        document.getElementById('logout-link').addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                // SECURE: Fetch CSRF token before making POST request
                const csrfResponse = await fetch('/api/csrf-token');
                const { csrfToken } = await csrfResponse.json();

                // Call backend logout endpoint to destroy server-side session
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    }
                });

                // Backend destroys session, just redirect
                // No localStorage to clean!
                window.location.href = '/';
            } catch (error) {
                console.error('Error during logout:', error);
                // Redirect anyway
                window.location.href = '/';
            }
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
