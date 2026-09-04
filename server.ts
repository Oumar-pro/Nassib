import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Server Client using Service Role Key (or fallback to anon key)
const getSupabaseServerClient = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || url.includes('your-project')) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Initialize Google GenAI SDK lazily/safely
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set. Gemini features will return fallback answers.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint for Imam Oumar Assistant Chat
app.post('/api/imam-chat', async (req, res) => {
  try {
    const { messages, userRole, userName } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'La liste des messages est requise.' });
    }

    const ai = getGenAIClient();

    // Fallback if API key is not configured or fails
    if (!ai) {
      const lastMessage = messages[messages.length - 1]?.text || '';
      return res.json({
        reply: `As-salamu alaykum ${userName || 'cher frère/chère sœur'}. En tant qu'Imam Oumar, je vous conseille vivement d'aborder votre démarche matrimoniale avec sincérité (Niyyah), respect du tuteur (Wali) et modération dans la dot. N'hésitez pas à me poser vos questions précises sur le mariage en Islam.`,
      });
    }

    const systemInstruction = `Tu es Imam Oumar, un érudit islamique, guide spirituel et conseiller matrimonial d'une grande sagesse, très respecté au Niger et en Afrique de l'Ouest.
Ton objectif principal est de conseiller avec bienveillance, clarté et concision les hommes, femmes et tuteurs (Walis) sur le mariage éthique en Islam (Fiqh al-Nikah), le respect des étapes de la demande en mariage (Tâ'arof), le rôle prépondérant du tuteur (Wali), la modération de la dot (Mahr) et la sérénité du foyer.

Principes clés de tes réponses :
1. Salue toujours avec chaleur ("As-salamu alaykum wa rahmatullah", "Qu'Allah bénisse votre foyer", "Mon cher frère / Ma chère sœur").
2. Sois toujours concis (2 à 3 paragraphes maximum), clair, positif et ancré dans le juste milieu (Al-Wassatiyyah).
3. Rends tes conseils applicables dans la réalité culturelle nigérienne et ouest-africaine moderne (Niamey, Zinder, Maradi, etc.) tout en préservant scrupuleusement la loi islamique.
4. Valorise la transparence, le respect du Wali, le consentement mutuel, la préservation de l'honneur des familles et la pudeur des échanges.
5. Si l'utilisateur pose une question complexe ou délicate, offre des réponses équilibrées, compréhensives et apaisantes.
${userName ? `Tu t'adresses à ${userName} (${userRole === 'wali' ? 'un Wali / Tuteur respecté' : 'un membre en recherche de mariage'}).` : ''}`;

    // Format chat history for Gemini
    const formattedHistory = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Extract the latest prompt
    const lastUserPrompt = messages[messages.length - 1]?.text || 'As-salamu alaykum';

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "Qu'Allah facilite votre démarche matrimoniale et vous accorde une union pieuse et harmonieuse.";

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/imam-chat:', error);
    res.json({
      reply: "As-salamu alaykum. Une petite difficulté technique est survenue, mais gardez en mémoire ce précepte : le mariage repose sur l'amour sincère (Mawaddah) et la miséricorde (Rahmah). Posez-moi de nouveau votre question.",
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
