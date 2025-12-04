var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
const winston = require('../config/logger');
const csrf = require('csurf');

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

// VULNERABILITY 1: SQL INJECTION
// VULNERABILITY 3: SENSITIVE DATA EXPOSURE (Plaintext password storage)
// SECURE: CSRF protection added
// Register endpoint
router.post('/register', csrfProtection, function(req, res) {
    const { username, email, password } = req.body;

    // VULNERABILITY 1: String concatenation allows SQL injection
    // VULNERABILITY 3: Password stored in plaintext (no hashing!)
    const query = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`;

    console.log('Executing query:', query);

    db.run(query, [], function(err) {
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
});

// VULNERABILITY 1: SQL INJECTION (kept for now)
// SECURE: Session management and CSRF protection added
// Login endpoint with server-side session
router.post('/login', csrfProtection, function(req, res) {
    const { username, password } = req.body;

    // VULNERABILITY 1: Still vulnerable to SQL injection (will fix later)
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    console.log('Executing query:', query);

    db.get(query, [], (err, user) => {
        if (err) {
            winston.error(`SECURITY: Database error during login - Username: ${username}, IP: ${req.ip}`);
            return res.status(500).json({ message: 'Server error' });
        }

        if (user) {
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
    });
});

// Get all pets or search by name - INSECURE VERSION
// WARNING: SQL Injection in search parameter
router.get('/pets', function(req, res) {
    const searchTerm = req.query.search;
    const type = req.query.type;

    let query = 'SELECT * FROM pets';
    let conditions = [];

    if (searchTerm) {
        // INSECURE: String concatenation allows SQL injection (e.g., ' OR 1=1--)
        conditions.push(`name LIKE '%${searchTerm}%'`);
    }

    if (type) {
        conditions.push(`type = '${type}'`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('Executing query:', query);

    db.all(query, [], (err, pets) => {
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

// VULNERABILITIES:
// 1. SQL INJECTION: User input directly in SQL query
// 2. REFLECTED XSS: User input directly in HTML response
router.get('/search-results', function(req, res) {
    const searchQuery = req.query.q;
    const type = req.query.type;

    // INSECURE: SQL Injection vulnerability
    let query = 'SELECT * FROM pets WHERE 1=1';

    if (searchQuery) {
        query += ` AND name LIKE '%${searchQuery}%'`;
    }

    if (type) {
        query += ` AND type = '${type}'`;
    }

    console.log('Executing query:', query);

    db.all(query, [], (err, pets) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('<h1>Server error</h1>');
        }

        let petsHtml = '';
        if (pets.length > 0) {
            petsHtml = '<div class="pets-grid">';
            pets.forEach(pet => {
                // VULNERABILITY 2: STORED XSS - Pet data from database rendered without encoding
                petsHtml += `
                    <div class="pet-card">
                    <img src="${pet.image_url || '/images/default-pet.jpg'}" alt="${pet.name}">
                    <h2>${pet.name}</h2>
                    <p><strong>Type:</strong> ${pet.type}</p>
                    <p><strong>Age:</strong> ${pet.age} years</p>
                    <p><strong>Description:</strong> ${pet.description}</p>
                    <a href="/pet-details.html?id=${pet.id}">View Details</a>
                </div>
                `;
            });
            petsHtml += '</div>';
        } else {
            petsHtml = '<p class="no-results">No pets found matching your search.</p>';
        }

        // VULNERABILITY 2: REFLECTED XSS - URL parameter embedded without sanitization
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

                    <!-- REFLECTED XSS: URL parameter displayed without encoding -->
                    <p class="search-info">You searched for: <strong>${searchQuery || type || 'all pets'}</strong></p>

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

// Get single pet by ID - INSECURE VERSION
// WARNING: SQL Injection in ID parameter
router.get('/pets/:id', function(req, res) {
    const petId = req.params.id;

    // INSECURE: Direct concatenation of user input
    const query = `SELECT * FROM pets WHERE id = ${petId}`;

    console.log('Executing query:', query);

    db.get(query, [], (err, pet) => {
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

// Add new pet
// VULNERABILITY 1: SQL Injection in all input fields
// VULNERABILITY 2: STORED XSS - No input sanitization allows malicious scripts to be stored in database
// SECURE: CSRF protection and authentication required
router.post('/pets', csrfProtection, requireAuth, function(req, res) {
    const { name, type, age, image_url, description } = req.body;
    // SECURE: Get userId from session instead of hardcoding
    const userId = req.session.userId;

    // VULNERABILITY 1: Direct string concatenation allows SQL injection
    // VULNERABILITY 2: No HTML sanitization - malicious scripts stored as-is in database
    const query = `INSERT INTO pets (name, type, age, image_url, description, user_id)
                   VALUES ('${name}', '${type}', ${age}, '${image_url}', '${description}', ${userId})`;

    console.log('Executing query:', query);

    db.run(query, [], function(err) {
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
