// SECURE: HTML escape function to prevent XSS attacks
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// SECURE: Admin page with backend session validation
window.addEventListener('DOMContentLoaded', async () => {
    // SECURE: Check authentication and admin status from backend session
    const user = await Session.checkAuth();

    // Check if user is admin via backend session
    if (!user || !user.is_admin) {
        // Show access denied message
        document.getElementById('access-denied').style.display = 'block';
        document.getElementById('users-content').style.display = 'none';
        return;
    }

    // User is admin (verified by backend), show content
    document.getElementById('access-denied').style.display = 'none';
    document.getElementById('users-content').style.display = 'block';

    // Fetch all users from API
    // VULNERABILITY: This endpoint has NO backend authentication!
    // Anyone can call: curl http://localhost:3000/api/users
    try {
        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUsers(data.users);
            document.getElementById('user-count').textContent = data.count;

            // VULNERABILITY 3: Display exposed HTTP headers
            displayResponseHeaders(response);
        } else {
            console.error('Failed to load users:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
});

function displayUsers(users) {
    const tableBody = document.getElementById('users-table-body');

    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
        return;
    }

    // SECURE: STORED XSS FIXED - All user data is HTML-escaped before rendering
    // NOTE: Still displays passwords (separate security issue - data exposure)
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.id)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td class="password-cell">${escapeHtml(user.password)}</td>
            <td>${user.is_admin ? '<span class="admin-badge">ADMIN</span>' : 'User'}</td>
            <td>${escapeHtml(new Date(user.created_at).toLocaleString())}</td>
        </tr>
    `).join('');
}

// Display HTTP response headers
function displayResponseHeaders(response) {
    const headersDiv = document.getElementById('response-headers');

    // Headers we're interested in showing
    const sensitiveHeaders = [
        'x-powered-by',
        'server',
        'x-app-version',
        'x-database',
        'x-environment',
        'x-server-root'
    ];

    let headersText = '';

    sensitiveHeaders.forEach(headerName => {
        const value = response.headers.get(headerName);
        if (value) {
            // SECURE: Escape header values to prevent XSS
            headersText += `${escapeHtml(headerName)}: ${escapeHtml(value)}\n`;
        }
    });

    if (headersText) {
        headersDiv.textContent = headersText || 'No sensitive headers found';
    } else {
        headersDiv.textContent = 'Headers not accessible from JavaScript (check browser DevTools Network tab)';
    }
}
