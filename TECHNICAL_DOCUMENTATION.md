## DayFlow — Documentation technique (fullstack + ML API)

Ce document décrit **en détail** l’architecture, les composants, les flux applicatifs, les modèles de données, les endpoints, la configuration et les procédures d’exécution/déploiement du projet **DayFlow**.

> **Note sécurité**: ne commitez jamais de secrets. Les exemples ci-dessous utilisent des valeurs fictives.

### 1) Vue d’ensemble

DayFlow est une application fullstack composée de trois services principaux :

- **Frontend** (`client/`) : React 18 + Vite + React Router, UI en composants, appels API via Axios.
- **Backend** (`server/`) : Node.js + Express, MongoDB via Mongoose, Auth Google OAuth2 + JWT, génération de planning + persistance.
- **ML API** (`ml-api/`) : FastAPI (Python), génération de planning “IA” (actuellement heuristique si modèle non entraîné), collecte de feedback, stockage MongoDB (ou fallback mémoire si Mongo indisponible).

Le backend orchestre la génération :
- il tente d’abord la génération via **ML API** (`/api/generate-planning`)
- sinon **fallback** sur l’algorithme local Node (`server/services/planningService.js`) éventuellement enrichi par `mlPlanningService`.

Le backend renvoie à l’UI des métadonnées de provenance :
- `plannerEngine` ∈ `{ cached | ml-api-heuristic | ml-api-trained | local-fallback }`
- `plannerWarning` si fallback.

### 2) Arborescence (résumé)

```text
dayflow-app/
  client/
    src/
      api/index.js
      context/AuthContext.jsx
      pages/ (Dashboard, Activities, Stats, Login, Landing, AuthCallback)
      components/ (Layout, DayColumn, WeekBarChart, WeekInsights, WeeklyReflection, DonutChart, Avatar, ...)
      utils/ (dates.js, icons.jsx, ...)
  server/
    index.js
    config/db.js
    config/passport.js
    middleware/auth.js
    models/ (User, Activity, Planning, Feedback, UserPattern, PlanningCache)
    routes/ (auth, activities, planning, stats, motivation)
    services/ (planningService, mlPlanningService, feedbackService, mlApiService)
    .env / .env.example
  ml-api/
    main.py
    .venv/ (local)
  package.json (scripts racine)
```

### 3) Technologies et dépendances

#### 3.1 Frontend
- React 18, React DOM
- React Router DOM (v6, opt-in flags v7)
- Vite
- Axios
- Recharts
- lucide-react (icônes)
- lottie-react (animations)

#### 3.2 Backend
- Express
- Mongoose (MongoDB)
- Passport + passport-google-oauth20
- jsonwebtoken (JWT)
- dotenv, cors
- nodemon (dev)

#### 3.3 ML API
- FastAPI + Uvicorn
- Pydantic v2
- numpy
- scikit-learn (RandomForestRegressor + StandardScaler)
- pymongo (MongoDB)

### 4) Configuration (variables d’environnement)

#### 4.1 Backend (`server/.env`)

Variables essentielles :
- **PORT**: port HTTP du backend (défaut: 5000)
- **MONGO_URI**: URI MongoDB, ex `mongodb://localhost:27017/dayflow`
- **JWT_SECRET**: secret signature JWT (long, random)
- **CLIENT_URL**: URL du front (CORS + redirection OAuth)
- **GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET**: OAuth Google

Variables ML API (intégration) :
- **ML_API_URL**: base URL ML API (ex `http://localhost:8000`)
- **ML_API_ENABLED**: `true|false` (désactive l’appel ML API si `false`)
- **ML_API_REQUIRED**: `true|false` (si `true`, le backend **échoue** si ML API indisponible)

> Remarque: des variables `ML_DB_NAME`, `ML_COLLECTION_NAME`, etc. peuvent exister côté backend, mais le backend Node n’en a pas besoin. Elles sont surtout utiles côté ML API.

#### 4.2 ML API (`ml-api`)

Variables utilisées par `ml-api/main.py` :
- **MONGO_URI**: URI MongoDB (défaut: `mongodb://localhost:27017/dayflow`)
- **ML_DB_NAME**: nom de base (défaut: `dayflow`)
- **ML_COLLECTION_NAME**: collection patterns utilisateur (défaut: `ml_user_patterns`)
- **ML_FEEDBACK_COLLECTION_NAME**: collection feedback (défaut: `ml_feedback_history`)
- **ML_MODEL_METADATA_COLLECTION_NAME**: collection metadata (défaut: `ml_model_metadata`)

### 5) Démarrage local (Windows / Linux)

#### 5.1 Installation dépendances

Depuis la racine :

```bash
npm run install:all
```

#### 5.2 Lancer les services (3 terminaux)

Backend :

```bash
cd server
npm run dev
```

Frontend :

```bash
cd client
npm run dev
```

ML API :

```bash
cd ml-api
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# ou Windows: .\.venv\Scripts\activate
pip install -r requirements.txt  # si présent
# sinon:
pip install fastapi uvicorn numpy scikit-learn pydantic pymongo
python main.py
```

Endpoints de contrôle :
- Backend health: `GET /api/health`
- ML API docs: `GET http://localhost:8000/docs`
- Statut moteur ML côté backend: `GET /api/planning/ml-engine-status`

### 6) Authentification et sécurité

#### 6.1 OAuth Google

Backend:
- `GET /api/auth/google` : redirection vers Google OAuth.
- `GET /api/auth/google/callback` : callback OAuth, génère un JWT et redirige vers le front:
  - `CLIENT_URL/auth/callback?token=...`

Le front stocke le token en `localStorage` et l’ajoute automatiquement via Axios:
- `Authorization: Bearer <token>`

#### 6.2 Middleware JWT (backend)

`server/middleware/auth.js` :
- vérifie header `Authorization: Bearer ...`
- `jwt.verify()` avec `JWT_SECRET`
- charge `req.user` via `User.findById(decoded.id)`

### 7) Modèles de données (MongoDB / Mongoose)

#### 7.1 `User`
Fichier: `server/models/User.js`
- `googleId`, `name`, `email`, `picture`
- profil planning: `wakeUpTime`, `sleepTime`, `courseEndTime`, `arrivalTime`

#### 7.2 `Activity`
Fichier: `server/models/Activity.js`
- `name`, `duration`, `priority` (1..3), `category`
- `type`: `fixe|flexible`
- `startTime/endTime` si `fixe`
- `days`: contraintes de jours (`lun..dim`)
- `deadline`: contrainte horaire (format `HH:MM` dans le backend local)
- `icon` (lucide name), `emoji` (legacy)

#### 7.3 `Planning`
Fichier: `server/models/Planning.js`
- `weekStart`: clé semaine
- `days[]`: `{ date, slots[], reflection }`
- `productivityScore`: score semaine (0..100)
- `weeklyReflection`

Slot (`slotSchema`) contient notamment :
- `activityId`, `activityName`, `category`, `color`, `icon`
- `startTime`, `endTime`, `duration`
- `done`, `skipped`
- champs ML: `mlScore`, `suggestedTime`, `needsOptimization`, `mlAdjusted`

#### 7.4 `Feedback` / `UserPattern`
Ces modèles servent à la couche “ML local” (Node) :
- `Feedback` stocke les retours utilisateur.
- `UserPattern` agrège des maps (`energyLevels`, `activitySuccessRates`, etc.).

> La ML API Python stocke ses propres patterns/feedbacks dans Mongo (collections `ml_*`).

### 8) API Backend (Express)

Base URL: `/api`

#### 8.1 Auth (`/api/auth`)
- `GET /google` : démarre OAuth
- `GET /google/callback` : callback
- `GET /me` : retourne l’utilisateur courant
- `PUT /settings` : met à jour horaires profil

#### 8.2 Activities (`/api/activities`)
- `GET /` : liste activités actives
- `POST /` : crée activité
- `PUT /:id` : met à jour activité
- `DELETE /:id` : soft delete (`isActive=false`)

Le backend normalise les jours (`lundi` → `lun`, etc.) et définit un `icon` par défaut si absent.

#### 8.3 Planning (`/api/planning`)

Endpoints principaux :
- `GET /week/:weekStart`
  - si planning existe → renvoie `plannerEngine=cached`
  - sinon → génère (ML API → fallback local) et persiste
- `POST /generate/:weekStart`
  - régénère semaine, **conserve les tâches cochées** (merge “done” par `date + activityId`)
  - renvoie `plannerEngine` et `plannerWarning`
- `PATCH /:weekStart/:date/slot/:slotIndex`
  - coche/décoche un slot
  - déclenche collecte feedback automatique (try/catch, warning renvoyé si erreur)
- `POST /feedback/:weekStart/:date/slot/:slotIndex`
  - feedback détaillé (satisfaction, notes, durée réelle)
- `GET /ml-stats`
  - stats ML local (Node)
- `GET /ml-engine-status`
  - probe ML API et indique si connecté (utile debug)

#### 8.4 Stats (`/api/stats`)
- `GET /overview` : statistiques agrégées (12 dernières semaines, breakdown catégories)

#### 8.5 Motivation (`/api/motivation`)
- `GET /daily` : verset + encouragement

### 9) Moteur planning

Il existe **deux implémentations**:

#### 9.1 Génération locale Node (`server/services/planningService.js`)

Logique (résumé):
- construit des blocs fixes (sommeil, routine matinale, cours/transport en semaine)
- calcule les créneaux libres
- sépare activités `fixe` vs `flexible`
- place les activités fixes sur les jours autorisés
- place les flexibles par score glouton (énergie, priorité, “waste penalty”), respecte:
  - jours ciblés (normalisés)
  - contraintes de type
  - deadlines horaires (format `HH:MM`)
- utilise une date locale (évite bugs UTC `toISOString()`)

#### 9.2 Génération via ML API (`ml-api/main.py`)

Endpoints:
- `POST /api/generate-planning` : génère planning + statistiques
- `POST /api/feedback` : enregistre feedback
- `GET /api/model-status/{user_id}` : statut modèle (indicatif)

Le planificateur (`IntelligentPlanner`) :
- génère des free slots comme le backend local
- place routines/fixes puis flexibles
- score placement avec un mélange :
  - `ml_score` (prédiction modèle si entraîné, sinon heuristique)
  - énergie
  - priorité
  - fit durée
  - urgence deadline (dans ce code, attention aux formats)
  - pénalité de surcharge par jour (`day_load`)

> En pratique, l’UI affichera souvent `ml-api-heuristic` tant que le modèle n’est pas entraîné (il faut du feedback).

### 10) Flux “feedback” et apprentissage

#### 10.1 Feedback automatique (backend Node)

Lorsqu’un slot est coché/décoché :
- `routes/planning.js` appelle `feedbackService.collectFromSlot`
- `feedbackService` appelle `mlPlanningService.saveFeedback`
- `mlPlanningService` :
  - persiste `Feedback` en Mongo
  - met à jour `UserPattern`
  - tente ensuite `mlApiService.submitFeedback()` vers la ML API (Python)

#### 10.2 Feedback côté ML API

La ML API reçoit :
- `userId`, `activityId`, `date`, `completed`, `satisfactionScore`, `actualDuration`
et stocke dans `ml_feedback_history`.

### 11) Cache, régénération et conservation de progression

Comportement voulu :
- `GET /planning/week/:weekStart` renvoie généralement `cached`
- `POST /planning/generate/:weekStart`:
  - regenère
  - conserve les cases cochées sur les activités correspondantes
  - recalcule `productivityScore`

### 12) Frontend : architecture et appels API

#### 12.1 Client API Axios
`client/src/api/index.js` :
- baseURL `/api`
- injecte `Authorization` depuis `localStorage`
- en cas de 401: purge token + redirection `/login`

#### 12.2 AuthContext
`client/src/context/AuthContext.jsx` :
- au chargement, si token existe : `GET /auth/me`
- expose `user`, `setUser`, `logout`, `loading`

#### 12.3 Dashboard
`client/src/pages/Dashboard.jsx` :
- charge `GET /planning/week/:weekStart`
- régénère via `POST /planning/generate/:weekStart`
- log en console :
  - `[Planning] Source: <plannerEngine>` + warning éventuel

#### 12.4 Activities
`client/src/pages/Activities.jsx` :
- CRUD activités via `/activities`
- après create/update/delete : déclenche `POST /planning/generate/<weekStart>` en arrière-plan pour maintenir le planning à jour

### 13) Troubleshooting

#### 13.1 “Je vois `cached` tout le temps”
Normal : le backend renvoie le planning persistant. Pour recalculer :
- bouton “Régénérer” (ou appel `POST /planning/generate/:weekStart`)

#### 13.2 “Je vois `local-fallback`”
Le backend n’a pas pu joindre la ML API. Vérifier :
- ML API tourne sur `ML_API_URL`
- `ML_API_ENABLED=true`
- si `ML_API_REQUIRED=true`, une indisponibilité doit produire une erreur (pas fallback)

#### 13.3 ML API lente/bloquée sur Windows
La ML API initialise Mongo au startup avec fallback mémoire si Mongo indisponible.
Vérifier :
- que `pymongo` est installé
- que Mongo tourne
- que `MONGO_URI` est correct

#### 13.4 “Je perds mes cases cochées après régénération”
Comportement corrigé : la régénération merge les `done=true` par `date+activityId`.  
Si une activité change d’ID (suppression/recréation), l’association ne peut plus matcher.

### 14) Déploiement (principes)

Approche recommandée : Docker Compose avec services :
- `nginx` (reverse proxy)
- `server` (Node/Express)
- `client` (build static servi par nginx)
- `mongo`
- `ml-api`

Points clés :
- `CLIENT_URL` et CORS doivent correspondre au domaine public
- `ML_API_URL` doit pointer vers le service ML interne
- secrets via variables d’environnement / vault (pas dans git)

---

### Annexes

#### A) Valeurs “jour” supportées
- `lun`, `mar`, `mer`, `jeu`, `ven`, `sam`, `dim`
Le backend normalise aussi des variantes (`lundi`, `mardi`, etc.).

#### B) Valeurs catégories
- `études`, `loisirs`, `projet`, `routine`, `sport`, `autre`

