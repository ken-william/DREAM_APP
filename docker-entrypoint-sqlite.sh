#!/bin/bash
# =====================================================
# SCRIPT DE DÉMARRAGE DOCKER SQLite - SYNTHÉTISEUR DE RÊVES
# Version simplifiée pour SQLite
# =====================================================

set -e

echo "🚀 Démarrage de Dream Synthesizer (SQLite)..."

# PAS d'attente de base de données (SQLite = fichier local)
echo "📁 SQLite utilisé - pas d'attente DB nécessaire"

# Exécuter les migrations
echo "🔄 Application des migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques
echo "📁 Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

# Créer un superuser si nécessaire
if [ "$DJANGO_SUPERUSER_EMAIL" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "👤 Création du superuser..."
    python manage.py createsuperuser --noinput --email $DJANGO_SUPERUSER_EMAIL || echo "Superuser existe déjà"
fi

# Vérifications finales
echo "🔍 Vérifications finales..."
python manage.py check

echo "✅ Application SQLite prête!"

# Exécuter la commande passée en paramètre
exec "$@"
