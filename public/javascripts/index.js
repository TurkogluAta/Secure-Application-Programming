// Handle filter form submission
document.getElementById('filter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('type-select').value;
    
    try {
        // Fetch pets by type from API
        const response = await fetch(`/api/pets${type ? '?type=' + encodeURIComponent(type) : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const pets = await response.json();
            displayPets(pets);
        } else {
            console.error('Filter failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error filtering pets:', error);
    }
});

// Handle search form submission
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = document.getElementById('search-input').value;
    
    try {
        // Fetch pets matching search term from API
        const response = await fetch(`/api/pets${searchTerm ? '?search=' + encodeURIComponent(searchTerm) : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const pets = await response.json();
            displayPets(pets);
            // Show search term if present
            if (searchTerm) {
                document.getElementById('search-result').innerHTML = `<p>Search results for: ${searchTerm}</p>`;
            }
        } else {
            console.error('Search failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error searching pets:', error);
    }
});

// Render pet cards to the grid
function displayPets(pets) {
    const petsGrid = document.getElementById('pets-grid');
    
    if (pets.length === 0) {
        petsGrid.innerHTML = '<p>No pets found.</p>';
        return;
    }

    // Create HTML for each pet card
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