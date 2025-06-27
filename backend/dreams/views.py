# dreams/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Dream
from .serializers import DreamSerializer
from django.shortcuts import render

from rest_framework.parsers import MultiPartParser, FormParser

from .utils import transcribe_audio, rephrase_text, generate_image_base64, save_in_db

class DreamCreateAPIView(APIView):
    def get(self, request):
        return Response({"message": "Utilise POST pour créer un rêve."})
    

    def post(self, request):
        audio_file = request.FILES.get("audio")

        print(f"Format du fichier : {audio_file.content_type}")

        if not audio_file:
            return Response({"error": "Fichier audio requis."}, status=400)
        
        transcription = transcribe_audio(audio_file)
        prompt = rephrase_text(transcription)
        img_b64 = generate_image_base64(prompt)

        save_in_db(img_b64, transcription, prompt)

        return Response({"message : Success"})
