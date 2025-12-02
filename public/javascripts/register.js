// Handle register form submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorDiv = document.getElementById('error-message');
    errorDiv.innerHTML = '';

    // Get form values
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check if passwords match
    if (password !== confirmPassword) {
        errorDiv.innerHTML = '<p>Passwords do not match!</p>';
        return;
    }

    // Collect credentials from form
    const credentials = {
        username: username,
        email: email,
        password: password
    };

    try {
        // Send POST request to register API
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const result = await response.json();

            // Show success message and redirect to login
            alert('Registration successful! Please login with your credentials.');
            window.location.href = '/login.html';
        } else {
            const error = await response.json();
            errorDiv.innerHTML = `<p>${error.message || 'Registration failed. Please try again.'}</p>`;
        }
    } catch (error) {
        console.error('Error during registration:', error);
        errorDiv.innerHTML = '<p>An error occurred. Please try again later.</p>';
    }
});
