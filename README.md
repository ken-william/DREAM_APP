# Synthétiseur de Rêves : Explorez Votre Monde Onirique avec l'IA

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Django](https://img.shields.io/badge/Django-4.2.11-green.svg)
![React](https://img.shields.io/badge/React-18.3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-orange.svg)

## Vue d'ensemble

Le **Synthétiseur de Rêves** est une application web innovante qui transforme vos récits de rêves en expériences visuelles et interactives grâce à l'intelligence artificielle. Cette application combine transcription vocale, analyse émotionnelle, génération d'images IA et fonctionnalités sociales pour créer une plateforme unique d'exploration onirique.

### Fonctionnalités principales

- **Capture de rêves multimodale** : Enregistrement vocal, upload audio ou saisie manuelle
- **Transcription automatique** : Conversion speech-to-text via l'API Groq Whisper
- **Analyse émotionnelle** : Classification des émotions avec HuggingFace Transformers
- **Génération d'images IA** : Visualisation artistique de vos rêves avec Pollinations
- **Plateforme sociale** : Partage, likes, commentaires et système d'amitié
- **Interface moderne** : Design glassmorphism avec animations fluides
- **Architecture scalable** : Backend Django REST + Frontend React

## Architecture technique

### Stack technologique

**Backend**
- Django 4.2.11 + Django REST Framework
- Base de données SQLite (dev & prod) - Simple et fiable
- APIs IA : Groq, HuggingFace, Pollinations
- Authentification JWT + Token Auth
- WhiteNoise pour fichiers statiques

**Frontend**
- React 18.3.0 + React Router
- Bootstrap 5.3.7 + CSS custom
- Communication API via Axios
- Interface responsive et accessible

**DevOps & Production**
- Pipeline CI/CD GitHub Actions
- Docker & Docker Compose
- Health checks et monitoring
- Déploiement automatisé

### Diagramme d'architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │◄───┤   Backend    │◄───┤  APIs IA    │
│   React     │    │   Django     │    │  Groq       │
│             │    │   SQLite     │    │  HuggingFace│
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   GitHub    │    │   Docker     │    │  Monitoring │
│   Actions   │    │   Container  │    │  Health     │
│   CI/CD     │    │              │    │  Checks     │
└─────────────┘    └──────────────┘    └─────────────┘
```

## Installation et configuration

### Prérequis

- Python 3.12+
- Node.js 18+
- Git

### Installation rapide

1. **Cloner le projet**
```bash
git clone <your-repo-url>
cd DREAM_APP
```

2. **Configuration Backend**
```bash
# Créer l'environnement virtuel
python -m venv .venv

# Activer l'environnement (Windows)
.venv\Scripts\activate

# Installer les dépendances (version SQLite optimisée)
pip install -r requirements-sqlite.txt

# Configuration variables d'environnement
cd backend
cp .env.example .env
# Éditer .env avec vos clés API
```

3. **Configuration Frontend**
```bash
cd frontend
npm install
```

4. **Base de données SQLite (automatique)**
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
# SQLite db.sqlite3 créé automatiquement !
```

### Variables d'environnement requises

Créer un fichier `.env` dans le dossier `backend/` :

```env
# Sécurité Django
DJANGO_SECRET_KEY="votre-cle-secrete-generee"
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# APIs IA (REQUISES)
GROQ_API_KEY="gsk_your_groq_api_key"
HUGGINGFACE_API_KEY="hf_your_huggingface_key"

# Base de données (optionnel en dev)
DATABASE_URL="postgresql://user:password@localhost:5432/dreamapp_db"

# Configuration CORS
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

### Obtenir les clés API

1. **Groq** (gratuit) : https://console.groq.com/
   - Utilisé pour la transcription Whisper et reformulation de texte
   - Quota généreux pour le développement

2. **HuggingFace** (gratuit) : https://huggingface.co/settings/tokens
   - Utilisé pour l'analyse émotionnelle des rêves
   - Modèles de classification français disponibles

3. **Pollinations** : Aucune clé requise
   - Service gratuit de génération d'images
   - Fallback automatique en cas d'indisponibilité

## Utilisation

### Démarrage en développement

**Terminal 1 - Backend Django :**
```bash
cd backend
python manage.py runserver
# Backend accessible sur http://localhost:8000
```

**Terminal 2 - Frontend React :**
```bash
cd frontend
npm start
# Frontend accessible sur http://localhost:3000
```

### Déploiement avec Docker (SQLite)

```bash
# Construction et lancement (version SQLite)
docker-compose -f docker-compose-sqlite.yml up --build

# En arrière-plan
docker-compose -f docker-compose-sqlite.yml up -d

# Arrêt
docker-compose -f docker-compose-sqlite.yml down
```

### Vérification santé de l'application

```bash
# Vérifier que l'API fonctionne
curl http://localhost:8000/health/

# Réponse attendue :
# {"status": "healthy", "checks": {"database": "healthy"}, "message": "Dream Synthesizer API Health Check"}
```

## Tests

### Tests Backend

```bash
cd backend

# Tests unitaires Django
python manage.py test

# Tests avec couverture
coverage run --source='.' manage.py test
coverage report --show-missing

# Vérifications qualité code
python manage.py check --deploy
python check_security.py
```

### Tests Frontend

```bash
cd frontend

# Tests React
npm test

# Tests avec couverture
npm test -- --coverage

# Build de production
npm run build
```

### Tests d'intégration

```bash
# Via Docker Compose
docker-compose -f docker-compose.test.yml up --build
```

## Déploiement

### Production avec Docker (SQLite)

1. **Configurer les variables de production**
```bash
# Modifier backend/.env pour production
DEBUG=False
DJANGO_ENV=production
# PAS besoin de DATABASE_URL (SQLite par défaut)
```

2. **Déploiement SQLite**
```bash
docker-compose -f docker-compose-sqlite.yml up -d
```

### Déploiement automatique

Le pipeline CI/CD se déclenche automatiquement :
- **Push sur `develop`** → Déploiement staging
- **Push sur `main`** → Déploiement production

### Plateformes supportées

- **Heroku** : Configuration incluse
- **Railway** : Dockerfile optimisé
- **Docker** : Images multi-stage
- **VPS** : Docker Compose fourni

## Configuration production

### Variables d'environnement production (SQLite)

```env
# Sécurité renforcée
DEBUG=False
DJANGO_ENV=production
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# PAS besoin de DATABASE_URL (SQLite automatique)
# La base SQLite est dans le volume sqlite_data

# Domaines autorisés
ALLOWED_HOSTS="votre-domaine.com,www.votre-domaine.com"
CORS_ALLOWED_ORIGINS="https://votre-domaine.com"

# Monitoring (optionnel)
SENTRY_DSN="https://your-sentry-dsn"
```

### Optimisations production (SQLite)

- **WhiteNoise** : Fichiers statiques optimisés
- **Gunicorn** : Serveur WSGI production
- **SQLite** : Base de données simple et performante
- **Health checks** : Monitoring automatique
- **Volume Docker** : Persistance des données SQLite

## Monitoring et logs

### Endpoints de monitoring

- `GET /health/` : État de santé de l'application
- `GET /admin/` : Interface d'administration Django

### Logs

```bash
# Logs en temps réel
docker-compose logs -f web

# Logs d'erreurs
tail -f backend/logs/django.log
```

### Métriques

- Connexions base de données
- Utilisation des APIs IA
- Temps de réponse
- Erreurs applicatives

## Contribution

### Structure du projet

```
DREAM_APP/
├── backend/                 # Application Django
│   ├── config/             # Configuration Django
│   ├── dreams/             # Gestion des rêves
│   ├── accounts/           # Authentification
│   ├── social/             # Fonctionnalités sociales
│   ├── logs/               # Fichiers de logs
│   └── media/              # Fichiers uploadés
├── frontend/               # Application React
│   ├── src/                # Code source React
│   ├── public/             # Fichiers statiques
│   └── build/              # Build de production
├── .github/workflows/      # Pipeline CI/CD
├── docker-compose.yml      # Configuration Docker
├── Dockerfile             # Image de production
└── requirements.txt       # Dépendances Python
```

### Workflow de développement

1. Fork le projet
2. Créer une branche feature : `git checkout -b feature/nouvelle-fonctionnalite`
3. Commiter les changements : `git commit -m 'Ajout nouvelle fonctionnalité'`
4. Pousser vers la branche : `git push origin feature/nouvelle-fonctionnalite`
5. Ouvrir une Pull Request

### Standards de code

- **Python** : PEP 8, docstrings Google style, type hints
- **JavaScript** : ESLint, Prettier
- **Git** : Conventional Commits
- **Tests** : Couverture minimale 70%

## Support et contact

### Documentation

- **API Documentation** : `/admin/doc/` (mode debug)
- **Swagger UI** : Intégration prévue
- **Wiki GitHub** : Documentation détaillée

### Issues et bugs

Utiliser le système d'issues GitHub pour :
- Signaler des bugs
- Proposer des améliorations
- Poser des questions

### Communauté

- **Discussions GitHub** : Questions générales
- **Discord** : Support en temps réel (lien à venir)

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Remerciements

- **Groq** pour l'API Whisper haute performance
- **HuggingFace** pour les modèles de classification
- **Pollinations** pour la génération d'images gratuite
- **Communauté Django** et **React** pour les outils exceptionnels

---

**Développé avec passion pour explorer les mystères de nos rêves** 🌙

*Version 1.0.0 - Septembre 2025*
