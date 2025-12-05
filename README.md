# Pet Adoption Board - Secure Version

Hardened web application with security best practices.

## Tech Stack

- Node.js + Express
- SQLite3
- Vanilla JavaScript
- Playwright (testing)

## Setup

```bash
npm install
node db-reset.js
npm start
```

Visit: `http://localhost:3000`

## Default Credentials

Username: `admin`
Password: `admin123`

## Security Features

### SQL Injection Protection
- Parameterized queries throughout
- No string concatenation in queries
- Prepared statements for all database operations

### XSS Prevention
- Client-side HTML escaping for all user input
- Server-side output encoding in HTML responses
- CSP headers via Helmet.js
- Stored XSS prevention in pet data display

### Sensitive Data Protection
- Password hashing with bcrypt
- Session-based authentication
- Secure cookie configuration
- Server info headers removed

### Authentication & Authorization
- Server-side session validation
- Protected endpoints with middleware
- Admin access control
- CSRF protection on state-changing operations

### Security Headers
- Helmet.js configuration
- Content Security Policy
- X-Frame-Options
- Strict-Transport-Security

### Logging
- Winston logger integration
- Security event logging
- Failed login attempt tracking

## Test

```bash
npm test
```

Tests verify security measures prevent exploitation.

## Purpose

Educational example of secure coding practices.
