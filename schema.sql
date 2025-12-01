-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Pets table
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    age INTEGER NOT NULL,
    image_url TEXT,
    description TEXT,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample admin user if not exists
INSERT OR IGNORE INTO users (username, email, password)
VALUES ('admin', 'admin@petadoption.com', 'admin123');

-- Insert sample pets (all added by admin user with id=1)
INSERT INTO pets (name, type, age, image_url, description, user_id) VALUES
('Max', 'dog', 3, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb', 'A friendly golden retriever who loves to play fetch and go for walks.', 1),
('Luna', 'cat', 2, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 'A gentle and affectionate cat who enjoys cuddles and sunny window spots.', 1),
('Charlie', 'dog', 5, 'https://images.unsplash.com/photo-1552053831-71594a27632d', 'An energetic beagle who is great with kids and other pets.', 1),
('Mittens', 'cat', 1, 'https://images.unsplash.com/photo-1573865526739-10c1dd7aad9f', 'A playful kitten with lots of energy and curiosity.', 1);
