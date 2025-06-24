from django.urls import path
from .views import UserRegistrationView, UserProfileView

urlpatterns = [
    # API pour l'inscription des utilisateurs
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    # API pour la consultation et la modification du profil de l'utilisateur authentifié
    path('profile/', UserProfileView.as_view(), name='user_profile'),
]