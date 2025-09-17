const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

app.post('/add-entry', (req, res) => {
    const { regNumber, name, companyName, duration, date, roomNumber } = req.body;
    
    // Validate that all required fields are present
    if (!regNumber || !name || !companyName || !duration || !date || !roomNumber) {
        return res.status(400).send({ 
            error: 'All fields are required: regNumber, name, companyName, duration, date, roomNumber' 
        });
    }
    
    const query = 'INSERT INTO schedule (reg_no, name, company, duration, date, room) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [regNumber, name, companyName, duration, date, roomNumber], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error', details: err.message });
        }
        res.send({ 
            message: 'Entry saved successfully',
            id: result.insertId
        });
    });
});

// Optional: Add an endpoint to fetch all entries (useful for loading existing data)
app.get('/entries', (req, res) => {
    const query = 'SELECT * FROM schedule ORDER BY date, duration';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error', details: err.message });
        }
        res.send(results);
    });
});

// Optional: Add an endpoint to update entries
app.put('/update-entry/:id', (req, res) => {
    const { id } = req.params;
    const { regNumber, name, companyName, duration, date, roomNumber } = req.body;
    
    if (!regNumber || !name || !companyName || !duration || !date || !roomNumber) {
        return res.status(400).send({ 
            error: 'All fields are required: regNumber, name, companyName, duration, date, roomNumber' 
        });
    }
    
    const query = 'UPDATE schedule SET reg_no = ?, name = ?, company = ?, duration = ?, date = ?, room = ? WHERE id = ?';
    db.query(query, [regNumber, name, companyName, duration, date, roomNumber, id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Entry not found' });
        }
        res.send({ message: 'Entry updated successfully' });
    });
});

// Optional: Add an endpoint to delete entries
app.delete('/delete-entry/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM schedule WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Entry not found' });
        }
        res.send({ message: 'Entry deleted successfully' });
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));