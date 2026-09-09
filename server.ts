import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

const getOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return apiKey ? createOpenRouter({ apiKey }) : null;
};

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

// Helper pour construire le prompt de rédaction matrimoniale éthique
function buildMatrimonialPrompt(
  type: string,
  hints: string,
  currentDraft: string,
  tone: string,
  profileContext: any = {}
): string {
  const isFemale = profileContext.gender === 'female';
  const genderLabel = isFemale ? 'une femme musulmane' : 'un homme musulman';
  const age = profileContext.age ? `${profileContext.age} ans` : '';
  const city = profileContext.city ? `habitant à ${profileContext.city}` : '';
  const profession = profileContext.profession ? `exerçant comme ${profileContext.profession}` : '';
  const education = profileContext.education ? `niveau d'études : ${profileContext.education}` : '';
  const personality = profileContext.personalityTrait ? `personnalité : ${profileContext.personalityTrait}` : '';
  const practice = profileContext.religiousPractice ? `pratique religieuse : ${profileContext.religiousPractice}` : '';

  const contextDetails = [genderLabel, age, city, profession, education, personality, practice]
    .filter(Boolean)
    .join(', ');

  const toneInstruction =
    tone === 'detailed'
      ? 'chaleureux, expressif et détaillé'
      : tone === 'concise'
      ? 'concis, direct et percutant'
      : 'sincère, noble, mesuré et équilibré';

  if (type === 'bio' || type === 'presentation') {
    return `Tu es l'assistant de rédaction matrimoniale bienveillant de la plateforme NASSIB (application de mariage musulman sunnite respectant la Sharia et les convenances éthiques).
Mission : Rédige une présentation personnelle (biographie de profil) matrimoniale musulmane sincère, sobre, pudique et positive à la 1ère personne du singulier ('Je').
Profil du membre : ${contextDetails || 'Candidat au mariage pieux'}.
${hints ? `Éléments clés / Mots-clés donnés par le membre : "${hints}"` : ''}
${currentDraft ? `Brouillon actuel rédigé par le membre (à corriger, sublimer et enrichir tout en restant authentique) : "${currentDraft}"` : ''}
Ton requis : ${toneInstruction}.
Règles strictes :
- Rédige en français soigné, naturel et mature.
- Rédige entre 3 et 5 phrases fluides.
- Valorise la spiritualité (Taqwa), la loyauté, le sens de la famille et le désir d'un foyer serein (Sakina).
- Ne commence PAS par 'Salam', 'Bonjour' ou 'Je m'appelle'. Entre directement dans le vif du sujet.
- Rédige UNIQUEMENT le texte final prêt à être inséré, sans guillemets au début/fin, sans puces et sans commentaires.`;
  }

  if (type === 'partner_criteria' || type === 'criteria') {
    return `Tu es l'assistant de rédaction matrimoniale de la plateforme NASSIB.
Mission : Rédige ce que ${genderLabel} recherche chez son futur époux / sa future épouse pour un mariage durable et épanoui.
Rédige à la 1ère personne ('Je recherche...').
Profil de la personne : ${contextDetails || 'Membre Nassib'}.
${profileContext.preferredAgeRange ? `Tranche d'âge souhaitée : ${profileContext.preferredAgeRange}` : ''}
${hints ? `Critères clés indiqués : "${hints}"` : ''}
${currentDraft ? `Brouillon actuel : "${currentDraft}"` : ''}
Ton requis : ${toneInstruction}.
Règles strictes :
- Mettre l'accent sur la crainte d'Allah, la maturité émotionnelle, la bienveillance, la fidélité aux engagements et le sens des responsabilités.
- Rédige entre 3 et 4 phrases en français élégant et posé.
- Rédige UNIQUEMENT le texte final prêt à l'emploi.`;
  }

  if (type === 'family_vision' || type === 'vision') {
    return `Tu es l'assistant de rédaction matrimoniale de la plateforme NASSIB.
Mission : Rédige la vision du foyer et de la vie de famille musulmane de ${genderLabel}.
${hints ? `Points souhaités : "${hints}"` : ''}
${currentDraft ? `Brouillon actuel : "${currentDraft}"` : ''}
Ton requis : ${toneInstruction}.
Règles strictes :
- Souligne l'importance de l'amour empreint de miséricorde (Mawaddah wa Rahmah), la sérénité du foyer (Sakina), l'entraide quotidienne et l'éducation islamique des enfants.
- 2 à 4 phrases bien tournées en français à la première personne.
- Rédige UNIQUEMENT le texte final.`;
  }

  if (type === 'dealbreaker') {
    return `Tu es l'assistant de rédaction matrimoniale de NASSIB.
Mission : Formule une ligne rouge ou condition déterminante (deal-breaker) de manière polie, digne et résolue en 1 ou 2 phrases concises en français.
Idée : "${hints || currentDraft || 'Manque de respect ou négligence religieuse'}".
Rédige UNIQUEMENT la phrase finale.`;
  }

  return hints || currentDraft || `Rédige une description matrimoniale musulmane sincère, pudique et positive pour ${genderLabel}.`;
}

// Fallback intelligent en local si aucune clé API n'est configurée ou en cas de coupure temporaire
function generateLocalFallback(
  type: string,
  hints: string,
  currentDraft: string,
  tone: string,
  profileContext: any = {}
): string {
  const city = profileContext.city || 'Niamey';
  const profession = profileContext.profession || 'mon domaine professionnel';
  const isFemale = profileContext.gender === 'female';

  if (type === 'bio' || type === 'presentation') {
    if (hints || currentDraft) {
      const input = (hints || currentDraft).trim();
      return `De nature calme, respectueuse et attachée à mes valeurs religieuses, j'accorde une importance essentielle à l'authenticité et à la sincérité. ${input.length > 5 ? `Dans mon quotidien, je me caractérise par : ${input}. ` : ''}Je souhaite aujourd'hui concrétiser la moitié de mon dîn en fondant un foyer harmonieux et pieux, basé sur l'entraide mutuelle et la confiance.`;
    }
    return `Personne posée, sincère et attachée à la foi ainsi qu'aux valeurs familiales. Basé(e) à ${city} et évoluant dans ${profession}, je privilégie la paix intérieure, les relations vraies et le respect mutuel. Mon intention est de construire un foyer empreint de Sakina et d'évoluer ensemble dans l'amour d'Allah.`;
  }

  if (type === 'partner_criteria' || type === 'criteria') {
    if (hints || currentDraft) {
      const input = (hints || currentDraft).trim();
      return `Je recherche une personne bienveillante et pieuse, accordant une valeur fondamentale à la moralité et au respect des engagements. Idéalement : ${input}. Mon souhait est de cheminer main dans la main avec un conjoint fiable, communicatif et investi dans la réussite de notre vie de famille.`;
    }
    return `Je recherche un(e) conjoint(e) pieux(se), intègre et bienveillant(e), avec qui partager une complicité saine et une entraide constante. Une personne attachée à la prière, à l'esprit de famille et au dialogue apaisé pour avancer sereinement ensemble.`;
  }

  if (type === 'family_vision' || type === 'vision') {
    return `Pour moi, le foyer musulman doit être un havre de sérénité (Sakina), de tendresse et de respect partagé. Je conçois la vie conjugale comme un partenariat noble où l'on s'épaule face aux défis du quotidien et où l'on élève nos futurs enfants dans les plus beaux enseignements de l'Islam.`;
  }

  if (type === 'dealbreaker') {
    const input = (hints || currentDraft).trim();
    return input ? `Condition primordiale : ${input}. Je privilégie une relation bâtie sur la clarté, le respect mutuel et l'honnêteté réciproque.` : `Négligence des obligations religieuses et manque de respect envers la belle-famille.`;
  }

  return hints || currentDraft || 'Profil matrimonial respectueux et authentique.';
}

// API de Génération de texte assistée par IA (OpenRouter avec modèle google/gemma-4-31b-it:free)
app.post(['/api/chat', '/api/ai/write', '/api/ai/assist'], async (req, res) => {
  try {
    const {
      prompt,
      type = 'bio',
      hints = '',
      currentDraft = '',
      tone = 'sincere',
      profileContext = {},
    } = req.body || {};

    const targetPrompt =
      prompt && typeof prompt === 'string' && prompt.trim().length > 10
        ? prompt.trim()
        : buildMatrimonialPrompt(type, hints, currentDraft, tone, profileContext);

    let generatedText = '';

    // 1. Appel OpenRouter avec la clé OPENROUTER_API_KEY et le SDK @openrouter/ai-sdk-provider
    const openrouter = getOpenRouterClient();
    if (openrouter) {
      try {
        console.log('Appel OpenRouter avec modèle google/gemma-4-31b-it:free...');
        const result = await generateText({
          model: openrouter.chat('google/gemma-4-31b-it:free'),
          prompt: targetPrompt,
        });
        if (result && result.text && result.text.trim()) {
          generatedText = result.text.trim();
        }
      } catch (openRouterErr: any) {
        console.warn('OpenRouter primary call error (tentative modèle alternatif):', openRouterErr?.message);
        // Tentative sur un modèle OpenRouter alternatif gratuit si congestion
        try {
          const backupResult = await generateText({
            model: openrouter.chat('meta-llama/llama-3.3-70b-instruct:free'),
            prompt: targetPrompt,
          });
          if (backupResult && backupResult.text && backupResult.text.trim()) {
            generatedText = backupResult.text.trim();
          }
        } catch (backupErr: any) {
          console.warn('OpenRouter backup model error:', backupErr?.message);
        }
      }
    }

    // 2. Repli vers Gemini si OpenRouter n'a pas répondu et que GEMINI_API_KEY est présent
    if (!generatedText) {
      const gemini = getGenAIClient();
      if (gemini) {
        try {
          console.log('Repli sur Gemini pour la rédaction IA...');
          const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: targetPrompt,
          });
          if (response && response.text && response.text.trim()) {
            generatedText = response.text.trim();
          }
        } catch (geminiErr: any) {
          console.warn('Gemini fallback failed:', geminiErr?.message);
        }
      }
    }

    // 3. Repli intelligent garanti sans coupure
    if (!generatedText) {
      console.log('Génération de repli textuel basée sur le profil...');
      generatedText = generateLocalFallback(type, hints, currentDraft, tone, profileContext);
    }

    // Nettoyage des guillemets éventuels
    generatedText = generatedText.replace(/^["'«»\s]+|["'«»\s]+$/g, '').trim();

    return res.json({
      success: true,
      text: generatedText,
      reply: generatedText,
    });
  } catch (error: any) {
    console.error('Erreur API assistant rédaction IA:', error);
    return res.status(500).json({ error: error?.message || 'Erreur lors de la rédaction' });
  }
});

// Transmission de signalement ou message d'assistance vers l'administrateur (+227 82461299)
app.post('/api/contact-support', async (req, res) => {
  try {
    const {
      userId,
      userName = 'Membre Nassib',
      userEmail,
      userPhone,
      issueType = 'Autre problème',
      description = '',
    } = req.body || {};

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'La description du problème est obligatoire.' });
    }

    const adminWhatsApp = process.env.ADMIN_WHATSAPP_PHONE || '22782461299';
    const cleanPhone = adminWhatsApp.replace(/[^0-9]/g, '');

    const nowFormatted = new Date().toLocaleString('fr-FR', {
      timeZone: 'Africa/Niamey',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const formattedMessage = [
      `🔔 *NOUVEAU SIGNALEMENT / MESSAGE SUPPORT (NASSIB)* 🔔`,
      ``,
      `📌 *Type de problème :* ${issueType}`,
      `👤 *Membre :* ${userName}`,
      userPhone ? `📞 *Téléphone :* ${userPhone}` : null,
      userEmail ? `✉️ *Email :* ${userEmail}` : null,
      `⏰ *Date (Niamey) :* ${nowFormatted}`,
      userId ? `🆔 *Identifiant :* ${userId}` : null,
      ``,
      `📝 *Description :*`,
      `${description.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');

    console.log('--- NOUVEAU TICKET SUPPORT TRANSMIS ---');
    console.log('Admin WhatsApp:', `+${cleanPhone}`);
    console.log(formattedMessage);
    console.log('---------------------------------------');

    // 1. Sauvegarde dans Supabase pour archivage sécurisé
    const supabase = getSupabaseServer();
    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert({
          action: 'user_support_ticket',
          target_type: 'support_ticket',
          details: {
            issueType,
            description: description.trim(),
            userName,
            userPhone,
            userEmail,
            userId,
            adminWhatsApp: `+${cleanPhone}`,
            sentAt: new Date().toISOString(),
          },
        });
      } catch (dbErr) {
        console.warn('Erreur archivage support dans admin_audit_logs:', dbErr);
      }
    }

    // 2. Envoi vers WhatsApp via passerelles configurées
    // a. Webhook WhatsApp / Automatisation (n8n, Make, Zapier...)
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: cleanPhone,
            message: formattedMessage,
            issueType,
            description: description.trim(),
            userName,
            userPhone,
            userEmail,
            userId,
          }),
        });
      } catch (errWh) {
        console.warn('Erreur Webhook WhatsApp:', errWh);
      }
    }

    // b. CallMeBot API (passerelle gratuite vers numéro personnel WhatsApp)
    const callmebotKey = process.env.CALLMEBOT_API_KEY || process.env.WHATSAPP_API_KEY;
    if (callmebotKey) {
      try {
        const textEncoded = encodeURIComponent(formattedMessage);
        await fetch(
          `https://api.callmebot.com/whatsapp.php?phone=+${cleanPhone}&text=${textEncoded}&apikey=${callmebotKey}`
        );
      } catch (errBot) {
        console.warn('Erreur CallMeBot WhatsApp:', errBot);
      }
    }

    // c. Meta WhatsApp Cloud API officielle
    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (metaToken && metaPhoneId) {
      try {
        await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: formattedMessage },
          }),
        });
      } catch (errMeta) {
        console.warn('Erreur Meta WhatsApp Cloud API:', errMeta);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Votre message a bien été transmis à l’administrateur.',
    });
  } catch (error: any) {
    console.error('Erreur API support:', error);
    return res.status(500).json({ error: error?.message || 'Erreur lors de la transmission.' });
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
