const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// For Vercel serverless environment
if (process.env.VERCEL) {
  prisma.$connect().catch(err => console.error('Prisma connection error:', err));
}

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for images

// Root route - welcome message
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to StoryShelf Café API!',
    endpoints: {
      health: '/api/health',
      entries: '/api/entries',
      createEntry: 'POST /api/entries',
      deleteEntry: 'DELETE /api/entries/:id',
      updateEntry: 'PUT /api/entries/:id',
      threads: 'POST /api/threads'
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
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single entry
app.get('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.entry.findUnique({ 
      where: { id } 
    });
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create entry - UPDATED with image
app.post('/api/entries', async (req, res) => {
  try {
    const { title, type, month, note, rating, mood, image } = req.body;
    const entry = await prisma.entry.create({
      data: { 
        title, 
        type, 
        month, 
        note, 
        rating, 
        mood,
        image: image || null 
      }
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update entry - UPDATED with image
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, month, note, rating, mood, image } = req.body;
    
    const existing = await prisma.entry.findUnique({ 
      where: { id } 
    });
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    const updated = await prisma.entry.update({
      where: { id },
      data: { 
        title, 
        type, 
        month, 
        note, 
        rating, 
        mood,
        image: image !== undefined ? image : existing.image
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting entry with ID:', id);
    
    const existing = await prisma.entry.findUnique({ 
      where: { id } 
    });
    if (!existing) {
      console.log('❌ Entry not found:', id);
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    await prisma.entry.delete({ 
      where: { id } 
    });
    console.log('✅ Entry deleted:', id);
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalEntries = await prisma.entry.count();
    const byType = await prisma.entry.groupBy({
      by: ['type'],
      _count: true
    });
    const byMood = await prisma.entry.groupBy({
      by: ['mood'],
      _count: true
    });
    res.json({ 
      total: totalEntries, 
      byType, 
      byMood 
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ Memory Threads with Gemini API ============
app.post('/api/threads', async (req, res) => {
  try {
    const { log } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in .env');
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    const prompt = `Based on this person's log of books, films, music, and journal entries:

${log}

Find ONE specific thematic thread that connects several of these entries. Write a warm, observant insight - like something a friend might notice. Keep it to 2-3 complete sentences.`;

    console.log('🔮 Calling Gemini API with gemini-2.5-flash...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: prompt }] 
        }],
        generationConfig: { 
          temperature: 0.9, 
          maxOutputTokens: 200,
          topK: 40,
          topP: 0.95
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API error:', errorData);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Gemini response received');
    
    let text = "The thread is there, quietly, even when the words don't come easily.";
    try {
      if (data.candidates && data.candidates.length > 0) {
        const fullText = data.candidates[0].content.parts[0].text.trim();
        if (fullText && fullText.length > 0) {
          text = fullText;
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
    
    // Clean up the response - remove any extra quotes
    text = text.replace(/^["']|["']$/g, '');
    
    console.log('✅ Sending thread:', text);
    res.json({ thread: text });
  } catch (error) {
    console.error('Error in /api/threads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Only start a local listener when running on your own machine.
// On Vercel, the platform calls the exported app directly as a
// serverless function, so app.listen() is never used there.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET    /api/entries     - Get all entries`);
    console.log(`   GET    /api/entries/:id - Get single entry`);
    console.log(`   POST   /api/entries     - Create entry`);
    console.log(`   PUT    /api/entries/:id - Update entry`);
    console.log(`   DELETE /api/entries/:id - Delete entry`);
    console.log(`   GET    /api/stats       - Get statistics`);
    console.log(`   GET    /api/health      - Health check`);
    console.log(`   POST   /api/threads     - Memory Threads (Gemini AI)`);
  });
}

// Required so backend/api/index.js can do: require('../server')
module.exports = app;