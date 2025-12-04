// SECURE: Check authentication via backend session when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const user = await Session.checkAuth();
    if (!user) {
        // Not authenticated - redirect to login
        alert('Please login to add a pet!');
        window.location.href = '/login.html';
        return;
    }
});

// Handle add pet form submission
document.getElementById('add-pet-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect form data
    const petData = {
        name: document.getElementById('pet-name').value,
        type: document.getElementById('pet-type').value,
        age: parseInt(document.getElementById('pet-age').value),
        image_url: document.getElementById('pet-image').value,
        description: document.getElementById('pet-description').value
    };

    try {
        // SECURE: Fetch CSRF token before making POST request
        const csrfResponse = await fetch('/api/csrf-token');
        const { csrfToken } = await csrfResponse.json();

        // Send POST request to API with CSRF token
        const response = await fetch('/api/pets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify(petData)
        });

        const messageDiv = document.getElementById('message');
        
        if (response.ok) {
            const result = await response.json();
            messageDiv.innerHTML = '<p style="color: green;">Pet added successfully!</p>';
            document.getElementById('add-pet-form').reset();
            
            // Redirect to home page after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            const error = await response.json();
            messageDiv.innerHTML = `<p style="color: red;">Error: ${error.message || 'Failed to add pet'}</p>`;
        }
    } catch (error) {
        console.error('Error adding pet:', error);
        document.getElementById('message').innerHTML = '<p style="color: red;">Error: Failed to add pet</p>';
    }
});