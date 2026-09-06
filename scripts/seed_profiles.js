import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const sb = createClient(url, key);

const PROFILES_TO_SEED = [
  // --- SŒURS (FEMMES) INSCRITES ---
  {
    email: 'fatima.zahra@nassib.ne',
    name: 'Fatima Zahra Al-Hassan',
    age: 23,
    profession: 'Enseignante en Lettres & Arabe',
    city: 'Niamey (Plateau)',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Master 1',
    match_percentage: 95,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&auto=format&fit=crop&q=80',
    bio: 'Jeune femme pieuse attachée aux valeurs traditionnelles et islamiques. Je recherche un frère sincère, pratiquant, travailleur et respectueux des droits conjugaux en Islam.',
    wali_reference: '+227 90 45 12 78 (Oncle maternel)',
    gender: 'female',
    views_count: 32,
    likes_count: 12,
    personality: 'Douce, organisée et pieuse',
    family_importance: 'Priorité absolue au quotidien',
  },
  {
    email: 'aichatou.mahamadou@nassib.ne',
    name: 'Aïchatou Mahamadou',
    age: 25,
    profession: 'Médecin généraliste',
    city: 'Maradi (Centre)',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: "Doctorat d'État en Médecine",
    match_percentage: 92,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    bio: 'Médecin passionnée par ma vocation et investie dans ma foi. Je souhaite fonder un foyer paisible (Sakinah) fondé sur l’amour sincère et la miséricorde mutuelle.',
    wali_reference: '+227 96 11 22 33 (Père)',
    gender: 'female',
    views_count: 45,
    likes_count: 18,
    personality: 'Bienveillante, posée et déterminée',
    family_importance: 'Le pilier de la réussite',
  },
  {
    email: 'mariama.idrissa@nassib.ne',
    name: 'Mariama Idrissa',
    age: 22,
    profession: 'Étudiante en Gestion & Économie',
    city: 'Niamey (Goudel)',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Licence 3',
    match_percentage: 90,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    bio: 'Calme, discrète et respectueuse de la Sunnah. Je privilégie l’entente, l’écoute et l’entraide dans la voie d’Allah. Démarche transparente avec contact direct de mon tuteur.',
    wali_reference: '+227 91 88 77 66 (Père)',
    gender: 'female',
    views_count: 28,
    likes_count: 9,
    personality: 'Calme, réservée et souriante',
    family_importance: 'Priorité absolue au quotidien',
  },
  {
    email: 'nafissatou.abdou@nassib.ne',
    name: 'Nafissatou Abdourahamane',
    age: 27,
    profession: "Juriste d'entreprise",
    city: 'Zinder (Birni)',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Master 2 en Droit des Affaires',
    match_percentage: 89,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=600&auto=format&fit=crop&q=80',
    bio: 'Attachée à nos traditions nobles du Damagaram et aux préceptes coraniques. La prière à l’heure, l’honnêteté et l’attention mutuelle sont indispensables à un mariage béni.',
    wali_reference: '+227 97 33 44 55 (Grand-frère)',
    gender: 'female',
    views_count: 38,
    likes_count: 14,
    personality: 'Réfléchie, généreuse et structurée',
    family_importance: 'Indispensable pour l’équilibre',
  },
  {
    email: 'hadiza.moussa@nassib.ne',
    name: 'Hadiza Moussa',
    age: 24,
    profession: "Sage-femme d'État",
    city: 'Tahoua',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Licence Professionnelle en Santé',
    match_percentage: 91,
    is_verified_nni: false,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    bio: 'Croyante, serviable et patiente. Je recherche un époux pieux, travailleur et compréhensif pour cheminer ensemble main dans la main vers la satisfaction d’Allah.',
    wali_reference: '+227 92 55 66 77 (Père)',
    gender: 'female',
    views_count: 19,
    likes_count: 7,
    personality: 'Patiente, chaleureuse et dévouée',
    family_importance: 'La base de tout accomplissement',
  },
  {
    email: 'zalika.salifou@nassib.ne',
    name: 'Zalika Salifou',
    age: 26,
    profession: 'Ingénieure Agronome',
    city: 'Niamey (Koubia)',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Diplôme d’Ingénieur Bac+5',
    match_percentage: 94,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    bio: 'Pleine d’énergie positive, j’accorde une importance majeure à l’éducation islamique et au respect familial. Prête pour un foyer solide, apaisé et bienveillant.',
    wali_reference: '+227 94 22 11 00 (Père)',
    gender: 'female',
    views_count: 51,
    likes_count: 22,
    personality: 'Dynamique, sociable et spirituelle',
    family_importance: 'Priorité absolue au quotidien',
  },
  {
    email: 'balkissa.ousmane@nassib.ne',
    name: 'Balkissa Ousmane',
    age: 28,
    profession: 'Pharmacienne Assistante',
    city: 'Agadez',
    marital_status: 'Veuve',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Bac+5 Pharmacie',
    match_percentage: 88,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    bio: 'Maturité, sérénité et tawakkul en Allah. Je souhaite reconstruire un foyer digne et complice avec un frère d’honneur, équilibré et respectueux des orphelins et de la famille.',
    wali_reference: '+227 98 12 34 56 (Frère aîné)',
    gender: 'female',
    views_count: 26,
    likes_count: 8,
    personality: 'Mûre, apaisante et bienveillante',
    family_importance: 'Le havre de paix',
  },
  {
    email: 'khadidja.souley@nassib.ne',
    name: 'Khadidja Souley',
    age: 21,
    profession: 'Comptable Junior',
    city: 'Dosso',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'BTS Finance-Comptabilité',
    match_percentage: 87,
    is_verified_nni: false,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    bio: 'Discrète, pudique et très respectueuse. Recherche un frère équilibré, travailleur et assidu à la prière collective pour un projet de mariage conforme à la charia.',
    wali_reference: '+227 93 45 67 89 (Père)',
    gender: 'female',
    views_count: 21,
    likes_count: 6,
    personality: 'Douce, discrète et méthodique',
    family_importance: 'Priorité absolue au quotidien',
  },

  // --- FRÈRES (HOMMES) INSCRITS ---
  {
    email: 'ibrahim.soumana@nassib.ne',
    name: 'Ibrahim Soumana',
    age: 28,
    profession: 'Ingénieur Réseaux & Télécoms',
    city: 'Niamey (Yantala)',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Master 2',
    match_percentage: 96,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    bio: 'Homme sérieux, soucieux de préserver sa foi et de concrétiser le mariage conformément à la Sunnah. J’accorde une haute importance à la bienveillance et au respect du tuteur.',
    wali_reference: '+227 90 22 33 44',
    gender: 'male',
    views_count: 40,
    likes_count: 15,
    personality: 'Responsable, pieux et à l’écoute',
    family_importance: 'Priorité absolue au quotidien',
  },
  {
    email: 'abdoulaye.kountche@nassib.ne',
    name: 'Abdoulaye Kountché',
    age: 31,
    profession: 'Entrepreneur Agro-pastoral',
    city: 'Maradi',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Licence en Économie',
    match_percentage: 91,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    bio: 'Travailleur, posé et pratiquant régulier. Prêt pour un engagement ferme et responsable sous la bénédiction des deux familles pour fonder un foyer durable.',
    wali_reference: '+227 96 44 55 66',
    gender: 'male',
    views_count: 35,
    likes_count: 11,
    personality: 'Pragmatique, travailleur et sincère',
    family_importance: 'Socle de vie essentiel',
  },
  {
    email: 'mahamadou.danbao@nassib.ne',
    name: 'Mahamadou Dan-Bao',
    age: 29,
    profession: 'Cadre Bancaire',
    city: 'Zinder',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Master en Finance Islamique',
    match_percentage: 93,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    bio: 'Valeurs familiales fortes, honnêteté et recherche de la sérénité du foyer. Démarche transparente avec contact immédiat du tuteur légal (Wali).',
    wali_reference: '+227 97 88 99 00',
    gender: 'male',
    views_count: 48,
    likes_count: 19,
    personality: 'Poli, rigoureux et attentif',
    family_importance: 'Priorité absolue au quotidien',
  },
  {
    email: 'moustapha.hamani@nassib.ne',
    name: 'Moustapha Hamani',
    age: 26,
    profession: 'Architecte BTP',
    city: 'Tahoua',
    marital_status: 'Célibataire',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Diplôme d’Architecte Bac+5',
    match_percentage: 90,
    is_verified_nni: false,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    bio: 'Créatif, calme et très attaché à la famille. Je cherche une sœur pieuse, instruite et bienveillante pour partager les projets de cette vie et de l’au-delà.',
    wali_reference: '+227 92 11 33 55',
    gender: 'male',
    views_count: 29,
    likes_count: 8,
    personality: 'Créatif, calme et respectueux',
    family_importance: 'Essentiel et précieux',
  },
  {
    email: 'souleymane.boubacar@nassib.ne',
    name: 'Souleymane Boubacar',
    age: 33,
    profession: 'Enseignant-Chercheur Universitaire',
    city: 'Niamey (Plateau)',
    marital_status: 'Divorcé (Sans enfant)',
    religion: 'Sunnite (Rite Malékite)',
    education: 'Doctorat',
    match_percentage: 88,
    is_verified_nni: true,
    is_wali_approved: true,
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
    bio: 'Esprit posé, maturité et sens des responsabilités. Je recherche une compagne de foi pour une alliance basée sur la dignité, l’amour et la miséricorde mutuelle.',
    wali_reference: '+227 90 77 88 99',
    gender: 'male',
    views_count: 31,
    likes_count: 10,
    personality: 'Mûr, pédagogue et bienveillant',
    family_importance: 'Priorité absolue au quotidien',
  },
];

async function seed() {
  console.log('Seeding profiles into Supabase...');

  for (const prof of PROFILES_TO_SEED) {
    try {
      // 1. Check if user already exists
      const { data: listData } = await sb.auth.admin.listUsers();
      let user = listData?.users?.find((u) => u.email?.toLowerCase() === prof.email.toLowerCase());

      if (!user) {
        const { data: created, error: uErr } = await sb.auth.admin.createUser({
          email: prof.email,
          password: 'Password123!',
          email_confirm: true,
          user_metadata: {
            name: prof.name,
            gender: prof.gender,
            role: 'candidate',
            phone: prof.wali_reference,
          },
        });
        if (uErr) {
          console.warn(`User creation error for ${prof.email}:`, uErr.message);
          continue;
        }
        user = created.user;
      }

      if (!user) continue;

      // 2. Upsert into public.profiles
      const { error: pErr } = await sb.from('profiles').upsert(
        {
          user_id: user.id,
          name: prof.name,
          age: prof.age,
          profession: prof.profession,
          city: prof.city,
          marital_status: prof.marital_status,
          religion: prof.religion,
          education: prof.education,
          match_percentage: prof.match_percentage,
          is_verified_nni: prof.is_verified_nni,
          is_wali_approved: prof.is_wali_approved,
          is_premium: prof.is_premium,
          photo_url: prof.photo_url,
          photo_private: false,
          bio: prof.bio,
          wali_reference: prof.wali_reference,
          gender: prof.gender,
          views_count: prof.views_count,
          likes_count: prof.likes_count,
          personality: prof.personality,
          family_importance: prof.family_importance,
        },
        { onConflict: 'user_id' }
      );

      if (pErr) {
        console.warn(`Profile upsert error for ${prof.name}:`, pErr.message);
      } else {
        console.log(`✓ Seeded ${prof.gender}: ${prof.name} (${prof.city})`);
      }
    } catch (e) {
      console.error(`Exception seeding ${prof.name}:`, e);
    }
  }

  console.log('Seeding finished successfully!');
}

seed();
