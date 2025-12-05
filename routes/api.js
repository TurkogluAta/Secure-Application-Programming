var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
const winston = require('../config/logger');
const csrf = require('csurf');
const bcrypt = require('bcrypt');

// SECURE: Salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

// Connect to SQLite database
var db = new sqlite3.Database(path.join(__dirname, '../database.db'));

// CSRF Protection middleware
const csrfProtection = csrf({ cookie: true });

// SECURE: Authentication middleware - Check if user is logged in
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        winston.warn(`SECURITY: Unauthorized access attempt to protected endpoint ${req.path} - IP: ${req.ip}`);
        return res.status(401).json({
            message: 'Authentication required. Please login.'
        });
    }
    next();
}

// SECURE: Admin middleware - Check if user is admin
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        winston.warn(`SECURITY: Unauthorized access attempt to admin endpoint ${req.path} - IP: ${req.ip}`);
        return res.status(401).json({
            message: 'Authentication required. Please login.'
        });
    }
    if (!req.session.isAdmin) {
        winston.warn(`SECURITY: Non-admin user attempted to access admin endpoint ${req.path} - User ID: ${req.session.userId}, IP: ${req.ip}`);
        return res.status(403).json({
            message: 'Admin privileges required.'
        });
    }
    next();
}

// SECURE: Endpoint to get CSRF token
router.get('/csrf-token', csrfProtection, function(req, res) {
    res.json({ csrfToken: req.csrfToken() });
});

// SECURE: SQL Injection FIXED with parameterized queries
// SECURE: Sensitive Data Exposure FIXED with bcrypt password hashing
// SECURE: CSRF protection added
// Register endpoint
router.post('/register', csrfProtection, async function(req, res) {
    const { username, email, password } = req.body;

    try {
        // SECURE: Hash password with bcrypt before storing
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // SECURE: Parameterized query prevents SQL injection
        const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;

        console.log('Executing query with parameterized inputs');

        db.run(query, [username, email, hashedPassword], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                // SECURE: Log failed registration attempt
                winston.warn(`SECURITY: Failed registration attempt - Username: ${username}, Email: ${email}, Error: ${err.message}, IP: ${req.ip}`);

                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('username')) {
                        return res.status(400).json({ message: 'Username already exists' });
                    } else if (err.message.includes('email')) {
                        return res.status(400).json({ message: 'Email already exists' });
                    }
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                return res.status(500).json({ message: 'Server error', error: err.message });
            }

            // SECURE: Log successful registration
            winston.info(`SECURITY: Successful registration - User ID: ${this.lastID}, Username: ${username}, Email: ${email}, IP: ${req.ip}`);

            res.json({
                success: true,
                message: 'Registration successful',
                user: { id: this.lastID, username: username, email: email }
            });
        });
    } catch (error) {
        console.error('Hashing error:', error);
        winston.error(`SECURITY: Password hashing failed during registration - Username: ${username}, IP: ${req.ip}`);
        return res.status(500).json({ message: 'Server error during registration' });
    }
});

// SECURE: SQL Injection FIXED with parameterized queries
// SECURE: Password verification with bcrypt
// SECURE: Session management and CSRF protection added
// Login endpoint with server-side session
router.post('/login', csrfProtection, async function(req, res) {
    const { username, password } = req.body;

    // SECURE: Parameterized query prevents SQL injection
    const query = `SELECT * FROM users WHERE username = ?`;

    console.log('Executing query with parameterized inputs');

    db.get(query, [username], async (err, user) => {
        if (err) {
            winston.error(`SECURITY: Database error during login - Username: ${username}, IP: ${req.ip}`);
            return res.status(500).json({ message: 'Server error' });
        }

        if (user) {
            try {
                // SECURE: Compare password with bcrypt
                const passwordMatch = await bcrypt.compare(password, user.password);

                if (passwordMatch) {
                    // SECURE: Store user info in server-side session
                    req.session.userId = user.id;
                    req.session.username = user.username;
                    req.session.isAdmin = user.is_admin;

                    // SECURE: Log successful login
                    winston.info(`SECURITY: Successful login - User ID: ${user.id}, Username: ${user.username}, IsAdmin: ${user.is_admin}, IP: ${req.ip}`);

                    res.json({
                        success: true,
                        message: 'Login successful',
                        user: { id: user.id, username: user.username, is_admin: user.is_admin }
                    });
                } else {
                    // SECURE: Log failed login attempt (potential brute force attack)
                    winston.warn(`SECURITY: Failed login attempt - Username: ${username}, IP: ${req.ip}`);
                    res.status(401).json({ message: 'Invalid credentials' });
                }
            } catch (error) {
                console.error('Password comparison error:', error);
                winston.error(`SECURITY: Password comparison failed during login - Username: ${username}, IP: ${req.ip}`);
                return res.status(500).json({ message: 'Server error during login' });
            }
        } else {
            // SECURE: Log failed login attempt (potential brute force attack)
            winston.warn(`SECURITY: Failed login attempt - Username: ${username}, IP: ${req.ip}`);
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// SECURE: SQL Injection FIXED with parameterized queries
// Get all pets or search by name
router.get('/pets', function(req, res) {
    const searchTerm = req.query.search;
    const type = req.query.type;

    let query = 'SELECT * FROM pets';
    let conditions = [];
    let params = [];

    if (searchTerm) {
        // SECURE: Parameterized query prevents SQL injection
        conditions.push(`name LIKE ?`);
        params.push(`%${searchTerm}%`);
    }

    if (type) {
        // SECURE: Parameterized query prevents SQL injection
        conditions.push(`type = ?`);
        params.push(type);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('Executing query with parameterized inputs');

    db.all(query, params, (err, pets) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json(pets);
    });
});

// EDUCATIONAL: SERVER-SIDE RENDERING
// Demonstrates traditional server-side HTML rendering vs modern JSON + client-side rendering

// KEY DIFFERENCES:
// - /api/pets: Returns JSON → Client renders → DOM-based XSS risk
// - /api/search-results: Returns HTML → Server renders → Reflected XSS risk

// SECURE: SQL Injection and Reflected XSS FIXED
router.get('/search-results', function(req, res) {
    const searchQuery = req.query.q;
    const type = req.query.type;

    // SECURE: Parameterized query prevents SQL injection
    let query = 'SELECT * FROM pets WHERE 1=1';
    let params = [];

    if (searchQuery) {
        query += ` AND name LIKE ?`;
        params.push(`%${searchQuery}%`);
    }

    if (type) {
        query += ` AND type = ?`;
        params.push(type);
    }

    console.log('Executing query with parameterized inputs');

    db.all(query, params, (err, pets) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('<h1>Server error</h1>');
        }

        // SECURE: HTML escape function to prevent XSS
        function escapeHtml(text) {
            if (!text) return '';
            return text
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        let petsHtml = '';
        if (pets.length > 0) {
            petsHtml = '<div class="pets-grid">';
            pets.forEach(pet => {
                // SECURE: All output is HTML-escaped to prevent stored XSS
                petsHtml += `
                    <div class="pet-card">
                    <img src="${escapeHtml(pet.image_url) || '/images/default-pet.jpg'}" alt="${escapeHtml(pet.name)}">
                    <h2>${escapeHtml(pet.name)}</h2>
                    <p><strong>Type:</strong> ${escapeHtml(pet.type)}</p>
                    <p><strong>Age:</strong> ${escapeHtml(pet.age)} years</p>
                    <p><strong>Description:</strong> ${escapeHtml(pet.description)}</p>
                    <a href="/pet-details.html?id=${escapeHtml(pet.id)}">View Details</a>
                </div>
                `;
            });
            petsHtml += '</div>';
        } else {
            petsHtml = '<p class="no-results">No pets found matching your search.</p>';
        }

        // SECURE: URL parameters are HTML-escaped to prevent reflected XSS
        const searchDisplay = escapeHtml(searchQuery || type || 'all pets');
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Search Results - Pet Adoption</title>
                <link rel="stylesheet" href="/stylesheets/style.css">
            </head>
            <body>
                <nav class="navbar">
                    <div class="container">
                        <a class="brand" href="/">Pet Adoption Board</a>
                        <div class="nav-links">
                            <a href="/">Home</a>
                            <a href="/add-pet.html">Add Pet</a>
                        </div>
                    </div>
                </nav>
                <div class="container">
                    <h1>Search Results</h1>

                    <!-- SECURE: URL parameter HTML-escaped to prevent reflected XSS -->
                    <p class="search-info">You searched for: <strong>${searchDisplay}</strong></p>

                    <p class="results-count">Found ${pets.length} pet(s)</p>

                    ${petsHtml}

                    <div style="margin-top: 20px;">
                        <a href="/" class="btn">Back to Home</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        res.send(html);
    });
});

// SECURE: SQL Injection FIXED with parameterized queries
// Get single pet by ID with user contact information
router.get('/pets/:id', function(req, res) {
    const petId = req.params.id;

    // SECURE: Parameterized query prevents SQL injection
    // JOIN with users table to get contact email
    const query = `SELECT pets.*, users.email as contact_email
                   FROM pets
                   JOIN users ON pets.user_id = users.id
                   WHERE pets.id = ?`;

    console.log('Executing query with parameterized inputs');

    db.get(query, [petId], (err, pet) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }

        if (pet) {
            res.json(pet);
        } else {
            res.status(404).json({ message: 'Pet not found' });
        }
    });
});

// SECURE: SQL Injection FIXED with parameterized queries
// NOTE: Input sanitization for XSS is handled client-side during display
// SECURE: CSRF protection and authentication required
router.post('/pets', csrfProtection, requireAuth, function(req, res) {
    const { name, type, age, image_url, description } = req.body;
    // SECURE: Get userId from session instead of hardcoding
    const userId = req.session.userId;

    // SECURE: Parameterized query prevents SQL injection
    const query = `INSERT INTO pets (name, type, age, image_url, description, user_id)
                   VALUES (?, ?, ?, ?, ?, ?)`;

    console.log('Executing query with parameterized inputs');

    db.run(query, [name, type, age, image_url, description, userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to add pet' });
        }

        res.json({
            success: true,
            message: 'Pet added successfully',
            petId: this.lastID
        });
    });
});

// VULNERABILITY 3: SENSITIVE DATA EXPOSURE
// Get all users with passwords - EXTREMELY INSECURE!
// This endpoint exposes ALL user data including plaintext passwords
// SECURE: Now requires admin authentication
router.get('/users', requireAdmin, function(req, res) {
    const query = 'SELECT * FROM users';

    console.log('Executing query:', query);

    db.all(query, [], (err, users) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        // INSECURE: Returns all user data including passwords in plaintext
        res.json({
            success: true,
            count: users.length,
            users: users  // Contains: id, username, email, PASSWORD, created_at
        });
    });
});

// SECURE: Logout endpoint with CSRF protection - destroys server-side session
router.post('/logout', csrfProtection, function(req, res) {
    if (req.session) {
        const userId = req.session.userId;
        const username = req.session.username;

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                winston.error(`SECURITY: Logout failed - User ID: ${userId}, Username: ${username}, IP: ${req.ip}`);
                return res.status(500).json({ message: 'Logout failed' });
            }

            // SECURE: Log successful logout
            winston.info(`SECURITY: Successful logout - User ID: ${userId}, Username: ${username}, IP: ${req.ip}`);

            res.clearCookie('connect.sid'); // Clear session cookie
            res.json({ success: true, message: 'Logged out successfully' });
        });
    } else {
        winston.warn(`SECURITY: Logout attempt with no active session - IP: ${req.ip}`);
        res.json({ success: true, message: 'No active session' });
    }
});

// SECURE: Check session status
router.get('/session', function(req, res) {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                is_admin: req.session.isAdmin
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
