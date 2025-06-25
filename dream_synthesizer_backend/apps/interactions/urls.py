# apps/interactions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FriendshipViewSet, LikeViewSet, CommentViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'friends', FriendshipViewSet)
router.register(r'likes', LikeViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]