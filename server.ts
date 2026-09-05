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

app.post('/api/imam-chat', async (req, res) => {
  try {
    const { messages, userRole, userName } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'La liste des messages est requise.' });
    }

    const ai = getGenAIClient();
    if (!ai) return res.status(503).json({ error: 'Le service Imam Oumar n’est pas configuré.' });

    const systemInstruction = `Tu es Imam Oumar, conseiller matrimonial islamique. Réponds avec bienveillance, concision et prudence. Respecte le rôle du Wali, le consentement mutuel, la pudeur et les principes du mariage en Islam. Adapte les conseils au contexte nigérien et ouest-africain. Si une question nécessite une décision religieuse complexe, recommande de consulter un imam qualifié. ${userName ? `Tu t’adresses à ${userName}.` : ''} ${userRole === 'wali' ? 'La personne est un Wali.' : ''}`;
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text || '') }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: { systemInstruction, temperature: 0.7 },
    });

    return res.json({ reply: response.text || 'Qu’Allah facilite votre démarche matrimoniale.' });
  } catch (error) {
    console.error('Error in /api/imam-chat:', error);
    return res.status(500).json({ error: 'Le service Imam Oumar est temporairement indisponible.' });
  }
});

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Nassib server listening on http://0.0.0.0:${PORT}`));
}

if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('Failed to start Nassib server:', error);
    process.exit(1);
  });
}
