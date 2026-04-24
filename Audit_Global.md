Audit global (état actuel)
Architecture
Découpage global : client/ (React) + server/ (Express/Mongoose) + ml-api/ (FastAPI) est cohérent et viable.
Point clé : tu as 2 moteurs de planning (heuristique Node et ML API Python). C’est ok, mais ça crée un risque de divergence fonctionnelle si leurs règles n’évoluent pas ensemble.
Intégration ML : maintenant branchée et observable (plannerEngine), bon point pour la finalisation.
Cohérence backend / frontend / ML API
Front consomme le planning et gère le token correctement via Axios interceptor.
Backend persiste le planning et expose plannerEngine/plannerWarning.
ML API reçoit planning + feedback et renvoie un planning exploitable.
Incohérence résiduelle : certaines conventions (ex: deadline interprété différemment entre Node et Python) peuvent diverger sans que l’UI le voie.
Complexité inutile (à réduire)
Deux systèmes “ML” en parallèle :
ML API Python (source principale)
mlPlanningService Node (patterns + enhancePlanningWithML) → c’est utile en fallback, mais en “finalisation” il faut clarifier lequel est la source de vérité.
Regénération automatique depuis Activities : pratique, mais potentiellement bruyant (beaucoup d’appels) et ambigu sur “quelle semaine” (actuellement weekStart = semaine courante).
Bugs potentiels / incohérences (priorité haute)
1) Secrets en clair (critique sécurité)
Ton server/.env contient Google client secret + JWT secret.

Risque : fuite accidentelle, compromission complète des sessions.
Action : rotation immédiate des secrets + ajout .env dans .gitignore + utiliser .env.example uniquement.
2) Validation trop faible côté backend
Les routes POST/PUT /activities, PUT /auth/settings, POST planning feedback acceptent des payloads sans validation stricte (types, bornes, formats).
Risque : données incohérentes, crashs, comportements bizarres du planning, surface d’attaque.
Action : valider systématiquement avec express-validator (déjà dépendance) ou Zod côté Node.
3) Génération planning : “cached” vs regen
Le mode cached est normal, mais peut surprendre : l’utilisateur peut croire que “le modèle ne change rien”.
Action : afficher un badge UI “Source: cache/ML/fallback” (tu as déjà les logs console). C’est un changement UX à très faible risque.
4) ML_API_REQUIRED=true en prod
Si ML API down → plus de planning.
Action : en prod, je recommande ML_API_REQUIRED=false + monitoring/alerting, sauf si tu acceptes une indisponibilité totale.
Risques performance / logique (priorité haute)
5) Régénération = recalcul complet + rewrite semaine
Tu as corrigé la conservation des done, très bien.
Risque : si le planning change beaucoup, tu peux “remapper” un done sur une activité au mauvais slot (car tu merges seulement par date + activityId). C’est acceptable, mais à documenter.
Amélioration simple : ajouter un slotKey stable (ex: activityId + startTime) pour un merge plus précis (optionnel).
6) Appels API “background” depuis Activities
Après chaque create/update/delete, tu déclenches POST /planning/generate/<semaine courante>.
Risques :
spam réseau (si l’utilisateur modifie 5 activités)
regen de la mauvaise semaine si l’utilisateur consulte une autre semaine
Amélioration simple :
debounce (ex: attendre 500–1000ms après dernière action)
ou ne regen que si l’utilisateur est sur Dashboard
ou fournir un bouton “Mettre à jour le planning” + toast “planning mis à jour”.
Sécurité (priorité haute → moyenne)
Auth/JWT
Points OK : JWT middleware, redirection OAuth, intercept 401 côté front.
À renforcer :
Cookies httpOnly (optionnel) si tu veux éviter le token en localStorage (meilleure sécurité XSS).
Rate limit sur endpoints sensibles (/auth/google/callback, /planning/generate, /activities).
CORS strict : CLIENT_URL unique (ok) + vérifier credentials selon usage.
Validation + sanitation
Normaliser/valider :
weekStart (format ISO YYYY-MM-DD, jour lundi attendu)
time (HH:MM)
duration (min/max)
priority (1..3)
category (enum)
days (enum lun..dim)
Simplification recommandée (sans tout casser)
Option A (recommandée) : ML API = source de vérité
Backend : planning = “ML API first”, fallback local uniquement si ML down.
Réduire le ML Node :
garder mlPlanningService seulement pour stats/feedback local si tu veux
ou le supprimer plus tard (phase 2), mais pas maintenant.
Bénéfice : moins de divergence, plus simple mentalement.
Option B : unifier au maximum les règles
Harmoniser la logique “blocs fixes / free slots / jours / deadlines” entre Node et Python (au minimum les formats).
Bénéfice : tu peux switcher moteur sans surprise.
Améliorations structure / lisibilité (priorité moyenne)
Backend
routes/* : extraire une couche controllers/ (léger) pour éviter les gros fichiers route.
centraliser les helpers (normalizeDayKey, toLocalISODate, etc.) dans utils/ côté server.
ajouter un middleware error standard + asyncHandler pour éviter répétition try/catch.
Frontend
Aujourd’hui beaucoup de styles inline. OK pour MVP, mais fragile.
Minimal : extraire quelques constantes UI (couleurs, spacing) / composants (Button, Card) sans refactor massif.
Guide production (clair, minimal, Docker-friendly)
Recommandation de prod
Docker Compose avec :
nginx (reverse proxy + TLS)
server (Node)
client (build static servi par nginx)
mongo
ml-api
Environnements
server
MONGO_URI=mongodb://mongo:27017/dayflow
CLIENT_URL=https://ton-domaine
ML_API_URL=http://ml-api:8000
ML_API_ENABLED=true
ML_API_REQUIRED=false (recommandé)
ml-api
MONGO_URI=mongodb://mongo:27017/dayflow
collections ml_* par défaut OK
nginx
/api → server:5000
/ → static front
Observabilité
Grafana/Prometheus : utile mais secondaire
Priorité simple :
logs conteneurs + healthchecks
alert si ml-api down
métriques basiques (latence /planning/generate, erreurs 5xx)
Plan de finalisation (priorisé)
Priorité 0 — à faire immédiatement
Retirer secrets du repo / rotation (JWT + Google secret).
Validation des entrées sur endpoints critiques.
Priorité 1 — stabilité produit
UI badge “Source planning” (cache/ML/fallback) au lieu de log console seul.
Debounce/contrôle regen après CRUD activités.
Priorité 2 — qualité & maintenabilité
Factoriser helpers server (normalizeDayKey, etc.).
asyncHandler + error middleware propre.
Harmoniser formats deadline entre Node/Python (ou documenter strictement un format unique).
Priorité 3 — déploiement
Docker Compose + Nginx + variables d’environnement + checklist prod.