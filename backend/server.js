const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
// Root route - welcome message
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to StoryShelf Café API!',
    endpoints: {
      health: '/api/health',
      entries: '/api/entries',
      createEntry: 'POST /api/entries'
    }
  });
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all entries
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create entry
app.post('/api/entries', async (req, res) => {
  try {
    const { title, type, month, note, rating, mood } = req.body;
    const entry = await prisma.entry.create({
      data: { title, type, month, note, rating, mood }
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});