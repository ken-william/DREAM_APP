def generate_pollinations_image(prompt: str) -> str:
    """
    Génère une image avec Pollinations AI - GRATUIT, sans token requis !
    """
    print(f"🌸 Génération avec Pollinations AI pour: {prompt}")
    
    # URL de l'API Pollinations - Pas besoin de token !
    base_url = "https://pollinations.ai/p"
    
    # Encoder le prompt pour l'URL
    import urllib.parse
    encoded_prompt = urllib.parse.quote(f"dreamy surreal artistic: {prompt}")
    
    # Construire l'URL complète avec paramètres
    image_url = f"{base_url}/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    try:
        print(f"📡 Requête vers: {image_url}")
        
        # Télécharger l'image directement
        response = requests.get(image_url, timeout=60)
        
        print(f"📊 Status code: {response.status_code}")
        print(f"📏 Content length: {len(response.content)}")
        
        if response.status_code == 200 and len(response.content) > 1000:
            # Vérifier que c'est une image
            first_bytes = response.content[:4]
            if first_bytes.startswith(b'\x89PNG') or first_bytes.startswith(b'\xff\xd8\xff') or first_bytes.startswith(b'GIF'):
                print(f"✅ Image valide reçue: {len(response.content)} bytes")
                image_base64 = base64.b64encode(response.content).decode('utf-8')
                return f"data:image/png;base64,{image_base64}"
            else:
                print(f"❓ Contenu suspect - premiers bytes: {first_bytes}")
                # Essayons quand même
                image_base64 = base64.b64encode(response.content).decode('utf-8')
                return f"data:image/png;base64,{image_base64}"
        else:
            print(f"❌ Erreur: Status {response.status_code}, Content: {len(response.content)}")
            raise Exception(f"Erreur Pollinations: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Erreur Pollinations: {e}")
        raise


# backend/dreams/utils.py
import base64
import io
import os
import tempfile
import requests
from pathlib import Path
from typing import Tuple, Union

from dotenv import load_dotenv
from groq import Groq

from .models import Dream


# ──────────────────────────────────────────────────────────────────────────────
# Chargement .env (backend/.env prioritaire)
# ──────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
for candidate in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
    if candidate.exists():
        load_dotenv(candidate)
        break

# ──────────────────────────────────────────────────────────────────────────────
# Variables d'environnement
# ──────────────────────────────────────────────────────────────────────────────
# STT + reformulation (Groq)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_WHISPER_MODEL = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")
GROQ_CHAT_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.1-8b-instant")

# Images - Plusieurs options disponibles
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Pour DALL-E
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")  # Pour Stable Diffusion (gratuit)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def _require(val: str, name: str) -> str:
    if not val:
        raise RuntimeError(f"Variable d'environnement manquante : {name}")
    return val


def _groq_client() -> Groq:
    return Groq(api_key=_require(GROQ_API_KEY, "GROQ_API_KEY"))


def _to_filename_and_bytes(
    obj: Union[bytes, io.BufferedIOBase, "InMemoryUploadedFile", "TemporaryUploadedFile", str]
) -> Tuple[str, bytes]:
    """
    Normalise l'input audio en (filename, bytes).
    """
    try:
        from django.core.files.uploadedfile import (  # type: ignore
            InMemoryUploadedFile,
            TemporaryUploadedFile,
        )
    except Exception:
        InMemoryUploadedFile = TemporaryUploadedFile = tuple()  # type: ignore

    if isinstance(obj, (bytes, bytearray)):
        return ("audio.wav", bytes(obj))

    if isinstance(obj, str) and os.path.exists(obj):
        with open(obj, "rb") as f:
            return (Path(obj).name or "audio.wav", f.read())

    if hasattr(obj, "read"):  # UploadedFile / file-like
        try:
            name = getattr(obj, "name", "audio.wav")
            content = obj.read()
            if hasattr(obj, "seek"):
                obj.seek(0)
            return (Path(name).name or "audio.wav", content)
        except Exception:
            pass

    # Dernier recours : stream exotique/chunks
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        if hasattr(obj, "chunks"):
            for chunk in obj.chunks():
                tmp.write(chunk)
        elif hasattr(obj, "read"):
            tmp.write(obj.read())
        else:
            raise RuntimeError("Type de fichier audio non supporté.")
        tmp.flush()
        tmp.seek(0)
        return (Path(tmp.name).name, tmp.read())


# ──────────────────────────────────────────────────────────────────────────────
# 1) Speech-to-Text (Groq Whisper)
# ──────────────────────────────────────────────────────────────────────────────
def transcribe_audio(audio_file) -> str:
    """
    Transcrit l'audio en texte (FR/auto) avec Groq Whisper.
    Accepte UploadedFile/bytes/chemin.
    """
    client = _groq_client()
    filename, content = _to_filename_and_bytes(audio_file)

    resp = client.audio.transcriptions.create(
        model=_require(GROQ_WHISPER_MODEL, "GROQ_WHISPER_MODEL"),
        file=(filename, content),
        # language="fr"  # optionnel (détection auto)
    )

    # Récupération robuste du texte
    text = getattr(resp, "text", None) or getattr(resp, "transcript", None)
    if not text:
        try:
            text = resp["text"] or resp.get("transcript")
        except Exception:
            pass
    if not text:
        raise RuntimeError("Transcription: réponse inattendue de Groq.")
    return text.strip()


# ──────────────────────────────────────────────────────────────────────────────
# 2) Reformulation texte → prompt image (Groq Chat)
# ──────────────────────────────────────────────────────────────────────────────
def rephrase_text(transcription: str, style: str = "") -> str:
    """
    Transforme la transcription en prompt d'image court, descriptif, EN.
    """
    client = _groq_client()
    sys = (
        "You are an assistant that transforms a dream description "
        "into a clear, concise image prompt (≤120 characters) in English. "
        "Focus on visual elements, colors, atmosphere. "
        "No preamble, only the final description."
    )
    user = f"Dream transcription: {transcription}\nStyle: {style}".strip()

    chat = client.chat.completions.create(
        model=_require(GROQ_CHAT_MODEL, "GROQ_CHAT_MODEL"),
        messages=[
            {"role": "system", "content": sys},
            {"role": "user", "content": user},
        ],
        temperature=0.6,
        max_tokens=120,
    )
    content = chat.choices[0].message.content.strip()
    return content


# ──────────────────────────────────────────────────────────────────────────────
# 3) Prompt → Image (Plusieurs options)
# ──────────────────────────────────────────────────────────────────────────────
def generate_image_base64(prompt: str) -> str:
    """
    Génère une image à partir d'un prompt.
    Essaie plusieurs APIs dans l'ordre : Pollinations (gratuit), Hugging Face, OpenAI DALL-E, puis placeholder.
    """
    print(f"🎯 Génération d'image pour le prompt: {prompt}")
    
    # Option 1: Pollinations AI (GRATUIT, sans token !)
    try:
        return generate_pollinations_image(prompt)
    except Exception as e:
        print(f"❌ Échec Pollinations: {e}")
    
    # Option 2: Hugging Face (si token configuré correctement)
    if HUGGINGFACE_API_KEY:
        try:
            return generate_huggingface_image(prompt)
        except Exception as e:
            print(f"❌ Échec Hugging Face: {e}")
    
    # Option 3: OpenAI DALL-E (payant mais fiable)
    if OPENAI_API_KEY:
        try:
            return generate_dalle_image(prompt)
        except Exception as e:
            print(f"❌ Échec DALL-E: {e}")
    
    # Option 4: Placeholder artistique
    print("🎨 Génération d'une image placeholder...")
    return generate_artistic_placeholder(prompt)


def generate_dalle_image(prompt: str) -> str:
    """
    Génère une image avec DALL-E 3 d'OpenAI.
    """
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "dall-e-3",
        "prompt": f"Dream-like artistic interpretation: {prompt}",
        "size": "1024x1024",
        "quality": "standard",
        "n": 1
    }
    
    response = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers=headers,
        json=payload,
        timeout=60
    )
    response.raise_for_status()
    
    data = response.json()
    image_url = data["data"][0]["url"]
    
    # Télécharger et convertir en base64
    img_response = requests.get(image_url, timeout=30)
    img_response.raise_for_status()
    
    image_base64 = base64.b64encode(img_response.content).decode('utf-8')
    return f"data:image/png;base64,{image_base64}"


def generate_huggingface_image(prompt: str) -> str:
    """
    Génère une image avec Stable Diffusion via Hugging Face - Version simple.
    """
    print(f"🎨 Génération avec Hugging Face pour: {prompt}")
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}"
        # Pas de Content-Type - laissons requests gérer
    }
    
    # ✅ Modèle éprouvé et stable
    api_url = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
    
    # ✅ Payload ultra-simple selon doc officielle
    payload = {
        "inputs": f"dreamy surreal artistic: {prompt}"
        # Pas d'options pour commencer
    }
    
    try:
        print(f"📡 Envoi requête à {api_url}")
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=120
        )
        
        print(f"📊 Status code: {response.status_code}")
        print(f"📏 Content length: {len(response.content)}")
        
        content_type = response.headers.get('content-type', '')
        print(f"📋 Content-Type: {content_type}")
        
        if response.status_code == 200:
            # Vérifier si c'est du JSON (erreur) ou binary (image)
            if 'application/json' in content_type:
                json_response = response.json()
                print(f"📄 Réponse JSON: {json_response}")
                
                if 'error' in json_response:
                    error_msg = json_response['error']
                    if 'loading' in error_msg.lower() or 'currently loading' in error_msg.lower():
                        print("⏳ Modèle en cours de chargement...")
                        raise Exception("Modèle en cours de chargement. Réessayez dans 30 secondes.")
                    else:
                        raise Exception(f"Erreur API HuggingFace: {error_msg}")
                        
            elif len(response.content) > 1000:  # Probablement une image
                # Vérifier que c'est vraiment une image
                first_bytes = response.content[:4]
                if first_bytes.startswith(b'\x89PNG') or first_bytes.startswith(b'\xff\xd8\xff'):
                    print(f"✅ Image PNG/JPEG valide reçue: {len(response.content)} bytes")
                    image_base64 = base64.b64encode(response.content).decode('utf-8')
                    return f"data:image/png;base64,{image_base64}"
                else:
                    print(f"❓ Contenu suspect - premiers bytes: {first_bytes}")
                    # Essayons quand même de l'encoder
                    image_base64 = base64.b64encode(response.content).decode('utf-8')
                    return f"data:image/png;base64,{image_base64}"
            else:
                print(f"❌ Contenu trop petit: {len(response.content)} bytes")
                print(f"📄 Contenu: {response.content[:200]}")
                raise Exception("Réponse trop petite pour être une image")
                
        else:
            print(f"❌ Erreur HTTP {response.status_code}")
            try:
                error_detail = response.json()
                print(f"❌ Détails: {error_detail}")
            except:
                print(f"❌ Texte erreur: {response.text[:300]}")
            raise Exception(f"Erreur HTTP {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("⏰ Timeout")
        raise Exception("Timeout lors de la génération. Le modèle met peut-être du temps à se charger.")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur réseau: {e}")
        raise Exception(f"Erreur réseau: {str(e)}")
    except Exception as e:
        if "Modèle en cours de chargement" in str(e):
            raise  # Re-raise l'exception de chargement
        print(f"❌ Erreur génération: {e}")
        raise


def generate_artistic_placeholder(prompt: str) -> str:
    """
    Génère une image placeholder artistique en SVG basée sur le prompt.
    """
    # Extraire des mots-clés du prompt pour personnaliser
    words = prompt.lower().split()
    
    # Choisir des couleurs basées sur les mots-clés
    colors = ["#667eea", "#764ba2"]  # Défaut : bleu-violet
    
    if any(word in words for word in ["nature", "forest", "tree", "green"]):
        colors = ["#56ab2f", "#a8e6cf"]
    elif any(word in words for word in ["ocean", "sea", "blue", "water"]):
        colors = ["#2196F3", "#21CBF3"]
    elif any(word in words for word in ["fire", "red", "warm", "sunset"]):
        colors = ["#ff6b6b", "#ffa726"]
    elif any(word in words for word in ["night", "dark", "moon", "star"]):
        colors = ["#2c3e50", "#3498db"]
    
    # Générer des éléments basés sur les mots-clés
    elements = []
    if "circle" in words or "moon" in words:
        elements.append('<circle cx="512" cy="300" r="100" fill="white" opacity="0.4"/>')
    if "star" in words or "night" in words:
        elements.append('<polygon points="512,200 520,220 540,220 526,234 532,254 512,242 492,254 498,234 484,220 504,220" fill="white" opacity="0.6"/>')
    if "cloud" in words:
        elements.append('<ellipse cx="400" cy="250" rx="80" ry="40" fill="white" opacity="0.3"/>')
    
    # Si pas d'éléments spécifiques, ajouter des formes abstraites
    if not elements:
        elements = [
            '<circle cx="512" cy="300" r="80" fill="white" opacity="0.3"/>',
            '<circle cx="300" cy="500" r="60" fill="white" opacity="0.2"/>',
            '<circle cx="700" cy="600" r="90" fill="white" opacity="0.25"/>'
        ]
    
    svg_content = f"""
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="dreamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:{colors[0]};stop-opacity:1" />
                <stop offset="100%" style="stop-color:{colors[1]};stop-opacity:1" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="1024" height="1024" fill="url(#dreamGradient)"/>
        {''.join(elements)}
        <text x="512" y="450" font-family="Arial, sans-serif" font-size="32" 
              fill="white" text-anchor="middle" filter="url(#glow)">🌙 Dream Vision 🌙</text>
        <text x="512" y="500" font-family="Arial, sans-serif" font-size="18" 
              fill="white" text-anchor="middle" opacity="0.9">{prompt[:60]}{' ...' if len(prompt) > 60 else ''}</text>
        <text x="512" y="900" font-family="Arial, sans-serif" font-size="14" 
              fill="white" text-anchor="middle" opacity="0.7">Artistic interpretation of your dream</text>
    </svg>
    """
    
    # Convertir le SVG en base64
    svg_base64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"


# ──────────────────────────────────────────────────────────────────────────────
# 4) Persistance en base
# ──────────────────────────────────────────────────────────────────────────────
def save_in_db(
    user,
    transcription: str,
    reformed_prompt: str,
    img_b64: str,
    privacy: str = "private",
) -> Dream:
    """
    Crée l'objet Dream en respectant le modèle.
    """
    if privacy not in dict(Dream.PRIVACY_CHOICES):
        privacy = "private"

    dream = Dream.objects.create(
        user=user,
        prompt=transcription,          # texte "brut" (ta transcription)
        reformed_prompt=reformed_prompt,
        transcription=transcription,
        img_b64=img_b64,
        privacy=privacy,
    )
    return dream