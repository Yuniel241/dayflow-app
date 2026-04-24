# 🌿 DayFlow — Application de planification intelligente

Application web fullstack pour étudiant avec emploi du temps chargé.
Inspirée du dashboard Task Tracker avec vue hebdomadaire, suivi des tâches et statistiques.

---

## 🗂️ Structure du projet

```
dayflow/
├── client/          # Frontend React + Vite
│   └── src/
│       ├── api/         # axios instance
│       ├── components/  # DayColumn, DonutChart, WeekBarChart...
│       ├── context/     # AuthContext
│       ├── pages/       # Dashboard, Activities, Stats
│       └── utils/       # dates, colors
│
└── server/          # Backend Express
    ├── config/      # db.js, passport.js
    ├── middleware/  # auth JWT
    ├── models/      # User, Activity, Planning
    ├── routes/      # auth, activities, planning, stats, motivation
    └── services/    # planningService (algo intelligent)
```

---

## 🚀 Installation

### 1. Cloner et installer

```bash
# Installer les dépendances
cd server && npm install
cd ../client && npm install
```

### 2. Configurer le backend

```bash
cd server
cp .env.example .env
# Éditer .env avec tes valeurs
```

Variables nécessaires :
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=ton_secret_jwt_tres_long
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
CLIENT_URL=http://localhost:5173
```

### 3. Configurer Google OAuth

1. Va sur https://console.cloud.google.com
2. Crée un projet → APIs & Services → Credentials
3. Crée un "OAuth 2.0 Client ID" (Web application)
4. Ajoute comme Authorized redirect URI : `http://localhost:5000/api/auth/google/callback`
5. Copie Client ID et Client Secret dans `.env`

### 4. Lancer le projet

**Terminal 1 — Backend :**
```bash
cd server
npm run dev
# Tourne sur http://localhost:5000
```

**Terminal 2 — Frontend :**
```bash
cd client
npm run dev
# Tourne sur http://localhost:5173
```

---

## 📱 Fonctionnalités

### Dashboard (Planning hebdomadaire)
- Vue 7 colonnes (lun → dim) inspirée du screenshot
- Graphique barres des tâches complétées
- Score de productivité en temps réel
- Meilleur jour / jour à améliorer
- Regénération du planning
- Navigation semaine précédente/suivante

### Gestion des activités
- Créer, modifier, supprimer des activités
- Priorité (haute/moyenne/basse)
- Catégories : études, loisirs, projet, routine, sport, autre
- Type fixe (heure imposée) ou flexible
- Jours de la semaine ciblés
- Emoji et couleur personnalisables

### Algorithme intelligent
Le `PlanningService` :
1. Bloque les créneaux fixes (sommeil, routine, cours, transport)
2. Calcule les créneaux libres
3. Trie les activités par priorité
4. Place les activités dans les créneaux disponibles
5. Respecte les contraintes horaires (deadline)

### Statistiques
- Score moyen sur toutes les semaines
- Évolution hebdomadaire (graphique linéaire)
- Taux de complétion par catégorie

### Motivation quotidienne
- Message d'encouragement personnalisé
- Verset biblique du jour (rotatif selon le jour de la semaine)

### Réflexion hebdomadaire
- Meilleure réussite
- Ce qui a ralenti
- Focus semaine suivante

---

## 🗓️ Profil utilisateur par défaut

```
Réveil : 05:00
Routine : 30 min
Transport + Cours : 06:00 → 18:00
Transport retour : 18:00 → 20:30
Coucher : 22:00
```

Modifiable via `PUT /api/auth/settings`

---

## 🌐 Déploiement

### Backend → Railway
```bash
# 1. Crée un compte Railway (railway.app)
# 2. New Project → Deploy from GitHub
# 3. Add variables d'environnement dans Railway
# 4. Le serveur se déploie automatiquement
```

### Frontend → Vercel
```bash
cd client
npm run build
# 1. Crée un compte Vercel (vercel.com)
# 2. Import GitHub repo → set root directory = client
# 3. Add env variable: VITE_API_URL=https://ton-backend.railway.app
```

> ⚠️ En production, mettre à jour `CLIENT_URL` dans le backend et le `proxy` dans vite.config.js

---

## 🔌 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/auth/google | Lancer OAuth Google |
| GET | /api/auth/me | Profil utilisateur |
| PUT | /api/auth/settings | Modifier les horaires |
| GET | /api/activities | Liste des activités |
| POST | /api/activities | Créer une activité |
| PUT | /api/activities/:id | Modifier |
| DELETE | /api/activities/:id | Supprimer (soft) |
| GET | /api/planning/week/:weekStart | Planning semaine |
| POST | /api/planning/generate/:weekStart | Regénérer |
| PATCH | /api/planning/:weekStart/:date/slot/:i | Cocher une tâche |
| PATCH | /api/planning/:weekStart/reflection | Réflexion |
| GET | /api/stats/overview | Statistiques |
| GET | /api/motivation/daily | Verset + encouragement |

---

## 🛠️ Stack technique

- **Frontend** : React 18, Vite, React Router, Recharts, Axios
- **Backend** : Node.js, Express, Mongoose
- **Base de données** : MongoDB
- **Auth** : Google OAuth 2.0 + JWT
- **Fonts** : Plus Jakarta Sans + Space Mono

---

## 📌 Améliorations futures

- [ ] Notifications push (Service Worker)
- [ ] Mode offline
- [ ] Export PDF du planning
- [ ] App mobile React Native
- [ ] IA avancée pour l'algo de planning (ML)
- [ ] Intégration Google Calendar
- [ ] CI/CD avec Jenkins

---

*"Tout ce que tu feras, fais-le de tout ton cœur, comme pour le Seigneur." — Colossiens 3:23* 🙏
