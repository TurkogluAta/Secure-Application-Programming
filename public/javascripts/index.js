/**
 * EDUCATIONAL: Rendering Mode Toggle
 *
 * This allows switching between two different rendering approaches:
 * - Client-Side: Modern JSON API + JavaScript rendering (default)
 * - Server-Side: Traditional HTML rendering from server
 */
let isServerSideMode = false;

// Handle rendering mode toggle
document.getElementById('rendering-mode-switch').addEventListener('change', (e) => {
    isServerSideMode = e.target.checked;

    const modeDescription = document.getElementById('mode-description');
    const currentMode = document.getElementById('current-mode');
    const vulnerabilityList = document.getElementById('vulnerability-list');

    if (isServerSideMode) {
        modeDescription.textContent = 'Server-Side (Traditional HTML Rendering)';
        currentMode.textContent = 'Server-Side';
        currentMode.className = 'mode-badge server-mode';
        vulnerabilityList.innerHTML = '<li><strong>Server-Side:</strong> Server renders HTML (Reflected XSS + Stored XSS)</li>';
    } else {
        modeDescription.textContent = 'Client-Side (Modern JSON API + JS)';
        currentMode.textContent = 'Client-Side';
        currentMode.className = 'mode-badge client-mode';
        vulnerabilityList.innerHTML = '<li><strong>Client-Side:</strong> JSON API + JavaScript rendering (DOM-based XSS)</li>';
    }
});

// Handle combined search and filter form submission
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = document.getElementById('search-input').value;
    const type = document.getElementById('type-select').value;

    // CHECK RENDERING MODE
    if (isServerSideMode) {
        // SERVER-SIDE MODE: Redirect to server-rendered page
        // This will demonstrate Reflected XSS in server-side rendering
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (type) params.append('type', type);
        window.location.href = `/api/search-results?${params.toString()}`;
        return; // Stop execution, browser will navigate away
    }

    // CLIENT-SIDE MODE (default): Use JavaScript to fetch and render

    // VULNERABILITY 2: DOM-BASED XSS
    // User input directly inserted into DOM without sanitization
    if (searchTerm) {
        document.getElementById('search-result').innerHTML = `<p>Searching for: ${searchTerm}</p>`;
    }

    try {
        // Build query string with both search and type parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (type) params.append('type', type);

        // Fetch pets matching search term and type from API
        const response = await fetch(`/api/pets?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const pets = await response.json();
            displayPets(pets);
            // Update search result message
            if (searchTerm || type) {
                let message = 'Results';
                if (searchTerm && type) {
                    message = `Search results for: ${searchTerm} (${type})`;
                } else if (searchTerm) {
                    message = `Search results for: ${searchTerm}`;
                } else if (type) {
                    message = `Filtered by: ${type}`;
                }
                document.getElementById('search-result').innerHTML = `<p>${message}</p>`;
            }
        } else {
            console.error('Search/Filter failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error searching/filtering pets:', error);
    }
});

// Render pet cards to the grid
function displayPets(pets) {
    const petsGrid = document.getElementById('pets-grid');

    if (pets.length === 0) {
        petsGrid.innerHTML = '<p>No pets found.</p>';
        return;
    }

    // VULNERABILITY 2: STORED XSS - Pet data rendered without HTML encoding
    // Malicious scripts in pet.name can execute when displayed
    petsGrid.innerHTML = pets.map(pet => `
        <div class="pet-card">
            <img src="${pet.image_url || '/images/default-pet.jpg'}" alt="${pet.name}">
            <h3>${pet.name}</h3>
            <p>Type: ${pet.type}</p>
            <p>Age: ${pet.age} years</p>
            <a href="/pet-details.html?id=${pet.id}">View Details</a>
        </div>
    `).join('');
}

// Load all pets when page loads
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/pets', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const pets = await response.json();
            displayPets(pets);
        } else {
            console.error('Failed to load pets:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
});