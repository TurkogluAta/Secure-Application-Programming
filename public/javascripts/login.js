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
        // Send POST request to login API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const result = await response.json();

            // Store authentication token if provided
            if (result.token) {
                localStorage.setItem('authToken', result.token);
            }

            // Save user data to localStorage using Auth utility
            if (result.user) {
                Auth.login(result.user);
            }

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