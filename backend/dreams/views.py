from django.shortcuts import render

from .utils import transcribe_audio, rephrase_text, generate_image_base64, classify_text

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Dream

@csrf_exempt
def create_dream_view(request):
    if request.method == "POST":
        # Exemple: tu récupères un fichier audio ou un prompt brut
        prompt = request.POST.get("prompt", "")
        audio_file = request.FILES.get("audio")

        # 1. Speech to Text
        transcription = transcribe_audio(audio_file) if audio_file else ""

        # 2. Text-to-Text (reformulation)
        reformed_prompt = rephrase_text(prompt or transcription)

        # 3. Classification
        classification = classify_text(reformed_prompt)

        # 4. Génération image en base64
        base64_img = generate_image_base64(reformed_prompt)  # doit retourner une chaîne base64

        # 5. Création en base
        dream = Dream.objects.create(
            prompt=prompt or transcription,
            reformed_prompt=reformed_prompt,
            transcription=transcription,
            img_b64=base64_img,
            privacy='private',  # ou récupérer depuis POST
        )

        return JsonResponse({"status": "success", "dream_id": dream.dream_id})

    return JsonResponse({"error": "Only POST allowed"}, status=405)

