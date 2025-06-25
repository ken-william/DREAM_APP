# dreams/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Dream
from .serializers import DreamSerializer

from rest_framework.parsers import MultiPartParser, FormParser
from .utils import transcribe_audio
class DreamCreateAPIView(APIView):
    def get(self, request):
        return Response({"message": "Utilise POST pour créer un rêve."})
    

    def post(self, request):
        audio_file = request.FILES.get("audio")
        if not audio_file:
            return Response({"error": "Fichier audio requis."}, status=400)
        
        transcription = transcribe_audio(audio_file)

        return Response({"message": "Rêve reçu, traitement en cours."}, status=201)
