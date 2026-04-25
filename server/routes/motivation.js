const express = require('express');
const { protect } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// ─── BASE LOCALE (fallback garanti) ─────────────────────────────────────────

const LOCAL_VERSES = [
  { text: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
  { text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", ref: "Proverbes 3:5" },
  { text: "L'Éternel est mon berger, je ne manquerai de rien.", ref: "Psaumes 23:1" },
  { text: "Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets.", ref: "Ésaïe 41:10" },
  { text: "Tout ce que ta main trouve à faire, fais-le de toute ta force.", ref: "Ecclésiaste 9:10" },
  { text: "Le cœur de l'homme médite sa voie, mais c'est l'Éternel qui affermit ses pas.", ref: "Proverbes 16:9" },
  { text: "Attends-toi à l'Éternel, fortifie-toi et que ton cœur s'affermisse.", ref: "Psaumes 27:14" },
  { text: "Ce n'est point par la puissance ni par la force, mais c'est par mon esprit.", ref: "Zacharie 4:6" },
  { text: "Je te rendrai sage, je t'indiquerai la voie que tu dois suivre.", ref: "Psaumes 32:8" },
  { text: "Car nous marchons par la foi, et non par la vue.", ref: "2 Corinthiens 5:7" },
  { text: "Dieu n'a pas donné un esprit de crainte, mais de force, d'amour et de sagesse.", ref: "2 Timothée 1:7" },
  { text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu.", ref: "Philippiens 4:6" },
  { text: "Toutes choses concourent au bien de ceux qui aiment Dieu.", ref: "Romains 8:28" },
  { text: "Celui qui est fidèle dans les moindres choses l'est aussi dans les grandes.", ref: "Luc 16:10" },
  { text: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", ref: "Psaumes 27:1" },
  { text: "Cherchez premièrement le royaume et la justice de Dieu.", ref: "Matthieu 6:33" },
  { text: "Soyez forts et courageux ! Ne soyez pas effrayés.", ref: "Josué 1:9" },
  { text: "La persévérance doit produire une œuvre complète.", ref: "Jacques 1:4" },
  { text: "Tout ce que vous voulez que les hommes fassent pour vous, faites-le de même pour eux.", ref: "Matthieu 7:12" },
  { text: "Approchons-nous avec assurance du trône de la grâce.", ref: "Hébreux 4:16" },
  { text: "Le commencement de la sagesse, c'est la crainte de l'Éternel.", ref: "Psaumes 111:10" },
  { text: "Celui qui veille sur sa bouche garde son âme.", ref: "Proverbes 13:3" },
  { text: "Que votre lumière luise devant les hommes, afin qu'ils voient vos bonnes œuvres.", ref: "Matthieu 5:16" },
  { text: "Je sais en qui j'ai cru, et je suis persuadé qu'il a la puissance.", ref: "2 Timothée 1:12" },
  { text: "L'amour est patient, il est plein de bonté; l'amour n'est pas envieux.", ref: "1 Corinthiens 13:4" },
  { text: "Que la parole de Christ habite parmi vous abondamment.", ref: "Colossiens 3:16" },
  { text: "Mieux vaut un peu avec la justice qu'un grand revenu avec l'injustice.", ref: "Proverbes 16:8" },
  { text: "Je vous ai parlé de ces choses, afin que vous ayez la paix en moi.", ref: "Jean 16:33" },
  { text: "Sois plus fort que tes excuses, plus grand que tes peurs.", ref: "Proverbes 24:10" },
];

const LOCAL_ENCOURAGEMENTS = [
  "Chaque effort compte. Tu construis quelque chose de grand, brique par brique. 🏗️",
  "La discipline d'aujourd'hui est la liberté de demain. Continue ! 🚀",
  "Tu as surmonté ta zone de confort. Cette discipline est ta superforce. ⚡",
  "Les grandes réalisations commencent toujours par la décision d'essayer. 🌟",
  "Le succès, c'est la somme de petits efforts répétés jour après jour. 🎯",
  "La constance bat l'intensité. Chaque petit pas te rapproche du but. 👣",
  "Aujourd'hui est une nouvelle opportunité d'être meilleur qu'hier. 🌅",
  "Tu es le seul responsable de ta réussite. Prends les rênes ! 🎪",
  "N'attends pas le moment parfait, crée-le. Action maintenant ! ⏰",
  "Ce que tu fais aujourd'hui peut améliorer tous tes lendemains. 📈",
  "Chaque défi est une opportunité déguisée. Relève-le ! 💪",
  "L'échec n'est pas la chute, c'est refuser de se relever. 🌱",
  "Tes limites ne sont que des illusions. Pousse-les plus loin. 🔥",
  "Dieu ne t'appellerait pas à quelque chose sans t'équiper pour y arriver. 🙏",
  "La montagne semble infranchissable jusqu'à ce que tu commences à grimper. ⛰️",
  "Les plus grandes victoires viennent après les plus grands combats. 🏆",
  "Chaque jour est une page blanche. Écris une histoire dont tu seras fier. 📖",
  "Travaille comme si tout dépendait de toi, prie comme si tout dépendait de Dieu. ✨",
  "Ne compare pas ton chapitre 1 au chapitre 20 de quelqu'un d'autre. 📚",
  "La persévérance est la clé qui ouvre toutes les portes. 🔑",
  "Le meilleur investissement que tu puisses faire, c'est en toi-même. 💎",
  "Les petits progrès chaque jour mènent à de grands résultats. 📊",
  "La qualité de ta vie dépend de la qualité de tes habitudes. 🔄",
  "Sois plus fort que tes excuses. 💪",
  "Garde tes yeux sur l'objectif, même quand le chemin est difficile. 🎯",
];

// ─── Sélection déterministe selon la date ────────────────────────────────────

const getDailyIndex = (arrayLength, offset = 0) => {
  const [y, m, d] = new Date().toISOString().split('T')[0].split('-').map(Number);
  return ((y + m * 31 + d * 7 + offset) * 13) % arrayLength;
};

const getLocalVerse = () => LOCAL_VERSES[getDailyIndex(LOCAL_VERSES.length)];
const getLocalEncouragement = () => LOCAL_ENCOURAGEMENTS[getDailyIndex(LOCAL_ENCOURAGEMENTS.length, 3)];

// ─── Traduction via MyMemory (gratuit, pas de clé requise) ───────────────────

const translateToFr = async (text) => {
  if (!text || text.trim() === '') return text;

  // Heuristique : si le texte contient déjà des mots français courants, ne pas traduire
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'un', 'une', 'et', 'est', 'en', 'que', 'qui'];
  const words = text.toLowerCase().split(/\s+/);
  const frenchCount = words.filter(w => frenchWords.includes(w)).length;
  if (frenchCount >= 2) return text; // Déjà en français

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`;
    const { data } = await axios.get(url, { timeout: 4000 });

    if (
      data?.responseStatus === 200 &&
      data?.responseData?.translatedText &&
      !data.responseData.translatedText.includes('MYMEMORY WARNING')
    ) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.warn('⚠️ MyMemory translation failed:', err.message);
  }

  return text; // Retourne l'original si échec
};

// ─── API verset biblique — ourmanna.com ──────────────────────────────────────

const fetchApiVerse = async () => {
  try {
    const { data } = await axios.get('https://ourmanna.com/verses/api/get/?show=json', {
      timeout: 5000,
      headers: { Accept: 'application/json' },
    });

    // La réponse a la forme : { verse: { details: { text, reference, ... } } }
    const details = data?.verse?.details;
    if (!details?.text || !details?.reference) return null;

    const translatedText = await translateToFr(details.text);

    return {
      text: translatedText,
      ref: details.reference,
      source: 'ourmanna',
    };
  } catch (err) {
    console.warn('⚠️ ourmanna API failed:', err.message);
    return null;
  }
};

// ─── API citation — ZenQuotes ────────────────────────────────────────────────

const fetchApiQuote = async () => {
  try {
    const { data } = await axios.get('https://zenquotes.io/api/random', { timeout: 5000 });

    if (!data?.[0]?.q) return null;

    const translatedText = await translateToFr(data[0].q);
    const author = data[0].a && data[0].a !== 'Unknown' ? ` — ${data[0].a}` : '';

    return {
      text: `${translatedText}${author}`,
      source: 'zenquotes',
    };
  } catch (err) {
    console.warn('⚠️ ZenQuotes API failed:', err.message);
    return null;
  }
};

// ─── Route principale ─────────────────────────────────────────────────────────

router.get('/daily', protect, async (req, res) => {
  try {
    // Appels en parallèle, timeout 6s max pour ne pas bloquer le dashboard
    const [apiVerse, apiQuote] = await Promise.allSettled([
      fetchApiVerse(),
      fetchApiQuote(),
    ]);

    const verse =
      (apiVerse.status === 'fulfilled' && apiVerse.value) || getLocalVerse();

    const encouragement =
      (apiQuote.status === 'fulfilled' && apiQuote.value?.text) || getLocalEncouragement();

    return res.json({
      success: true,
      verse,
      encouragement,
      meta: {
        verseSource: verse.source || 'local',
        encouragementSource: apiQuote.value?.source || 'local',
        date: new Date().toISOString().split('T')[0],
      },
    });
  } catch (err) {
    // Ne devrait jamais arriver grâce à Promise.allSettled, mais par sécurité
    console.error('❌ /motivation/daily error:', err.message);
    return res.json({
      success: true,
      verse: getLocalVerse(),
      encouragement: getLocalEncouragement(),
      meta: { fallback: true },
    });
  }
});

// ─── Route stats (debug / info) ───────────────────────────────────────────────

router.get('/stats', protect, (req, res) => {
  res.json({
    success: true,
    totalVerses: LOCAL_VERSES.length,
    totalEncouragements: LOCAL_ENCOURAGEMENTS.length,
    uniqueDays: Math.min(LOCAL_VERSES.length, LOCAL_ENCOURAGEMENTS.length),
  });
});

module.exports = router;