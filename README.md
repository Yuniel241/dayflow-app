# 🌿 DayFlow — Application de planification intelligente

Application web fullstack pour étudiant avec emploi du temps chargé.  
Inspirée du dashboard Task Tracker avec vue hebdomadaire, suivi des tâches et statistiques.

**Stack** : React 18 + Vite | Express + Mongoose | FastAPI + ML | Google OAuth 2.0

---

## 🗂️ Structure du projet

```
dayflow-app/
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── api/         # Axios instance
│   │   ├── components/  # Layout, DayColumn, DonutChart, WeekBarChart, WeeklyReflection, Avatar
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # Dashboard, Activities, Stats, Login, Landing, AuthCallback
│   │   └── utils/       # dates.js, icons.jsx
│   ├── vite.config.js
│   └── package.json
│
├── server/              # Backend Express + Mongoose
│   ├── config/          # db.js, passport.js
│   ├── middleware/      # auth.js (JWT middleware)
│   ├── models/          # User, Activity, Planning, Feedback, UserPattern, PlanningCache
│   ├── routes/          # auth, activities, planning, stats, motivation
│   ├── services/        # planningService, mlPlanningService, feedbackService, mlApiService
│   ├── index.js
│   ├── .env.example
│   └── package.json
│
├── ml-api/              # ML API FastAPI + Python
│   ├── main.py          # FastAPI app (planning heuristique/ML)
│   ├── .venv/           # Python virtual env
│   └── requirements.txt
│
└── package.json (scripts racine)
```

---

## 🚀 Installation et démarrage

### 1️⃣ Cloner et installer les dépendances

```bash
# Depuis la racine
npm run install:all

# Ou manuellement
cd server && npm install
cd ../client && npm install
# Voir section ML API pour Python
```

### 2️⃣ Configurer les variables d'environnement

#### Backend (`server/.env`)

Copie `.env.example` et remplis les variables :

```bash
cd server
cp .env.example .env
```

**Variables essentielles** :
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=ton_secret_jwt_tres_long_et_aleatoire
CLIENT_URL=http://localhost:5173

# Google OAuth 2.0
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# ML API (intégration)
ML_API_URL=http://localhost:8000
ML_API_ENABLED=true
ML_API_REQUIRED=false
```

> ⚠️ **Sécurité** : ne commit jamais `.env`. Le fichier `.env.example` doit servir de template.

### 3️⃣ Configurer Google OAuth

1. Va sur https://console.cloud.google.com
2. Crée un projet → APIs & Services → Credentials
3. Crée un "OAuth 2.0 Client ID" (Web application)
4. Ajoute comme Authorized redirect URI :  
   `http://localhost:5000/api/auth/google/callback`
5. Copie Client ID et Client Secret dans `server/.env`

### 4️⃣ Démarrage local (3 terminaux)

#### Terminal 1 — MongoDB (optionnel si déjà running)
```bash
# Si tu utilises Docker :
docker run -d -p 27017:27017 --name dayflow-mongo mongo:latest
```

#### Terminal 2 — Backend
```bash
cd server
npm run dev
# Tourne sur http://localhost:5000
# Health check: GET http://localhost:5000/api/health
```

#### Terminal 3 — Frontend
```bash
cd client
npm run dev
# Tourne sur http://localhost:5173
```

#### Terminal 4 — ML API (optionnel, pour planning heuristique)
```bash
cd ml-api
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows:
.\.venv\Scripts\activate

# Installer dépendances
pip install fastapi uvicorn numpy scikit-learn pydantic pymongo

# Lancer
python main.py
# Docs: GET http://localhost:8000/docs
# Status: GET http://localhost:8000/health
```

> **Note** : La ML API est optionnelle. Le backend bascule automatiquement à l'algorithme local si elle est indisponible (voir `ML_API_REQUIRED`).

---

## 📱 Fonctionnalités principales

### 📊 Dashboard (Planning hebdomadaire)
- Vue 7 colonnes (lun → dim) avec drag-and-drop
- Graphique en barres des tâches complétées par jour
- Score de productivité en temps réel (0–100)
- Statistiques : meilleur jour / jour à améliorer
- Regénération dynamique du planning
- Navigation semaine précédente/suivante

### ✅ Gestion des activités
- Créer, modifier, supprimer des activités
- Priorité : haute / moyenne / basse
- Catégories : études, loisirs, projet, routine, sport, autre
- Type : **fixe** (heure imposée) ou **flexible** (adaptable)
- Contraintes : jours ciblés, deadline horaire
- Personnalisation : emoji et couleur

### 🧠 Algorithme intelligent de planning
**Moteurs disponibles** :
1. **ML API** (FastAPI, Python) — source principale si disponible
   - Génération heuristique (ou ML si entraîné)
   - Collecte de feedback utilisateur
   - Adaptation progressive

2. **Fallback local** (Node.js) — automatique si ML indisponible
   - Bloque les créneaux fixes (sommeil, routine, cours, transport)
   - Calcule les créneaux libres
   - Trie les activités par priorité
   - Place les activités intelligemment
   - Respecte les contraintes horaires

**Métadonnées du planning** :
```json
{
  "plannerEngine": "ml-api-heuristic",  // ou "cached", "local-fallback"
  "plannerWarning": null
}
```

### 📈 Statistiques
- Score moyen sur toutes les semaines
- Évolution hebdomadaire (graphique linéaire)
- Taux de complétion par catégorie
- Tendances d'énergie

### 💪 Motivation quotidienne
- Message d'encouragement personnalisé
- Verset biblique du jour (rotatif)

### 🤔 Réflexion hebdomadaire
- Meilleure réussite
- Ce qui a ralenti
- Focus pour la semaine suivante

---

## 👤 Profil utilisateur par défaut

Les paramètres suivants structurent le planning selon l'emploi du temps :

```
Réveil : 05:00
Routine : 30 min
Transport + Cours : 06:00 → 18:00
Transport retour : 18:00 → 20:30
Coucher : 22:00
```

**Modifiable via** : `PUT /api/auth/settings`

---

## 🔌 API Endpoints

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/auth/google` | Démarrer OAuth Google |
| GET | `/api/auth/google/callback` | Callback OAuth (génère JWT) |
| GET | `/api/auth/me` | Récupérer profil utilisateur |
| PUT | `/api/auth/settings` | Modifier les horaires (wakeUpTime, etc.) |

### Activités
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/activities` | Lister toutes les activités |
| POST | `/api/activities` | Créer une activité |
| PUT | `/api/activities/:id` | Modifier une activité |
| DELETE | `/api/activities/:id` | Supprimer (soft delete) |

### Planning
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/planning/week/:weekStart` | Récupérer planning de la semaine |
| POST | `/api/planning/generate/:weekStart` | Regénérer le planning |
| PATCH | `/api/planning/:weekStart/:date/slot/:index` | Cocher/décocher une tâche |
| PATCH | `/api/planning/:weekStart/reflection` | Enregistrer la réflexion hebdomadaire |
| GET | `/api/planning/ml-engine-status` | Statut du moteur ML |

### Statistiques & Motivation
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/stats/overview` | Statistiques globales |
| GET | `/api/motivation/daily` | Message + verset du jour |

### Santé
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Health check backend |

---

## 🛠️ Stack technique

### Frontend
- **React** 18.2.0 — UI composants
- **Vite** 4.4.0 — build ultra-rapide
- **React Router** 6.14.1 — navigation client-side
- **Axios** 1.4.0 — requêtes HTTP
- **Recharts** 2.7.2 — graphiques (barres, courbes, donuts)
- **lucide-react** 1.8.0 — icônes
- **lottie-react** 2.4.1 — animations

### Backend
- **Express** 4.18.2 — serveur HTTP
- **Mongoose** 7.3.1 — ODM MongoDB
- **Passport** 0.6.0 + **passport-google-oauth20** — OAuth Google
- **jsonwebtoken** 9.0.0 — JWT middleware
- **dotenv** 16.0.3 — variables d'environnement
- **cors** 2.8.5 — cross-origin requests
- **express-validator** 7.0.1 — validation entrées
- **bcryptjs** 2.4.3 — hash passwords (optionnel)
- **nodemon** (dev) — auto-reload

### ML API
- **FastAPI** — framework web async Python
- **Uvicorn** — serveur ASGI
- **Pydantic** v2 — validation schemas
- **numpy** — calculs numériques
- **scikit-learn** — RandomForest + scaling
- **pymongo** — accès MongoDB

### Base de données
- **MongoDB** — stockage planning, activités, users, feedback

---

## 🌐 Déploiement

### Backend → Railway / Heroku
```bash
# 1. Crée un compte Railway (railway.app) ou Heroku
# 2. Push depuis GitHub → auto-build
# 3. Ajoute variables d'environnement :
#    MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, etc.
# 4. Deploy
```

### Frontend → Vercel / Netlify
```bash
cd client
npm run build

# Vercel:
# 1. vercel.com → Import repo
# 2. Root directory = client
# 3. Env variable: VITE_API_URL=https://ton-backend.railway.app
```

**Checklist production** :
- [ ] Secrets rotés (Google OAuth, JWT)
- [ ] `.env` dans `.gitignore`
- [ ] CORS configuré (CLIENT_URL unique)
- [ ] MONGO_URI pointant DB de prod
- [ ] ML_API_REQUIRED=false (recommandé)
- [ ] Logs + monitoring en place

---

## � Architecture de la ML

DayFlow intègre **deux moteurs de planning** :

### 1. ML API (FastAPI)
- Service **secondaire** exécutant sur port 8000
- Génère planning via heuristique (ou ML trained si modèle disponible)
- Collecte feedback utilisateur pour amélioration progressive
- Enrichit Planning avec métadonnées ML (`mlScore`, `suggestedTime`, etc.)

**Appel depuis backend** :
```
Backend (Node) → ML API → Algo heuristique → Planning enrichi
```

### 2. Fallback Local (Node.js)
- **Toujours disponible**, implémenté dans `server/services/planningService.js`
- Utilisé si :
  - ML API down
  - ML_API_REQUIRED=false (recommandé prod)
  - Erreur lors de l'appel ML

**Sélection automatique** :
```javascript
plannerEngine = "ml-api-heuristic"  // Normal
plannerEngine = "local-fallback"    // Fallback après erreur
plannerEngine = "cached"            // Planning inchangé depuis cache
```

---

## 🗄️ Modèles de données (MongoDB)

### User
```javascript
{
  googleId, name, email, picture,
  // Planning habits
  wakeUpTime, sleepTime, courseEndTime, arrivalTime
}
```

### Activity
```javascript
{
  name, duration (minutes), priority (1–3), category,
  type: "fixe" | "flexible",
  startTime/endTime (si fixe),
  days: [lun, mar, ...],
  deadline: "HH:MM",
  icon, emoji
}
```

### Planning
```javascript
{
  weekStart: "YYYY-MM-DD",
  days: [{
    date, 
    slots: [{
      activityId, name, category, color, icon,
      startTime, endTime, duration,
      done, skipped,
      // ML metadata
      mlScore, suggestedTime, needsOptimization
    }],
    reflection: { bestAchievement, whatSlowed, nextWeekFocus }
  }],
  productivityScore: 0–100,
  weeklyReflection: { ... }
}
```

### Feedback (collecte ML)
```javascript
{
  userId, weekStart,
  activitySlotId,
  userRating, actualDuration, comment
}
```

### UserPattern (patterns locaux)
```javascript
{
  userId,
  energyLevels: { lun: [], mar: [], ... },
  activitySuccessRates: { "études": 0.85, ... },
  preferredTimeSlots: { ... }
}
```

---

## ⚠️ Points d'attention (à connaître)

### Sécurité
- ✅ JWT middleware sur routes protégées
- ❌ **À faire** : validation stricte des entrées (priority, category, deadline)
- ❌ **À faire** : rate-limiting sur `/auth`, `/planning/generate`
- 🔐 **Critique** : secrets en `.env` (ne jamais commiter)

### Performance
- Regénération planning déclenche appels HTTP (ML API ou local)
- Si l'utilisateur modifie plusieurs activités → debounce recommandé
- Cache Planning en DB pour éviter recalculs inutiles

### Intégration ML
- **Divergence possible** : formats `deadline` interprétés différemment entre Node/Python
- **À harmoniser** : weekStart (lundi ISO YYYY-MM-DD), format time (HH:MM)
- Metadata `plannerWarning` affichée côté frontend si fallback

### Stabilité
- ML_API_REQUIRED=**false** en production (fallback si ML down)
- Health checks : `/api/health` et `/api/planning/ml-engine-status`
- Monitoring recommandé : logs + alertes si ML API indisponible

---

## 📚 Documentation complète

Pour les détails d'architecture, flux applicatif, et configuration avancée, voir :
- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Architecture complète, tous endpoints, schémas Mongoose
- **[Audit_Global.md](./Audit_Global.md)** — État du projet, recommendations finalisation, sécurité

---

## 📌 Améliorations futures (Roadmap)

- [ ] Notifications push (Service Worker)
- [ ] Mode offline (IndexedDB)
- [ ] Export PDF du planning
- [ ] App mobile React Native
- [ ] IA avancée pour l'algo (ML training via feedback)
- [ ] Intégration Google Calendar / Slack
- [ ] CI/CD avec GitHub Actions / Jenkins
- [ ] Tests automatisés (Jest, Vitest, pytest)
- [ ] Docker Compose (one-command setup)

---

*"Tout ce que tu feras, fais-le de tout ton cœur, comme pour le Seigneur." — Colossiens 3:23* 🙏
