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

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

const getSupabaseServer = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const PRODUCT_CONFIGS: Record<string, { durationDays: number; name: string; boosts: number }> = {
  'prd_7k0l8i0g': { durationDays: 15, name: 'Forfait 15 jours', boosts: 3 },
  'prd_j6ckq4qz': { durationDays: 30, name: 'Premium 1 mois', boosts: 3 },
  'prd_b1qiczzt': { durationDays: 90, name: 'Premium 3 mois', boosts: 5 },
  'prd_fczdiabm': { durationDays: 180, name: 'Premium 6 mois', boosts: 10 },
  'prd_d32ufi24': { durationDays: 365, name: 'Premium 12 mois', boosts: 20 },
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
    const purchaseId = data?.data?.purchase?.id;

    if (checkoutUrl) {
      return res.json({
        success: true,
        checkoutUrl,
        purchaseId,
        status: data?.data?.purchase?.status || 'awaiting_payment',
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

// Vérification en direct du statut d'achat et mise à jour de la base de données
app.post('/api/verify-chariow-purchase', async (req, res) => {
  try {
    const { purchaseId, userId, storeId = 'store_178jk0xaxj8i' } = req.body || {};

    if (!purchaseId) {
      return res.status(400).json({ error: 'Identifiant purchaseId manquant' });
    }

    const resp = await fetch(`https://api-edge.chariow.com/storefront/${storeId}/purchases/${purchaseId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Platform-Source': 'web:storefront',
        'Origin': 'https://digigenie.mychariow.shop',
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: 'Impossible de vérifier auprès de Chariow', details: errText });
    }

    const data: any = await resp.json();
    const purchase = data?.data;
    const status = purchase?.status;
    const paymentStatus = purchase?.payment?.status;
    const productId = purchase?.product?.id;

    const isCompleted = status === 'completed' || paymentStatus === 'paid';
    const isPending = status === 'awaiting_payment' || paymentStatus === 'initiated' || status === 'initiated';

    const planConfig = PRODUCT_CONFIGS[productId] || { durationDays: 30, name: 'Premium', boosts: 3 };

    if (isCompleted) {
      const durationDays = planConfig.durationDays;
      const premiumExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      // Mise à jour de la base de données Supabase si l'identifiant utilisateur est présent
      const supabase = getSupabaseServer();
      if (supabase && userId) {
        try {
          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              premium_expires_at: premiumExpiresAt,
              boosts_count: planConfig.boosts,
            })
            .eq('user_id', userId);
        } catch (dbErr) {
          console.warn('Erreur mise à jour Supabase profil:', dbErr);
        }
      }

      return res.json({
        success: true,
        verified: true,
        isPremium: true,
        status: 'completed',
        planName: planConfig.name,
        durationDays: planConfig.durationDays,
        premiumExpiresAt,
        purchase,
      });
    }

    if (isPending) {
      return res.json({
        success: true,
        verified: false,
        isPremium: false,
        isPending: true,
        status: 'awaiting_payment',
        purchase,
      });
    }

    return res.json({
      success: true,
      verified: false,
      isPremium: false,
      isFailed: true,
      status: status || 'unknown',
      purchase,
    });
  } catch (error: any) {
    console.error('Erreur vérification achat Chariow:', error);
    return res.status(500).json({ error: error?.message || 'Erreur interne' });
  }
});

// Webhook Chariow appelé automatiquement dès qu'un paiement réussit (supporte /chariow et /chario)
app.post(['/api/webhook/chariow', '/api/webhook/chario'], async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('Webhook Chariow reçu:', JSON.stringify(payload));

    const purchase = payload?.data?.purchase || payload?.purchase || payload?.data || payload;
    const status = purchase?.status || payload?.status || payload?.event;
    const paymentStatus = purchase?.payment?.status;
    const productId = purchase?.product?.id || payload?.product_id;
    const customerPhone = purchase?.customer?.phone?.number ? String(purchase.customer.phone.number) : null;
    const customerEmail = purchase?.customer?.email ? String(purchase.customer.email).toLowerCase() : null;

    const isPaid =
      status === 'completed' ||
      paymentStatus === 'paid' ||
      status === 'order.paid' ||
      status === 'purchase.completed';

    if (isPaid) {
      const planConfig = PRODUCT_CONFIGS[productId] || { durationDays: 30, name: 'Premium', boosts: 3 };
      const premiumExpiresAt = new Date(Date.now() + planConfig.durationDays * 24 * 60 * 60 * 1000).toISOString();

      const supabase = getSupabaseServer();
      if (supabase) {
        // 1. Recherche et mise à jour par email si présent
        if (customerEmail && !customerEmail.includes('@nassib.app')) {
          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              premium_expires_at: premiumExpiresAt,
              boosts_count: planConfig.boosts,
            })
            .ilike('email', customerEmail);
        }

        // 2. Recherche et mise à jour par téléphone si présent
        if (customerPhone) {
          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              premium_expires_at: premiumExpiresAt,
              boosts_count: planConfig.boosts,
            })
            .ilike('phone', `%${customerPhone}%`);
        }
      }
    }

    return res.status(200).json({ received: true, success: true });
  } catch (error: any) {
    console.error('Erreur Webhook Chariow:', error);
    return res.status(500).json({ error: error?.message || 'Erreur serveur' });
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
