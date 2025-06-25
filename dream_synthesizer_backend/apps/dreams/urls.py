# apps/dreams/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DreamViewSet, FeedView

router = DefaultRouter()
router.register(r'dreams', DreamViewSet) # Pour /api/dreams/ (list, create, retrieve, update, delete)

urlpatterns = [
    path('', include(router.urls)),
    path('feed/', FeedView.as_view({'get': 'list'}), name='feed'), # Pour le fil d'actualité
]
