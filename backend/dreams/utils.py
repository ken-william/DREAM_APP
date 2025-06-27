import os
import base64
from django.db import DatabaseError
import dotenv
import re
import json
import math

from io import BytesIO

from mistralai import Mistral
from mistralai.models import ToolFileChunk
from groq import Groq

from .models import Dream

# Load environment variables
dotenv.load_dotenv()

# Transcription using Groq's Whisper model

def transcribe_audio(file):
    """
    Transcribe audio file using Groq's Whisper model.
    """
    client_groq = Groq(api_key=os.environ["GROQ_API_KEY"])

    audio_stream = BytesIO(file.read())
    audio_stream.name = file.name
    audio_stream.seek(0)

    transcription = client_groq.audio.transcriptions.create(
        file=audio_stream,
        model="whisper-large-v3-turbo",
        response_format="verbose_json"
    )

    transcription = transcription.text

    print("Transcription:", transcription)

    return transcription

def rephrase_text(raw_text: str) -> str:
    
    client_mistralai = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    mistral_key = os.environ["MISTRAL_API_KEY"]
    print('mistral key', mistral_key)
    
    # Instructions système
    system_message = "Tu es un assistant qui reformule des récits de rêve pour en faire des prompts d'image clairs, courts, visuels et directement utilisables pour de la génération d'image IA."

    # Message utilisateur avec le texte brut
    test_message = raw_text

    response = client_mistralai.chat.complete(
        model = "mistral-large-latest",
        messages = [
            {
                "role": "user",
                "content": test_message,
            },
            {
                "role": "system",
                "content": system_message,
            }
        ]
    )

    prompt = response.choices[0].message.content

    print("prompt:", prompt)

    return prompt

def softmax(predictions):
    non_zero = [v for v in predictions.values() if v > 0]
    if len(non_zero) == 1:
        adjusted = {k: (v if v > 0 else 5) for k, v in predictions.items()}
    else:
        adjusted = predictions

    scaled = {k: math.exp(v / 10) for k, v in adjusted.items()}
    total = sum(scaled.values())
    softmaxed = {k: round((v / total) * 100) for k, v in scaled.items()}

    correction = 100 - sum(softmaxed.values())
    if correction != 0:
        max_key = max(softmaxed, key=softmaxed.get)
        softmaxed[max_key] += correction
    return softmaxed

def classify_text(raw_prompt: str) -> dict:
    client_mistralai = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    try:
        emotion_response = client_mistralai.chat.complete(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": (
                    "Tu es un assistant qui analyse les émotions d'un rêve "
                    "et répond UNIQUEMENT avec un JSON valide contenant "
                    "les clés 'Heureux', 'Stressant', 'Triste', 'Colère', 'Peur'. "
                    "Ne rajoute jamais du texte avant ou après le JSON."
                )},
                {"role": "user", "content": f"Voici un rêve : {raw_prompt}. Donne-moi l'estimation d'émotions en pourcentage sous forme de JSON."}
            ]
        )
        text = emotion_response.choices[0].message.content
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("Aucun JSON détecté dans la réponse.")
        emotion_json_raw = json.loads(match.group(0))
        emotion_json = softmax(emotion_json_raw)
        print("**Analyse émotionnelle (en %)**")
    except Exception as e:
        print("Erreur lors de l'analyse émotionnelle : {e}")
    
    return emotion_json

# IMAGE GENERATION WITH MISTRAL

"""
def generate_image(prompt, output_dir="images", model="mistral-medium-latest"):

    client_mistralai = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    image_agent = client_mistralai.beta.agents.create(
        model=model,
        name="Image Generator",
        description="Génère des images à partir d’un prompt.",
        instructions="Utilise l’outil image_generation pour créer des images réalistes.",
        tools=[{"type": "image_generation"}],
        completion_args={"temperature": 0.3, "top_p": 0.95},
    )

    response = client_mistralai.beta.conversations.start(
        agent_id=image_agent.id,
        inputs=prompt,
        stream=False,
    )

    os.makedirs(output_dir, exist_ok=True)
    for output in response.outputs:
        if getattr(output, "type", "") == "tool.execution" and output.name == "image_generation":
            continue
        if getattr(output, "content", None):
            for chunk in output.content:
                if isinstance(chunk, ToolFileChunk):
                    data = client_mistralai.files.download(file_id=chunk.file_id).read()
                    unique_name = f"image_{uuid.uuid4().hex}.{chunk.file_type}"
                    path = os.path.join(output_dir, unique_name)
                    with open(path, "wb") as f:
                        f.write(data)
                    print(f"Image enregistrée : {path}")
                    return path
    print("Aucune image générée.")
    return None

"""

def generate_image_base64(prompt, model="mistral-medium-latest"):
    client_mistralai = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    image_agent = client_mistralai.beta.agents.create(
        model=model,
        name="Image Generator",
        description="Génère des images à partir d’un prompt.",
        instructions="Utilise l’outil image_generation pour créer des images réalistes.",
        tools=[{"type": "image_generation"}],
        completion_args={"temperature": 0.3, "top_p": 0.95},
    )

    response = client_mistralai.beta.conversations.start(
        agent_id=image_agent.id,
        inputs=prompt,
        stream=False,
    )

    for output in response.outputs:
        if getattr(output, "type", "") == "tool.execution" and output.name == "image_generation":
            continue
        if getattr(output, "content", None):
            for chunk in output.content:
                if isinstance(chunk, ToolFileChunk):
                    data = client_mistralai.files.download(file_id=chunk.file_id).read()
                    base64_encoded = base64.b64encode(data).decode('utf-8')
                    return base64_encoded

    print("Aucune image générée.")
    return None

def save_in_db(base64_string, transcription, prompt):
    try:
        dream = Dream.objects.create(
            prompt=prompt,
            reformed_prompt="",  
            transcription=transcription,
            img_b64=base64_string,
            privacy="private"
        )
        return dream 
    except DatabaseError as e:
        print(f"Erreur lors de la création du rêve : {e}")
        return None
