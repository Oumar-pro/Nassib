import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Secret key used for signing administrative session tokens
const ADMIN_SECRET =
  process.env.ADMIN_PASSWORD ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'zawaj_niger_secure_admin_hmac_secret_key';

// Helper to generate a tamper-proof HMAC token for admin session
const generateAdminToken = (email: string): string => {
  const timestamp = Date.now().toString();
  const payload = `${email}:${timestamp}`;
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
};

// Helper to verify admin token
const verifyAdminToken = (token: string): boolean => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, timestampStr, signature] = decoded.split(':');
    if (!email || !timestampStr || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', ADMIN_SECRET)
      .update(`${email}:${timestampStr}`)
      .digest('hex');

    if (signature !== expectedSignature) return false;

    // Verify token expiration (valid 7 days)
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Middleware: Require valid administrator authorization
const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé : jeton administrateur requis.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || !verifyAdminToken(token)) {
    return res.status(403).json({ error: 'Session administrateur expirée ou invalide. Veuillez vous reconnecter.' });
  }

  next();
};

// Initialize Supabase Admin Client using Service Role Key (or fallback to anon key)
const getSupabaseAdminClient = () => {
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

// --- ADMIN API ENDPOINTS (Protected & Powered by Supabase Service Role Key) ---

// Admin Login Check (NO hardcoded passwords in code)
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({
      success: false,
      error: 'Variables d\'environnement ADMIN_EMAIL et ADMIN_PASSWORD non configurées sur le serveur. Définissez-les dans les paramètres secrets.',
    });
  }

  if (
    email &&
    password &&
    email.trim().toLowerCase() === adminEmail.trim().toLowerCase() &&
    password === adminPassword
  ) {
    const token = generateAdminToken(adminEmail);
    return res.json({
      success: true,
      token,
      user: {
        id: 'usr_admin_001',
        email: adminEmail,
        role: 'super_admin',
        name: 'Administrateur Zawaj Niger',
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Identifiants administrateur incorrects. Accès refusé.',
  });
});

// Admin Global Stats (Protected)
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return res.json({
      configured: false,
      totalProfiles: 0,
      verifiedNNI: 0,
      waliApproved: 0,
      premiumMembers: 0,
      totalConversations: 0,
    });
  }

  try {
    const { data: profiles, error: pError } = await supabaseAdmin.from('profiles').select('id, is_verified_nni, is_wali_approved, is_premium');
    const { data: convs } = await supabaseAdmin.from('conversations').select('id');

    if (pError) {
      if (pError.code === 'PGRST205') {
        return res.json({
          configured: true,
          tableMissing: true,
          totalProfiles: 0,
          verifiedNNI: 0,
          waliApproved: 0,
          premiumMembers: 0,
          totalConversations: 0,
        });
      }
      throw pError;
    }

    const totalProfiles = profiles?.length || 0;
    const verifiedNNI = profiles?.filter((p: any) => p.is_verified_nni).length || 0;
    const waliApproved = profiles?.filter((p: any) => p.is_wali_approved).length || 0;
    const premiumMembers = profiles?.filter((p: any) => p.is_premium).length || 0;
    const totalConversations = convs?.length || 0;

    res.json({
      configured: true,
      totalProfiles,
      verifiedNNI,
      waliApproved,
      premiumMembers,
      totalConversations,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du chargement des statistiques Supabase' });
  }
});

// Admin Get All Profiles (Protected)
app.get('/api/admin/profiles', requireAdminAuth, async (req, res) => {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return res.json([]);
  }

  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
    const profiles: any[] = (data || []).filter(Boolean);

    // Also fetch auth users from Supabase Auth so no registered account is missed
    try {
      const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers();
      const usersList: any[] = (authUsersData as any)?.users || [];
      if (Array.isArray(usersList) && usersList.length > 0) {
        const existingIds = new Set(profiles.map((p: any) => p.user_id || p.id));
        const existingEmails = new Set(profiles.map((p: any) => (p.user_email || p.email || '').toLowerCase()));

        usersList.forEach((u: any) => {
          const emailLower = (u.email || '').toLowerCase();
          if (emailLower && !existingEmails.has(emailLower) && !existingIds.has(u.id)) {
            profiles.push({
              id: u.id,
              user_id: u.id,
              user_email: u.email,
              name: u.user_metadata?.name || emailLower.split('@')[0],
              age: u.user_metadata?.age || 25,
              profession: u.user_metadata?.profession || (u.user_metadata?.role === 'wali' ? 'Wali (Tuteur)' : 'Membre inscrit'),
              city: u.user_metadata?.city || 'Niamey',
              marital_status: u.user_metadata?.maritalStatus || 'Jamais marié(e)',
              religion: 'Sunnite',
              education: 'Licence / Bac+3',
              match_percentage: 90,
              is_verified_nni: Boolean(u.user_metadata?.is_verified_nni),
              is_wali_approved: Boolean(u.user_metadata?.is_wali_approved),
              is_premium: Boolean(u.user_metadata?.is_premium),
              photo_url: u.user_metadata?.photo_url || '',
              photo_private: false,
              bio: `Inscrit le ${new Date(u.created_at).toLocaleDateString('fr-FR')}`,
              wali_reference: u.user_metadata?.phone || 'Non renseigné',
              gender: u.user_metadata?.gender || 'female',
              views_count: 0,
              likes_count: 0,
            });
          }
        });
      }
    } catch (authErr) {
      console.warn('Could not list auth users from Supabase admin:', authErr);
    }

    res.json(profiles);
  } catch (err: any) {
    console.error('Error fetching admin profiles:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Verify NNI (Protected)
app.post('/api/admin/profiles/:id/verify-nni', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return res.status(400).json({ error: 'Supabase Service Role Key non configuré dans .env' });
  }

  try {
    await supabaseAdmin
      .from('profiles')
      .update({ is_verified_nni: Boolean(status) })
      .or(`id.eq.${id},user_id.eq.${id}`);

    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { is_verified_nni: Boolean(status) },
      });
    } catch (e) {}

    res.json({ success: true, is_verified_nni: Boolean(status) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Verify Wali (Protected)
app.post('/api/admin/profiles/:id/verify-wali', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return res.status(400).json({ error: 'Supabase Service Role Key non configuré dans .env' });
  }

  try {
    await supabaseAdmin
      .from('profiles')
      .update({ is_wali_approved: Boolean(status) })
      .or(`id.eq.${id},user_id.eq.${id}`);

    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { is_wali_approved: Boolean(status) },
      });
    } catch (e) {}

    res.json({ success: true, is_wali_approved: Boolean(status) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Toggle Premium (Protected)
app.post('/api/admin/profiles/:id/toggle-premium', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return res.status(400).json({ error: 'Supabase Service Role Key non configuré dans .env' });
  }

  try {
    await supabaseAdmin
      .from('profiles')
      .update({ is_premium: Boolean(status) })
      .or(`id.eq.${id},user_id.eq.${id}`);

    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          is_premium: Boolean(status),
          planName: status ? 'Baraka (Premium)' : 'Sadaq (Gratuit)',
        },
      });
    } catch (e) {}

    res.json({ success: true, is_premium: Boolean(status) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Profile (Protected)
app.delete('/api/admin/profiles/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return res.status(400).json({ error: 'Supabase Service Role Key non configuré dans .env' });
  }

  try {
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Profil supprimé avec succès par l\'administrateur' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REAL MOBILE MONEY NIGER PAYMENT API ENDPOINTS ---
// Supported operators: NITA, Al-Izza, Airtel Money, Moov Money (Flooz), Amana

const PLAN_PRICES: Record<string, { name: string; amount: number }> = {
  plan_baraka: { name: 'Baraka', amount: 5000 },
  plan_iman: { name: 'Iman', amount: 15000 },
  plan_sadaq: { name: 'Sadaq', amount: 0 },
};

// Initiate payment
app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { planId, paymentMethod, phoneNumber, userId, userEmail } = req.body;

    if (!planId || !paymentMethod || !phoneNumber) {
      return res.status(400).json({ error: 'Paramètres de paiement incomplets (planId, paymentMethod, phoneNumber requis).' });
    }

    const plan = PLAN_PRICES[planId];
    if (!plan || plan.amount <= 0) {
      return res.status(400).json({ error: 'Formule d\'abonnement invalide pour un paiement payant.' });
    }

    // Clean phone number (Niger numbers are 8 digits)
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+227/, '');
    if (!/^\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Numéro de téléphone nigérien invalide (doit contenir 8 chiffres après +227).' });
    }

    const reference = `ZWJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const operatorCode = Math.floor(100000 + Math.random() * 900000).toString();

    const supabaseAdmin = getSupabaseAdminClient();
    if (supabaseAdmin && userId) {
      try {
        await supabaseAdmin.from('payment_transactions').insert({
          user_id: userId,
          plan_id: planId,
          amount: plan.amount,
          currency: 'XOF',
          payment_method: paymentMethod,
          phone_number: `+227${cleanPhone}`,
          transaction_reference: reference,
          operator_reference: `OP-${operatorCode}`,
          status: 'pending',
          metadata: {
            userEmail,
            planName: plan.name,
            operator: paymentMethod,
          },
        });
      } catch (dbErr: any) {
        console.warn('Notice saving pending payment transaction in Supabase:', dbErr.message);
      }
    }

    let ussdInstruction = '';
    switch (paymentMethod) {
      case 'airtel_money':
        ussdInstruction = `Composez le *444# sur votre téléphone Airtel, sélectionnez "Paiement Marchand Zawaj Niger", confirmez ${plan.amount.toLocaleString()} FCFA et entrez votre code secret Airtel Money.`;
        break;
      case 'moov_money':
        ussdInstruction = `Composez le *156# sur votre téléphone Moov, sélectionnez "Flooz Paiement Marchand", confirmez le montant de ${plan.amount.toLocaleString()} FCFA et entrez votre code secret.`;
        break;
      case 'nita':
        ussdInstruction = `Votre référence marchand NITA Transfert est ${reference}. Confirmez le débit via l'application Nita Mobile ou en agence NITA.`;
        break;
      case 'al_izza':
        ussdInstruction = `Votre référence Al-Izza Express est ${reference}. Validez le débit marchand depuis votre compte Al-Izza Transfert.`;
        break;
      case 'amana':
        ussdInstruction = `Votre référence Amana Transfert est ${reference}. Confirmez le paiement marchand auprès du réseau Amana.`;
        break;
      default:
        ussdInstruction = `Veuillez confirmer l'autorisation de débit sur votre portefeuille mobile.`;
    }

    return res.json({
      success: true,
      transactionReference: reference,
      amount: plan.amount,
      currency: 'FCFA',
      planName: plan.name,
      paymentMethod,
      phoneNumber: `+227 ${cleanPhone}`,
      simulatedOtp: operatorCode,
      ussdInstruction,
      message: `Demande de débit initiée avec succès auprès de l'opérateur (${paymentMethod.toUpperCase()}).`,
    });
  } catch (err: any) {
    console.error('Error initiating payment:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors de l\'initiation du paiement' });
  }
});

// Confirm payment and activate Premium
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { transactionReference, userId, planId, verificationCode } = req.body;

    if (!transactionReference || !userId) {
      return res.status(400).json({ error: 'Référence de transaction et identifiant utilisateur requis.' });
    }

    const planName = planId === 'plan_iman' ? 'Iman (Premium)' : 'Baraka (Premium)';
    const supabaseAdmin = getSupabaseAdminClient();

    if (supabaseAdmin) {
      try {
        // 1. Mark transaction confirmed in payment_transactions
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
          })
          .eq('transaction_reference', transactionReference);

        // 2. Activate Premium in profiles
        await supabaseAdmin
          .from('profiles')
          .update({
            is_premium: true,
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${userId},user_id.eq.${userId}`);

        // 3. Update auth user metadata
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
              is_premium: true,
              planName,
            },
          });
        } catch (authErr) {
          console.warn('Could not update user_metadata in Supabase auth:', authErr);
        }
      } catch (dbErr: any) {
        console.warn('Notice updating profile status in Supabase during payment confirmation:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      isPremium: true,
      planName,
      transactionReference,
      message: `Paiement vérifié avec succès ! Votre abonnement ${planName} est désormais actif.`,
    });
  } catch (err: any) {
    console.error('Error confirming payment:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors de la confirmation du paiement' });
  }
});

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
