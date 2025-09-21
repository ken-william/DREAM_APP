from django.urls import path
from . import views


urlpatterns = [
    path("", views.home_page, name="home"),                     # petite home safe
    path("create", views.DreamCreateAPIView.as_view(), name="create_dream"),  # Ancienne API (sauvegarde automatique)
    path("generate", views.DreamGenerateAPIView.as_view(), name="generate_dream"),  # Nouvelle API (preview)
    path("save", views.DreamSaveAPIView.as_view(), name="save_dream"),  # Sauvegarder
    path("list", views.DreamListAPIView.as_view(), name="list_dreams"),  # Lister
    
    # 🆕 Feed social
    path("feed/public", views.PublicDreamsFeedAPIView.as_view(), name="public_feed"),  # Feed public
    path("feed/friends", views.FriendsDreamsFeedAPIView.as_view(), name="friends_feed"),  # Feed amis
    
    # 🆕 Gestion privacy
    path("<int:dream_id>/privacy", views.DreamUpdatePrivacyAPIView.as_view(), name="update_dream_privacy"),  # Changer privacy
    
    # 🆕 Export
    path("<int:dream_id>/export", views.DreamExportAPIView.as_view(), name="export_dream"),  # Exporter en HTML
]