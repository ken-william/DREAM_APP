# Guide d'Installation - Synthétiseur de Rêves (SQLite)

## Installation Rapide (5 minutes)

### 1. Prérequis
- Python 3.12+
- Node.js 18+
- Git

### 2. Cloner et configurer

```bash
# Cloner le projet
git clone <your-repo-url>
cd DREAM_APP

# Backend Python (version SQLite optimisée)
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements-sqlite.txt  # ⚡ Version simplifiée

# Frontend React
cd frontend
npm install
cd ..
```

### 3. Configuration des clés API

Créer `backend/.env` :
```env
DJANGO_SECRET_KEY="TemFXH8q3BY=G6nGGk=iGDP55LeaFlnNkKKCmmudFwauog3Vdi"
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
GROQ_API_KEY="votre_cle_groq"
HUGGINGFACE_API_KEY="votre_cle_huggingface"
CORS_ALLOWED_ORIGINS=http://localhost:3000

# PAS besoin de DATABASE_URL (SQLite automatique) ✅
```

### 4. Base de données SQLite (automatique)

```bash
cd backend
python manage.py migrate  # Crée db.sqlite3 automatiquement ✅
python manage.py createsuperuser
```

### 5. Démarrage

Terminal 1 (Backend) :
```bash
cd backend
python manage.py runserver
```

Terminal 2 (Frontend) :
```bash
cd frontend
npm start
```

🎉 Application accessible sur http://localhost:3000

## 🐳 Installation avec Docker (SQLite)

```bash
# Version simplifiée pour SQLite
docker-compose -f docker-compose-sqlite.yml up --build

# L'application sera accessible sur http://localhost:8000
```

## Vérification Installation

```bash
# Tester l'API
curl http://localhost:8000/health/

# Réponse attendue :
# {"status": "healthy", "checks": {"database": "healthy"}}

# Vérifier SQLite
ls backend/db.sqlite3  # Le fichier doit exister
```

## Obtenir les Clés API

### Groq (Gratuit)
1. Aller sur https://console.groq.com/
2. Créer un compte
3. Générer une clé API
4. Copier dans .env : `GROQ_API_KEY="gsk_..."`

### HuggingFace (Gratuit)
1. Aller sur https://huggingface.co/settings/tokens
2. Créer un token
3. Copier dans .env : `HUGGINGFACE_API_KEY="hf_..."`

## Dépannage

### Erreur "Module not found"
```bash
pip install -r requirements-sqlite.txt  # Version SQLite
```

### Erreur CORS
Vérifier CORS_ALLOWED_ORIGINS dans backend/.env

### Base de données SQLite corrompue
```bash
rm backend/db.sqlite3
python manage.py migrate  # Recrée automatiquement
python manage.py createsuperuser
```

### Port 8000 occupé
```bash
python manage.py runserver 8001
```

### Docker ne démarre pas
```bash
# Vérifier que Docker Desktop est démarré
docker --version

# Réessayer
docker-compose -f docker-compose-sqlite.yml up --build
```

## 🎯 Avantages de cette Installation SQLite

- ✅ **Simplicité** : Pas de serveur de base de données
- ✅ **Rapidité** : Installation en 5 minutes
- ✅ **Fiabilité** : Moins de composants = moins de pannes
- ✅ **Portabilité** : Un seul fichier db.sqlite3
- ✅ **Idéal** : Pour développement ET démonstration

## 🚀 Prêt pour la Production

Cette installation SQLite est **prête pour la production** :
- Performance suffisante pour l'usage attendu
- Sauvegarde simple (1 fichier)
- Déploiement facile avec Docker
- Monitoring inclus
