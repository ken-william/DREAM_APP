# Guide de Contribution - Synthétiseur de Rêves

## Comment contribuer

### 1. Fork et clone
```bash
git clone https://github.com/votre-username/DREAM_APP.git
cd DREAM_APP
```

### 2. Configuration développement
```bash
# Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-sqlite.txt  # Version SQLite optimisée

# Frontend  
cd frontend
npm install
```

### 3. Créer une branche
```bash
git checkout -b feature/nom-fonctionnalite
```

### 4. Standards de code

**Python (Backend)**
- PEP 8 obligatoire
- Type hints recommandés
- Docstrings Google style
- Tests unitaires pour nouvelles fonctionnalités

**JavaScript (Frontend)**
- ESLint configuration fournie
- Composants fonctionnels React
- CSS modules ou styled-components

### 5. Tests
```bash
# Backend (SQLite automatique)
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

### 6. Commit et PR
```bash
git add .
git commit -m "feat: ajout nouvelle fonctionnalité"
git push origin feature/nom-fonctionnalite
```

## Types de contributions acceptées

- Corrections de bugs
- Nouvelles fonctionnalités
- Améliorations UX/UI
- Optimisations performance
- Documentation
- Tests

## Structure du code

```
backend/
├── dreams/     # Logique métier rêves
├── accounts/   # Authentification  
├── social/     # Fonctionnalités sociales
└── config/     # Configuration Django

frontend/
├── src/
│   ├── components/  # Composants React
│   ├── pages/       # Pages principales
│   └── utils/       # Utilitaires
```

## Questions ?

Ouvrir une issue ou une discussion GitHub.
