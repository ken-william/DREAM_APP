import os
import sys
import django
from django.conf import settings
import coverage

# Configuration Django manuelle
if not settings.configured:
    # Ajouter le chemin du backend (où est config/)
    backend_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    sys.path.insert(0, backend_path)
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    
    # Forcer testserver dans ALLOWED_HOSTS pour les tests
    from django.conf import settings as django_settings
    if 'testserver' not in django_settings.ALLOWED_HOSTS:
        django_settings.ALLOWED_HOSTS.append('testserver')
        print(f"🥒 testserver ajouté à ALLOWED_HOSTS: {django_settings.ALLOWED_HOSTS}")

_cov = None

def before_all(context):
    # Démarrer la couverture
    global _cov
    _cov = coverage.Coverage()
    _cov.start()
    
    # S'assurer que les tables existent
    from django.core.management import call_command
    try:
        call_command('migrate', '--run-syncdb', verbosity=0)
        print("📊 Tables de la base de données créées")
    except Exception as e:
        print(f"⚠️ Erreur lors de la création des tables: {e}")

def before_scenario(context, scenario):
    """Nettoyer la DB avant chaque scénario"""
    from django.core.management import call_command
    # Vider les tables de test mais sans supprimer la structure
    call_command('flush', '--noinput')

def after_all(context):
    global _cov
    if _cov:
        _cov.stop()
        _cov.save()
        _cov.report()
        _cov.html_report()