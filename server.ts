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

app.get('/api/profiles', async (req, res) => {
  try {
    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(500).json({ error: "Supabase n'est pas configuré sur le serveur." });
    }

    const { data: profiles, error: pError } = await sb
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) {
      return res.status(400).json({ error: pError.message });
    }

    // Optional photos mapping
    const profileIds = (profiles || []).map((p: any) => p.id).filter(Boolean);
    let photosMap: Record<string, string[]> = {};
    if (profileIds.length > 0) {
      try {
        const { data: photoRows } = await sb
          .from('profile_photos')
          .select('profile_id, storage_path, sort_order')
          .in('profile_id', profileIds)
          .order('sort_order', { ascending: true });

        if (photoRows) {
          for (const row of photoRows) {
            if (!photosMap[row.profile_id]) photosMap[row.profile_id] = [];
            photosMap[row.profile_id].push(row.storage_path);
          }
        }
      } catch (_) {}
    }

    const enriched = (profiles || []).map((item: any) => {
      const photos = photosMap[item.id] || (item.photo_url ? [item.photo_url] : []);
      return {
        id: item.id,
        userId: item.user_id,
        name: item.name,
        age: item.age,
        profession: item.profession || 'Non renseigné',
        city: item.city,
        maritalStatus: item.marital_status,
        religion: item.religion || 'Sunnite',
        education: item.education || '',
        matchPercentage: item.match_percentage ?? 85,
        isVerifiedNNI: Boolean(item.is_verified_nni),
        isWaliApproved: Boolean(item.is_wali_approved),
        isPremium: Boolean(item.is_premium),
        photoUrl: item.photo_url || (photos[0] || ''),
        photoPrivate: Boolean(item.photo_private),
        bio: item.bio || '',
        waliReference: item.wali_reference || '',
        gender: item.gender === 'male' ? 'male' : 'female',
        viewsCount: item.views_count ?? 0,
        likesCount: item.likes_count ?? 0,
        hobbies: item.hobbies || '',
        interests: item.interests || '',
        drinksAlcohol: item.drinks_alcohol ?? false,
        smokes: item.smokes ?? false,
        presentation: item.presentation || '',
        personality: item.personality || '',
        familyImportance: item.family_importance || '',
        isAdmin: Boolean(item.is_admin),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        photos,
      };
    });

    return res.json({ success: true, profiles: enriched });
  } catch (err: any) {
    console.error('API /api/profiles error:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
});

app.post('/api/auth/save-profile', async (req, res) => {
  try {
    const { userId, email, profileData, onboardingData, photos } = req.body;

    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(500).json({ error: "Supabase n'est pas configuré sur le serveur." });
    }

    let targetUserId = userId;

    // 1. Resolve user ID if missing or invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!targetUserId || !uuidRegex.test(targetUserId)) {
      if (email && sb.auth && sb.auth.admin) {
        const { data: listData } = await sb.auth.admin.listUsers();
        const found = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase().trim());
        if (found) {
          targetUserId = found.id;
        } else {
          // Create user if completely missing
          const { data: newUser, error: newErr } = await sb.auth.admin.createUser({
            email: email.toLowerCase().trim(),
            password: 'NassibMember2025!',
            email_confirm: true,
            user_metadata: {
              name: profileData?.name || 'Membre NASSIB',
              phone: profileData?.waliReference || '',
              role: 'candidate',
            },
          });
          if (!newErr && newUser?.user) {
            targetUserId = newUser.user.id;
          }
        }
      }
    }

    if (!targetUserId || !uuidRegex.test(targetUserId)) {
      return res.status(400).json({ error: "Identifiant utilisateur valide (UUID) introuvable pour la base de données." });
    }

    const name = profileData?.name || 'Membre NASSIB';
    const age = Math.min(100, Math.max(18, Number(profileData?.age) || 25));
    const city = profileData?.city || (onboardingData?.region ? `${onboardingData.region}${onboardingData.neighborhood ? ' (' + onboardingData.neighborhood + ')' : ''}` : 'Niamey');
    const gender = profileData?.gender === 'male' || onboardingData?.gender === 'male' ? 'male' : 'female';
    const maritalStatus = profileData?.maritalStatus || onboardingData?.maritalStatus || 'Célibataire (Jamais marié/e)';
    const religion = profileData?.religion || onboardingData?.religion || 'Musulman(e) Sunnite';
    const education = profileData?.education || onboardingData?.education || 'Licence / Bac+3';
    const profession = profileData?.profession || onboardingData?.profession || 'Non renseigné';
    const bio = profileData?.bio || `Membre inscrit (${gender === 'male' ? 'Homme' : 'Femme'}). Démarche sérieuse avec intention de mariage éthique.`;
    const photoUrl = profileData?.photoUrl || (photos && photos.length > 0 ? photos[0] : null);
    const waliReference = profileData?.waliReference || (onboardingData?.waliPhone ? `${onboardingData.waliRelation || 'Wali'} (${onboardingData.waliName || 'Tuteur'} - ${onboardingData.waliPhone})` : null);

    // 2. Update auth.users user_metadata to ensure data is directly in the Users section of Supabase
    try {
      if (sb.auth && sb.auth.admin) {
        await sb.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            name,
            phone: waliReference || '',
            gender,
            age,
            city,
            profession,
            marital_status: maritalStatus,
            religion,
            education,
            onboarding_completed: true,
            photo_url: photoUrl,
          },
        });
      }
    } catch (metaErr) {
      console.warn('Notice updating auth.users user_metadata:', metaErr);
    }

    // 3. Upsert into public.profiles
    const profilePayload = {
      user_id: targetUserId,
      name,
      age,
      profession,
      city,
      marital_status: maritalStatus,
      religion,
      education,
      match_percentage: profileData?.matchPercentage ?? 90,
      is_verified_nni: Boolean(profileData?.isVerifiedNNI),
      is_wali_approved: Boolean(profileData?.isWaliApproved || (onboardingData?.waliName && onboardingData?.waliPhone)),
      is_premium: true,
      photo_url: photoUrl,
      photo_private: Boolean(profileData?.photoPrivate),
      bio,
      wali_reference: waliReference,
      gender,
      views_count: profileData?.viewsCount ?? 0,
      likes_count: profileData?.likesCount ?? 0,
      hobbies: profileData?.hobbies || onboardingData?.interests || null,
      interests: profileData?.interests || onboardingData?.interests || null,
      drinks_alcohol: profileData?.drinksAlcohol ?? false,
      smokes: profileData?.smokes ?? false,
      presentation: profileData?.presentation || (onboardingData?.marriageHorizon ? `Horizon mariage : ${onboardingData.marriageHorizon}` : null),
      personality: profileData?.personality || onboardingData?.personalityTrait || null,
      family_importance: profileData?.familyImportance || onboardingData?.familyImportance || 'Priorité essentielle',
      is_admin: Boolean(profileData?.isAdmin),
      updated_at: new Date().toISOString(),
    };

    const { data: savedProfile, error: profileErr } = await sb
      .from('profiles')
      .upsert([profilePayload], { onConflict: 'user_id' })
      .select()
      .single();

    if (profileErr) {
      console.error('Error upserting public.profiles in /api/auth/save-profile:', profileErr);
      return res.status(400).json({ error: profileErr.message });
    }

    // 4. Save photos to public.profile_photos
    const photosList = photos || (photoUrl ? [photoUrl] : []);
    if (photosList.length > 0 && savedProfile?.id) {
      try {
        await sb.from('profile_photos').delete().eq('profile_id', savedProfile.id);
        const photoInserts = photosList
          .filter((p: string) => Boolean(p) && p.trim() !== '')
          .map((p: string, idx: number) => ({
            profile_id: savedProfile.id,
            user_id: targetUserId,
            storage_path: p,
            sort_order: idx,
            is_primary: idx === 0,
          }));
        if (photoInserts.length > 0) {
          await sb.from('profile_photos').insert(photoInserts);
        }
      } catch (pErr) {
        console.warn('Notice saving profile_photos:', pErr);
      }
    }

    // 5. Save to public.profile_private if wali or private details present
    if (savedProfile?.id && (waliReference || onboardingData?.waliName)) {
      try {
        await sb.from('profile_private').upsert(
          [
            {
              profile_id: savedProfile.id,
              user_id: targetUserId,
              wali_reference: waliReference,
              wali_status: 'submitted',
              nni_status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'user_id' }
        );
      } catch (_) {}
    }

    // 6. Optional upsert into public.users if table exists
    try {
      await sb.from('users').upsert([
        {
          id: targetUserId,
          email: email || '',
          name,
          phone: waliReference || '',
          role: 'candidate',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (_) {}

    return res.json({
      success: true,
      profile: {
        id: savedProfile.id,
        userId: savedProfile.user_id,
        name: savedProfile.name,
        age: savedProfile.age,
        profession: savedProfile.profession,
        city: savedProfile.city,
        maritalStatus: savedProfile.marital_status,
        religion: savedProfile.religion,
        education: savedProfile.education,
        matchPercentage: savedProfile.match_percentage,
        isVerifiedNNI: savedProfile.is_verified_nni,
        isWaliApproved: savedProfile.is_wali_approved,
        isPremium: savedProfile.is_premium,
        photoUrl: savedProfile.photo_url,
        photoPrivate: savedProfile.photo_private,
        bio: savedProfile.bio,
        waliReference: savedProfile.wali_reference,
        gender: savedProfile.gender,
        viewsCount: savedProfile.views_count,
        likesCount: savedProfile.likes_count,
        hobbies: savedProfile.hobbies,
        interests: savedProfile.interests,
        presentation: savedProfile.presentation,
        personality: savedProfile.personality,
        familyImportance: savedProfile.family_importance,
        isAdmin: savedProfile.is_admin,
        createdAt: savedProfile.created_at,
        updatedAt: savedProfile.updated_at,
        photos: photosList,
      },
    });
  } catch (err: any) {
    console.error('Save profile API error:', err);
    return res.status(500).json({ error: err.message || 'Erreur serveur lors de la sauvegarde du profil.' });
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

    // Upsert with onConflict user_id for guaranteed row persistence
    const { data, error } = await sb
      .from('profiles')
      .upsert([{ ...updates, user_id: userId, updated_at: new Date().toISOString() }], { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Also update auth.users user_metadata if available
    try {
      if (sb.auth && sb.auth.admin) {
        await sb.auth.admin.updateUserById(userId, {
          user_metadata: {
            name: updates.name,
            phone: updates.wali_reference,
            gender: updates.gender,
            age: updates.age,
            city: updates.city,
            profession: updates.profession,
            marital_status: updates.marital_status,
            religion: updates.religion,
            education: updates.education,
          },
        });
      }
    } catch (_) {}

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

// Helper to auto-seed initial authentic profiles in Supabase if table is empty
async function seedProfilesIfEmpty() {
  try {
    const sb = getSupabaseServerClient();
    if (!sb) return;

    const { count, error } = await sb.from('profiles').select('*', { count: 'exact', head: true });
    if (error || (count !== null && count > 0)) {
      return;
    }

    console.log('Profiles table is empty, auto-seeding initial Nigerien candidates into Supabase DB...');
    const SEED_CANDIDATES = [
      {
        email: "amina.moussa@nassib.ne",
        phone: "+22790112233",
        name: "Amina Moussa",
        gender: "female",
        age: 24,
        city: "Niamey (Plateau)",
        profession: "Juriste d'entreprise",
        marital_status: "Célibataire (Jamais mariée)",
        religion: "Musulmane Sunnite (Pratiquante)",
        education: "Master 2 Droit Privé",
        photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
        bio: "Sérieuse, pieuse et attachée aux valeurs familiales et islamiques. Je recherche un frère pratiquant, respectueux et responsable pour fonder un foyer paisible selon le Coran et la Sunnah.",
        wali_reference: "+227 90 11 22 33 (Père)",
        hobbies: "Lecture spirituelle, Couture, Cuisine sahélienne",
        personality: "Calme, réfléchie et attentionnée",
        family_importance: "Priorité absolue après la foi",
        match_percentage: 95,
      },
      {
        email: "fatima.boubacar@nassib.ne",
        phone: "+22796445566",
        name: "Fatima-Zahra Boubacar",
        gender: "female",
        age: 27,
        city: "Niamey (Koira Kano)",
        profession: "Docteur en Pharmacie",
        marital_status: "Célibataire (Jamais mariée)",
        religion: "Musulmane Sunnite (Pratiquante)",
        education: "Doctorat d'État en Pharmacie",
        photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
        bio: "Pratiquante, issue d'une famille conservatrice et respectueuse. Je souhaite rencontrer un homme mûr, pieux et ambitieux pour une union bénie.",
        wali_reference: "+227 96 44 55 66 (Grand frère tuteur)",
        hobbies: "Sciences de la santé, Histoire islamique, Écriture",
        personality: "Douce, organisée et pieuse",
        family_importance: "Fondement essentiel de l'équilibre de vie",
        match_percentage: 92,
      },
      {
        email: "ibrahim.kountche@nassib.ne",
        phone: "+22792334455",
        name: "Ibrahim Kountché",
        gender: "male",
        age: 29,
        city: "Niamey (Yantala)",
        profession: "Ingénieur Télécoms",
        marital_status: "Célibataire (Jamais marié)",
        religion: "Musulman Sunnite (Pratiquant)",
        education: "Diplôme d'Ingénieur Bac+5",
        photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
        bio: "Ingénieur en poste à Niamey, prières quotidiennes à la mosquée. Recherche une sœur pieuse, pudique et instruite pour un mariage solide et respectueux.",
        wali_reference: "+227 92 33 44 55",
        hobbies: "Technologies, Football, Récitation coranique",
        personality: "Travailleur, respectueux et protecteur",
        family_importance: "Responsabilité sacrée en tant que futur chef de foyer",
        match_percentage: 94,
      },
      {
        email: "abdoulaye.garba@nassib.ne",
        phone: "+22794556677",
        name: "Abdoulaye Garba",
        gender: "male",
        age: 33,
        city: "Niamey (Francophonie)",
        profession: "Entrepreneur Agro-alimentaire",
        marital_status: "Célibataire (Jamais marié)",
        religion: "Musulman Sunnite",
        education: "Master Management & Commerce",
        photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
        bio: "Homme d'affaires responsable, autonome et très attaché aux valeurs morales et musulmanes. Souhaite rencontrer une future épouse respectueuse.",
        wali_reference: "+227 94 55 66 77",
        hobbies: "Entrepreneuriat, Voyages sahéliens, Équitation",
        personality: "Généreux, décidé et à l'écoute",
        family_importance: "La priorité de mon projet de vie",
        match_percentage: 91,
      }
    ];

    for (const item of SEED_CANDIDATES) {
      if (!sb.auth || !sb.auth.admin) continue;
      let uid;
      const { data: u, error: uErr } = await sb.auth.admin.createUser({
        email: item.email,
        password: "NassibNiger2025!",
        phone: item.phone,
        email_confirm: true,
        user_metadata: {
          name: item.name,
          phone: item.phone,
          role: "candidate",
          gender: item.gender,
          age: item.age,
          city: item.city,
          profession: item.profession,
          onboarding_completed: true,
        },
      });
      if (uErr) {
        const { data: l } = await sb.auth.admin.listUsers();
        const found = l?.users?.find((x: any) => x.email === item.email);
        if (found) uid = found.id;
      } else {
        uid = u.user.id;
      }
      if (!uid) continue;

      const { data: p } = await sb.from('profiles').upsert([
        {
          user_id: uid,
          name: item.name,
          age: item.age,
          profession: item.profession,
          city: item.city,
          marital_status: item.marital_status,
          religion: item.religion,
          education: item.education,
          match_percentage: item.match_percentage,
          is_verified_nni: true,
          is_wali_approved: true,
          is_premium: true,
          photo_url: item.photo_url,
          photo_private: false,
          bio: item.bio,
          wali_reference: item.wali_reference,
          gender: item.gender,
          hobbies: item.hobbies,
          personality: item.personality,
          family_importance: item.family_importance,
          drinks_alcohol: false,
          smokes: false,
          presentation: "Profil vérifié par l'équipe NASSIB.",
        }
      ], { onConflict: 'user_id' }).select().single();

      if (p?.id) {
        try {
          await sb.from('profile_photos').upsert([
            {
              profile_id: p.id,
              user_id: uid,
              storage_path: item.photo_url,
              sort_order: 1,
              is_primary: true,
            }
          ]);
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('Auto-seed notice:', err);
  }
}

async function startServer() {
  await seedProfilesIfEmpty();
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
