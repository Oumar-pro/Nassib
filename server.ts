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
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;
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

// ==========================================
// SUPABASE AUTH & USER PERSISTENCE ENDPOINTS
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, role, gender } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(500).json({ error: "Supabase n'est pas configuré sur le serveur." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let userId: string;
    let createdUser: any = null;

    // 1. Create in auth.users
    if (sb.auth && sb.auth.admin) {
      const { data: adminData, error: adminErr } = await sb.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || 'Membre NASSIB',
          phone: phone || '',
          role: role || 'candidate',
          gender: gender || 'female',
        },
      });

      if (adminErr) {
        return res.status(400).json({ error: adminErr.message });
      }
      userId = adminData.user.id;
      createdUser = adminData.user;
    } else {
      const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name || 'Membre NASSIB',
            phone: phone || '',
            role: role || 'candidate',
            gender: gender || 'female',
          },
        },
      });
      if (signUpErr) {
        return res.status(400).json({ error: signUpErr.message });
      }
      if (!signUpData.user) {
        return res.status(400).json({ error: 'Échec de création du compte.' });
      }
      userId = signUpData.user.id;
      createdUser = signUpData.user;
    }

    // 2. Upsert into public.profiles
    try {
      await sb.from('profiles').upsert(
        [
          {
            user_id: userId,
            name: name || 'Membre NASSIB',
            age: 25,
            profession: 'Non renseigné',
            city: 'Niamey',
            marital_status: 'Célibataire',
            religion: 'Sunnite',
            education: 'Licence / Bac+3',
            match_percentage: 90,
            is_verified_nni: false,
            is_wali_approved: false,
            is_premium: true,
            gender: gender || 'female',
            wali_reference: phone || 'Non renseigné',
            bio: `Bienvenue sur le profil de ${name || 'Membre NASSIB'}. Démarche sérieuse avec intention de mariage éthique.`,
          },
        ],
        { onConflict: 'user_id' }
      );
    } catch (profErr) {
      console.warn('Profile upsert warning:', profErr);
    }

    // 3. Optional fallback upsert into public.users if table exists
    try {
      await sb.from('users').upsert([
        {
          id: userId,
          email: normalizedEmail,
          name: name || 'Membre NASSIB',
          phone: phone || '',
          role: role || 'candidate',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (_) {}

    return res.json({
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        name: name || 'Membre NASSIB',
        phone: phone || '',
        role: role || 'candidate',
        gender: gender || 'female',
        createdAt: createdUser?.created_at || new Date().toISOString(),
        isPremium: true,
        planName: 'Accès Gratuit & Illimité',
        isVerifiedNNI: false,
        isWaliApproved: false,
      },
    });
  } catch (err: any) {
    console.error('Register API error:', err);
    return res.status(500).json({ error: err.message || "Erreur serveur lors de l'inscription." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(500).json({ error: "Supabase n'est pas configuré sur le serveur." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInErr || !signInData?.user) {
      return res.status(401).json({ error: 'Adresse email ou mot de passe incorrect.' });
    }

    const userId = signInData.user.id;
    const { data: profile } = await sb
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const user = {
      id: userId,
      email: normalizedEmail,
      name: profile?.name || signInData.user.user_metadata?.name || 'Membre NASSIB',
      phone: profile?.wali_reference || signInData.user.user_metadata?.phone || '',
      role: signInData.user.user_metadata?.role || 'candidate',
      gender: profile?.gender || signInData.user.user_metadata?.gender || 'female',
      createdAt: signInData.user.created_at,
      isPremium: true,
      planName: 'Accès Gratuit & Illimité',
      isVerifiedNNI: Boolean(profile?.is_verified_nni),
      isWaliApproved: Boolean(profile?.is_wali_approved),
      photoUrl: profile?.photo_url,
    };

    return res.json({
      success: true,
      session: signInData.session,
      user,
    });
  } catch (err: any) {
    console.error('Login API error:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur lors de la connexion.' });
  }
});

app.post('/api/auth/update-profile', async (req, res) => {
  try {
    const { userId, updates } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID requis.' });
    }

    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(500).json({ error: "Supabase n'est pas configuré." });
    }

    const { data, error } = await sb
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ success: true, profile: data });
  } catch (err: any) {
    console.error('Update profile API error:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur.' });
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
