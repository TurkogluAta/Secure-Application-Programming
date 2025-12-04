// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect credentials from form
    const credentials = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    const errorDiv = document.getElementById('error-message');
    errorDiv.innerHTML = '';

    try {
        // SECURE: Fetch CSRF token before making POST request
        const csrfResponse = await fetch('/api/csrf-token');
        const { csrfToken } = await csrfResponse.json();

        // Send POST request to login API with CSRF token
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const result = await response.json();

            // SECURE: Backend sets httpOnly session cookie automatically
            // No need to store anything in localStorage!

            // Redirect to home page on success
            window.location.href = '/';
        } else {
            const error = await response.json();
            errorDiv.innerHTML = `<p>${error.message || 'Login failed. Please check your credentials.'}</p>`;
        }
    } catch (error) {
        console.error('Error during login:', error);
        errorDiv.innerHTML = '<p>An error occurred. Please try again later.</p>';
    }
});