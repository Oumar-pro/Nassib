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

app.post('/api/chariow-checkout', async (req, res) => {
  try {
    const {
      productId = 'prd_7k0l8i0g',
      storeId = 'store_178jk0xaxj8i',
      countryCode = 'NE',
      phoneNumber = '',
      name = 'Membre Nassib',
      email = 'contact@nassib.app',
    } = req.body || {};

    const cleanPhone = String(phoneNumber || '').replace(/[\s\-_().]/g, '');
    const cleanCountry = String(countryCode || 'NE').toUpperCase();
    const nameParts = String(name || 'Membre').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Membre';
    const lastName = nameParts.slice(1).join(' ') || 'Nassib';
    const cleanEmail = String(email || '').trim() || `membre_${Date.now()}@nassib.app`;

    const payload = {
      channel: 'widget',
      product_id: productId,
      first_name: firstName,
      last_name: lastName,
      email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@nassib.app`,
      phone: {
        country_code: cleanCountry,
        number: cleanPhone,
      },
    };

    const response = await fetch(`https://api-edge.chariow.com/storefront/${storeId}/checkout/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Platform-Source': 'web:storefront',
        'Origin': 'https://digigenie.mychariow.shop',
        'Referer': `https://digigenie.mychariow.shop/${productId}/checkout`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chariow purchase error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Chariow purchase failed',
        details: errorText,
      });
    }

    const data: any = await response.json();
    const checkoutUrl = data?.data?.payment?.checkout_url;

    if (checkoutUrl) {
      return res.json({
        success: true,
        checkoutUrl,
      });
    }

    return res.status(400).json({
      error: 'No checkout URL returned',
      data,
    });
  } catch (error: any) {
    console.error('Error generating Chariow checkout:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

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
