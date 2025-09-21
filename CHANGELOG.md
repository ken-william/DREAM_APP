# Changelog - Synthétiseur de Rêves

## [1.0.0] - 2025-09-21

### Ajouté
- Application web complète Django + React
- Transcription audio avec API Groq Whisper
- Classification émotionnelle avec HuggingFace
- Génération d'images avec Pollinations
- Système d'authentification JWT + Token Auth
- Fonctionnalités sociales (amis, likes, commentaires)
- Interface moderne avec design glassmorphism
- Pipeline CI/CD GitHub Actions optimisé SQLite
- Configuration Docker simplifiée pour SQLite
- Health checks et monitoring
- Documentation complète

### Base de données
- SQLite utilisée en développement ET production
- Configuration hybride avec fallback PostgreSQL
- Volumes Docker pour persistance SQLite
- Migration automatique lors du déploiement

### Sécurité
- Variables d'environnement externalisées
- SECRET_KEY générée automatiquement
- Protection CSRF et XSS
- Validation des uploads audio
- Permissions granulaires par API

### Performance
- WhiteNoise pour fichiers statiques
- Cache des requêtes API
- Images optimisées
- Compression automatique
- SQLite optimisé pour les performances

### Documentation
- README complet avec installation SQLite
- Guide de déploiement simplifié
- Documentation API
- Standards de code définis

## [0.1.0] - Phase de développement

### Prototype initial
- Fonctionnalités de base implémentées
- Tests unitaires et d'intégration
- Configuration développement
- APIs IA intégrées
- Transition vers SQLite pour simplicité
