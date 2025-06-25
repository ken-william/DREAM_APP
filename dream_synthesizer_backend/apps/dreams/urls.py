# apps/dreams/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DreamViewSet # Importez le DreamViewSet

# Créez un routeur par défaut
router = DefaultRouter()
# Enregistrez le DreamViewSet avec le préfixe 'dreams'
# Cela va générer automatiquement les URLs pour les méthodes CRUD et les @action
# Par exemple: /dreams/, /dreams/{pk}/, /dreams/transcribe-audio/, etc.
router.register(r'dreams', DreamViewSet, basename='dream')

urlpatterns = [
    # Inclut toutes les URLs générées par le routeur
    path('', include(router.urls)),
]