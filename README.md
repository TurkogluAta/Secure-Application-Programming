# Pet Adoption Board - Insecure Version

Deliberately vulnerable web application for security education.

## Tech Stack

- Node.js + Express
- SQLite3
- Vanilla JavaScript
- Playwright (testing)

## Setup

```bash
npm install
sqlite3 database.db < schema.sql
npm start
```

Visit: `http://localhost:3000`

## Default Credentials

Username: `admin`
Password: `admin123`

## Vulnerabilities

### SQL Injection
- Login/register endpoints use string concatenation
- Pet search and add pet forms vulnerable
- No parameterized queries

### XSS (Cross-Site Scripting)
- DOM-based XSS in client-side search
- Reflected XSS in server-side search
- Stored XSS in pet data (name, description)

### Sensitive Data Exposure
- Passwords stored in plaintext
- `/api/users` endpoint exposes all user data
- Server info leaked in HTTP headers
- No server-side authentication on admin endpoints

## Test

```bash
npm test
```

Tests verify all vulnerabilities are exploitable.

## Warning

Educational purposes only. Do not deploy.
