import os
import io
import base64
import json
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.db.models import F

from .models import Dream
from .serializers import DreamSerializer
from apps.core.utils import get_groq_client, get_mistral_client # Importation des clients API

class DreamListCreateView(ListCreateAPIView):
    """
    Vue API pour lister tous les rêves de l'utilisateur authentifié
    et créer un nouveau rêve.
    """
    serializer_class = DreamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retourne uniquement les rêves de l'utilisateur authentifié.
        """
        return Dream.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Associe le rêve créé à l'utilisateur authentifié.
        """
        serializer.save(user=self.request.user)

class DreamDetailView(RetrieveUpdateDestroyAPIView):
    """
    Vue API pour récupérer, mettre à jour ou supprimer un rêve spécifique.
    """
    queryset = Dream.objects.all()
    serializer_class = DreamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Assure que l'utilisateur ne peut accéder qu'à ses propres rêves.
        """
        return Dream.objects.filter(user=self.request.user)

class AudioTranscriptionView(APIView):
    """
    Vue API pour transcrire un fichier audio en texte en utilisant l'API Groq.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({"error": "No audio file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            groq_client = get_groq_client()
            # Groq's transcription API expects a file-like object
            # For in-memory file, io.BytesIO is used
            transcript_response = groq_client.audio.transcriptions.create(
                file=("audio.wav", io.BytesIO(audio_file.read()), audio_file.content_type),
                model="whisper-large-v3",
                response_format="json"
            )
            transcript = transcript_response.text
            return Response({"transcription": transcript}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error during audio transcription: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImageGenerationView(APIView):
    """
    Vue API pour générer une image à partir d'un prompt texte en utilisant l'API Mistral (DALL-E 3).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({"error": "No prompt provided for image generation."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mistral_client = get_mistral_client() # Using Mistral client for DALL-E 3
            # DALL-E 3 is accessible via Mistral's images.generations.create
            response = mistral_client.images.generations.create(
                model="dall-e-3", # Ensure this model is supported by your Mistral setup or use OpenAI directly
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = response.data[0].url
            return Response({"image_url": image_url}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error during image generation: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmotionAnalysisView(APIView):
    """
    Vue API pour analyser les émotions d'un texte de rêve en utilisant l'API Mistral.
    (Alternativement, cela pourrait utiliser un modèle local ou un autre service NLP)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        text = request.data.get('text')
        if not text:
            return Response({"error": "No text provided for emotion analysis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mistral_client = get_mistral_client()
            # Utilisation de Mistral pour la classification d'émotions
            # C'est une approche simplifiée; un modèle NLP dédié serait plus précis
            system_message = (
                "Vous êtes un classifieur d'émotions. Analysez le texte suivant et identifiez les émotions dominantes. "
                "Retournez un JSON avec les émotions (joie, tristesse, colère, peur, surprise, amour, neutre) et leur intensité relative (0 à 1, ou simple présence/absence). "
                "Exemple: {'joie': 0.7, 'tristesse': 0.2, 'neutre': 0.1}"
            )
            user_message = f"Analysez les émotions dans ce rêve : '{text}'"

            chat_response = mistral_client.chat.complete(
                model="mistral-large-latest", # Utilisez un modèle capable de compréhension sémantique
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"}, # Demander une réponse JSON
                temperature=0.2 # Température basse pour une réponse plus déterministe
            )
            emotion_analysis_json_str = chat_response.choices[0].message.content
            emotion_analysis = json.loads(emotion_analysis_json_str)

            return Response({"emotion_analysis": emotion_analysis}, status=status.HTTP_200_OK)
        except json.JSONDecodeError:
            return Response({"error": "Failed to parse AI response as JSON for emotion analysis."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Error during emotion analysis: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatWithMistralView(APIView):
    """
    Vue API pour discuter avec Mistral AI en lui fournissant un contexte de rêve.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        dream_context = request.data.get('dream_context')
        user_question = request.data.get('user_question')
        chat_history = request.data.get('chat_history', []) # Liste d'objets {role, content}

        if not dream_context or not user_question:
            return Response({"error": "Dream context and user question are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mistral_client = get_mistral_client()

            messages = [
                {"role": "system", "content": f"Vous êtes un assistant IA spécialisé dans l'interprétation des rêves. Vous devez aider l'utilisateur à comprendre son rêve en répondant à ses questions. Le rêve à analyser est : \"{dream_context}\". Répondez de manière informative et contextuelle."}
            ]

            # Ajouter l'historique de chat précédent
            for msg in chat_history:
                messages.append({"role": msg["role"], "content": msg["content"]})

            messages.append({"role": "user", "content": user_question})

            response = mistral_client.chat.complete(
                model="mistral-large-latest",
                messages=messages,
                temperature=0.7,
                top_p=1,
                random_seed=42,
            )
            ai_response = response.choices[0].message.content
            return Response({"ai_response": ai_response}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error during chat with Mistral: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)