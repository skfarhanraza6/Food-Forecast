import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './server/api.ts';
import { getDb } from './server/db.ts';
import { initSchema } from './server/schema.ts';
import { seedDatabase } from './server/seed.ts';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB and schema
async function initBackend() {
  try {
    await getDb();
    await initSchema();
    await seedDatabase();
    console.log('✓ SQLite Database initialized and seeded successfully.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FOOD FORECAST API', timestamp: new Date().toISOString() });
});

async function startServer() {
  await initBackend();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FOOD FORECAST Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
