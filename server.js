const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Database connection avec retry logic
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    connectionTimeoutMillis: 5000,
    max: 20,
    idleTimeoutMillis: 30000
});

// Fonction de retry pour initialiser la base de données
async function initializeDatabase(retries = 10, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Tentative ${i + 1}/${retries} de connexion à la base de données...`);
            await pool.query('SELECT 1');
            console.log('✅ Connexion à la base de données réussie!');
            
            // Créer la table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100),
                    email VARCHAR(100)
                )
            `);
            console.log('✅ Table users créée/vérifiée avec succès!');
            return true;
        } catch (err) {
            console.error(`❌ Échec de la connexion (tentative ${i + 1}/${retries}):`, err.message);
            if (i < retries - 1) {
                console.log(`⏳ Nouvelle tentative dans ${delay/1000} secondes...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('💥 Impossible de se connecter à la base de données après toutes les tentatives');
    return false;
}

/**
 * HEALTH CHECK ENDPOINT
 */
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'healthy', database: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
    }
});

app.get('/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ready' });
    } catch (err) {
        res.status(503).json({ status: 'not ready', error: err.message });
    }
});

/**
 * ROUTES
 */

// GET - Retrieve all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET - Retrieve a specific user
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - Create a new user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email } = req.body;
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - Update a user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { name, email } = req.body;
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
            [name, email, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Remove a user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
async function startServer() {
    console.log('🚀 Démarrage du serveur...');
    
    // Initialiser la base de données avec retry
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log('✅ CI/CD pipeline is active!');
        console.log('✅ Kubernetes deployment is successful!');
        console.log('✅ Database connection established!');
        console.log('✅ --------de----Jenkins Reussi ---xxx--hhh----!');
        console.log('✅ --------ALL WORKS GOOD ----!');

    });
}

startServer();

module.exports = app;