#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

const SALT_ROUNDS = 10;

async function init() {
    console.log('Initializing database...\n');

    // Delete old database
    if (fs.existsSync('database.db')) {
        fs.unlinkSync('database.db');
        console.log('Removed old database');
    }

    const db = new sqlite3.Database('database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

    // Create tables
    db.serialize(async () => {
        db.run('PRAGMA foreign_keys = ON');

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_admin INTEGER DEFAULT 0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            age INTEGER NOT NULL,
            image_url TEXT,
            description TEXT,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        console.log('Created tables');

        // Hash admin password
        const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

        // Insert admin
        db.run('INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
            ['admin', 'admin@petadoption.com', hashedPassword, 1],
            function(err) {
                if (err) {
                    console.error('Error:', err);
                    process.exit(1);
                }
                console.log('Created admin user');

                // Add sample pets
                const pets = [
                    ['Max', 'dog', 3, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb', 'A friendly golden retriever who loves to play fetch and go for walks.', 1],
                    ['Luna', 'cat', 2, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 'A gentle and affectionate cat who enjoys cuddles and sunny window spots.', 1],
                    ['Charlie', 'dog', 5, 'https://images.unsplash.com/photo-1552053831-71594a27632d', 'An energetic beagle who is great with kids and other pets.', 1],
                    ['Mittens', 'cat', 1, 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4', 'A playful kitten with lots of energy and curiosity.', 1]
                ];

                pets.forEach((pet, i) => {
                    db.run('INSERT INTO pets (name, type, age, image_url, description, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                        pet,
                        function(err) {
                            if (err) console.error('Error adding pet:', err);
                            if (i === pets.length - 1) {
                                console.log(`Added ${pets.length} sample pets\n`);
                                console.log('Database ready!\n');
                                console.log('Admin credentials:');
                                console.log('  Username: admin');
                                console.log('  Password: admin123\n');
                                db.close();
                            }
                        }
                    );
                });
            }
        );
    });
}

init();
