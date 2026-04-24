const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

const verses = [
  { text: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
  { text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", ref: "Proverbes 3:5" },
  { text: "Car je connais les projets que j'ai formés sur vous, projets de paix et non de malheur.", ref: "Jérémie 29:11" },
  { text: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.", ref: "Ésaïe 40:31" },
  { text: "Ne te laisse pas vaincre par le mal, mais surmonte le mal par le bien.", ref: "Romains 12:21" },
  { text: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", ref: "Psaumes 27:1" },
  { text: "Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.", ref: "Matthieu 6:33" },
  { text: "Soyez forts et courageux ! Ne soyez pas effrayés, ne vous laissez pas abattre.", ref: "Josué 1:9" },
  { text: "La persévérance doit produire une œuvre complète, afin que vous soyez parfaits et accomplis.", ref: "Jacques 1:4" },
  { text: "Tout ce que tu feras, fais-le de tout ton cœur, comme pour le Seigneur.", ref: "Colossiens 3:23" },
];

const encouragements = [
  "Chaque effort compte. Tu construis quelque chose de grand, brique par brique. 🏗️",
  "La discipline d'aujourd'hui est la liberté de demain. Continue ! 🚀",
  "Tu t'es levé à 5h alors que le monde dormait. Cette discipline est ta superforce. ⚡",
  "Les grandes réalisations commencent toujours par la décision d'essayer. Tu es déjà en chemin ! 🌟",
  "Chaque jour où tu accomplis tes objectifs, tu deviens la meilleure version de toi-même. 💪",
  "Le succès, c'est la somme de petits efforts répétés jour après jour. Tu es sur la bonne voie ! 🎯",
  "Ne regarde pas combien de chemin il reste. Regarde combien tu as déjà parcouru. 🏆",
];

router.get('/daily', protect, (req, res) => {
  const dayIndex = new Date().getDay();
  const verse = verses[dayIndex % verses.length];
  const encouragement = encouragements[dayIndex % encouragements.length];
  res.json({ success: true, verse, encouragement });
});

module.exports = router;
