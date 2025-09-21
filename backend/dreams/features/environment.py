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

_cov = None

def before_all(context):
    # Démarrer la couverture
    global _cov
    _cov = coverage.Coverage()
    _cov.start()

def after_all(context):
    global _cov
    if _cov:
        _cov.stop()
        _cov.save()
        _cov.report()
        _cov.html_report()
