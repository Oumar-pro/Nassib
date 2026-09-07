import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/imam-chat', async (_req, res) => {
  return res.json({
    reply: "As-salamu alaykum. Le service de l'Imam Oumar est indisponible pour le moment. Il sera très bientôt disponible in sha Allah.",
  });
});

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Nassib server listening on http://0.0.0.0:${PORT}`));
}

if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('Failed to start Nassib server:', error);
    process.exit(1);
  });
}
