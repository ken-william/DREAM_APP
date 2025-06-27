from django.urls import path
from .views import (
    RegisterView, LoginView, ProfileView,
    ChangePasswordView, DeleteAccountView,
    get_csrf_token
)

urlpatterns = [
    # Vue basée classe
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('delete-account/', DeleteAccountView.as_view()),

    # Vue fonctionnelle si elles sont nécessaires (optionnel selon ton code)
    path('csrf/', get_csrf_token, name='get_csrf_token'),
    #path('logout/', logout_view, name='logout'),
    #path('whoami/', whoami, name='whoami'),
]
