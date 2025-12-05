// Extract pet ID from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const petId = urlParams.get('id');

// Load and display pet details when page loads
window.addEventListener('DOMContentLoaded', async () => {
    if (!petId) {
        document.getElementById('pet-details').innerHTML = '<p>No pet ID provided.</p>';
        return;
    }

    try {
        // Fetch specific pet details from API
        const response = await fetch(`/api/pets/${petId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const detailsDiv = document.getElementById('pet-details');

        if (response.ok) {
            const pet = await response.json();
            // VULNERABILITY 2: STORED XSS - innerHTML renders unescaped HTML from database
            // Malicious scripts in pet.name or pet.description will execute
            detailsDiv.innerHTML = `
                <div class="pet-detail-container">
                    <img src="${pet.image_url || '/images/default-pet.jpg'}" alt="${pet.name}">
                    <h2>${pet.name}</h2>
                    <p><strong>Type:</strong> ${pet.type}</p>
                    <p><strong>Age:</strong> ${pet.age} years</p>
                    <p><strong>Description:</strong> ${pet.description}</p>
                    <p><strong>Contact:</strong> <a href="mailto:${pet.contact_email}">${pet.contact_email}</a></p>
                </div>
            `;
        } else {
            const error = await response.json();
            detailsDiv.innerHTML = `<p>Error: ${error.message || 'Pet not found'}</p>`;
        }
    } catch (error) {
        console.error('Error loading pet details:', error);
        document.getElementById('pet-details').innerHTML = '<p>Error loading pet details.</p>';
    }
});