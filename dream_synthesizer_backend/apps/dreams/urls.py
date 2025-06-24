from django.urls import path
from .views import (
    DreamListCreateView,
    DreamDetailView,
    AudioTranscriptionView,
    ImageGenerationView,
    EmotionAnalysisView,
    ChatWithMistralView
)

urlpatterns = [
    # API pour lister et créer les rêves de l'utilisateur
    path('dreams/', DreamListCreateView.as_view(), name='dream_list_create'),
    # API pour récupérer, mettre à jour et supprimer un rêve spécifique
    path('dreams/<int:pk>/', DreamDetailView.as_view(), name='dream_detail'),
    # API pour la transcription audio
    path('transcribe-audio/', AudioTranscriptionView.as_view(), name='transcribe_audio'),
    # API pour la génération d'image
    path('generate-image/', ImageGenerationView.as_view(), name='generate_image'),
    # API pour l'analyse émotionnelle
    path('analyze-emotion/', EmotionAnalysisView.as_view(), name='analyze_emotion'),
    # API pour le chat avec Mistral
    path('chat-dream/', ChatWithMistralView.as_view(), name='chat_dream'),
]