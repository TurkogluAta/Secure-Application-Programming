# Pet Adoption Board - Base Skeleton

Basic project skeleton. Frontend structure only, no backend API.

## Tech Stack

- Node.js + Express
- SQLite3
- Vanilla JavaScript
- Playwright (testing)

## Status

This branch contains only the frontend skeleton. The `routes/api.js` file is missing, so the application will not start.

## Setup

```bash
npm install
sqlite3 database.db < schema.sql
```

Note: `npm start` will fail due to missing API routes.

## What's Included

- HTML/CSS/JS frontend files
- Database schema
- Basic Express setup
- No backend implementation

## Branches

- `main` - Frontend skeleton only (current)
- `insecure` - Full working version with intentional vulnerabilities
- `secure` - Full working version with security fixes

## Next Steps

Switch to a working branch:

```bash
# For vulnerable version
git checkout insecure
npm start

# For secure version
git checkout secure
npm start
```
