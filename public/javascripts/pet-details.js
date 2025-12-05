// SECURE: HTML escape function to prevent XSS attacks
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
            // SECURE: STORED XSS FIXED - All pet data is HTML-escaped before rendering
            detailsDiv.innerHTML = `
                <div class="pet-detail-container">
                    <img src="${escapeHtml(pet.image_url) || '/images/default-pet.jpg'}" alt="${escapeHtml(pet.name)}">
                    <h2>${escapeHtml(pet.name)}</h2>
                    <p><strong>Type:</strong> ${escapeHtml(pet.type)}</p>
                    <p><strong>Age:</strong> ${escapeHtml(pet.age)} years</p>
                    <p><strong>Description:</strong> ${escapeHtml(pet.description)}</p>
                    <p><strong>Contact:</strong> <a href="mailto:${escapeHtml(pet.contact_email)}">${escapeHtml(pet.contact_email)}</a></p>
                </div>
            `;
        } else {
            const error = await response.json();
            detailsDiv.innerHTML = `<p>Error: ${escapeHtml(error.message || 'Pet not found')}</p>`;
        }
    } catch (error) {
        console.error('Error loading pet details:', error);
        document.getElementById('pet-details').innerHTML = '<p>Error loading pet details.</p>';
    }
});