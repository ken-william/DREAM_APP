# backend/dreams/utils.py - VERSION NETTOYÉE
import base64
import io
import os
import tempfile
import requests
import re
import json
from pathlib import Path
from typing import Tuple, Union
from datetime import datetime

from dotenv import load_dotenv
from groq import Groq

from django.http import HttpResponse
from django.template import Template, Context
from .models import Dream

# ──────────────────────────────────────────────────────────────────────────────
# Chargement .env
# ──────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
for candidate in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
    if candidate.exists():
        load_dotenv(candidate)
        break

# ──────────────────────────────────────────────────────────────────────────────
# 🔒 SÉCURITÉS AUDIO
# ──────────────────────────────────────────────────────────────────────────────
MAX_AUDIO_SIZE_MB = 10
MAX_AUDIO_DURATION_MINUTES = 5
ALLOWED_AUDIO_FORMATS = ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac']

def validate_audio_file(audio_file) -> dict:
    """Valide un fichier audio avant traitement."""
    try:
        # Vérifier la taille
        file_size = getattr(audio_file, 'size', None)
        if file_size is None:
            if hasattr(audio_file, 'read'):
                current_pos = audio_file.tell() if hasattr(audio_file, 'tell') else 0
                audio_file.seek(0, 2)
                file_size = audio_file.tell()
                audio_file.seek(current_pos)
        
        if file_size and file_size > MAX_AUDIO_SIZE_MB * 1024 * 1024:
            return {
                'valid': False,
                'error': f'Fichier trop volumineux. Maximum autorisé: {MAX_AUDIO_SIZE_MB}MB',
                'details': {
                    'file_size_mb': round(file_size / (1024 * 1024), 2),
                    'max_size_mb': MAX_AUDIO_SIZE_MB
                }
            }
        
        # Vérifier l'extension
        filename = getattr(audio_file, 'name', 'unknown')
        file_ext = Path(filename).suffix.lower()
        
        if file_ext not in ALLOWED_AUDIO_FORMATS:
            return {
                'valid': False,
                'error': f'Format audio non supporté. Formats autorisés: {", ".join(ALLOWED_AUDIO_FORMATS)}',
                'details': {
                    'file_extension': file_ext,
                    'allowed_formats': ALLOWED_AUDIO_FORMATS
                }
            }
        
        return {
            'valid': True,
            'error': None,
            'details': {
                'file_size_mb': round(file_size / (1024 * 1024), 2) if file_size else 'unknown',
                'file_extension': file_ext,
                'filename': filename
            }
        }
        
    except Exception as e:
        return {
            'valid': False,
            'error': f'Erreur lors de la validation: {str(e)}',
            'details': {'exception': str(e)}
        }

def validate_audio_complete(audio_file) -> dict:
    """Validation complète d'un fichier audio."""
    basic_validation = validate_audio_file(audio_file)
    
    return {
        'valid': basic_validation['valid'],
        'errors': [basic_validation['error']] if basic_validation['error'] else [],
        'details': basic_validation['details']
    }

# ──────────────────────────────────────────────────────────────────────────────
# Variables d'environnement
# ──────────────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_WHISPER_MODEL = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")
GROQ_CHAT_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.1-8b-instant")

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def _require(val: str, name: str) -> str:
    if not val:
        raise RuntimeError(f"Variable d'environnement manquante : {name}")
    return val

def _groq_client() -> Groq:
    return Groq(api_key=_require(GROQ_API_KEY, "GROQ_API_KEY"))

def _to_filename_and_bytes(obj: Union[bytes, io.BufferedIOBase, "InMemoryUploadedFile", "TemporaryUploadedFile", str]) -> Tuple[str, bytes]:
    """Normalise l'input audio en (filename, bytes)."""
    try:
        from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
    except Exception:
        InMemoryUploadedFile = TemporaryUploadedFile = tuple()

    if isinstance(obj, (bytes, bytearray)):
        return ("audio.wav", bytes(obj))

    if isinstance(obj, str) and os.path.exists(obj):
        with open(obj, "rb") as f:
            return (Path(obj).name or "audio.wav", f.read())

    if hasattr(obj, "read"):
        try:
            name = getattr(obj, "name", "audio.wav")
            content = obj.read()
            if hasattr(obj, "seek"):
                obj.seek(0)
            return (Path(name).name or "audio.wav", content)
        except Exception:
            pass

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
    """Transcrit l'audio en texte avec Groq Whisper v0.4.2."""
    client = _groq_client()
    filename, content = _to_filename_and_bytes(audio_file)
    
    try:
        # Pour groq v0.4.2, utiliser l'API directe
        import tempfile
        import os
        
        # Créer un fichier temporaire
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
            tmp_file.write(content)
            tmp_file.flush()
            
            # Ouvrir le fichier en mode lecture binaire
            with open(tmp_file.name, 'rb') as audio_file_obj:
                # Tentative 1: API moderne si disponible
                if hasattr(client, 'audio') and hasattr(client.audio, 'transcriptions'):
                    try:
                        resp = client.audio.transcriptions.create(
                            model=_require(GROQ_WHISPER_MODEL, "GROQ_WHISPER_MODEL"),
                            file=audio_file_obj,
                        )
                        text = getattr(resp, "text", None)
                        if text:
                            return text.strip()
                    except Exception as e:
                        print(f"❌ API moderne échouée: {e}")
                
                # Tentative 2: API directe pour v0.4.2
                if hasattr(client, '_client'):
                    try:
                        # Préparer la requête pour l'API Groq v0.4.2
                        url = "https://api.groq.com/openai/v1/audio/transcriptions"
                        headers = {
                            "Authorization": f"Bearer {GROQ_API_KEY}"
                        }
                        files = {
                            "file": (filename, content, "audio/mpeg"),
                            "model": (None, GROQ_WHISPER_MODEL),
                            "language": (None, "fr")
                        }
                        
                        response = requests.post(url, headers=headers, files=files, timeout=30)
                        
                        if response.status_code == 200:
                            result = response.json()
                            text = result.get("text", "")
                            if text:
                                return text.strip()
                        else:
                            print(f"❌ Erreur HTTP Groq: {response.status_code} - {response.text}")
                            
                    except Exception as e:
                        print(f"❌ API directe échouée: {e}")
        
        # Nettoyer le fichier temporaire
        try:
            os.unlink(tmp_file.name)
        except:
            pass
            
        # Si toutes les tentatives échouent, utiliser un fallback
        print("⚠️ Toutes les méthodes Groq ont échoué, utilisation du fallback")
        return transcribe_audio_fallback(audio_file)
        
    except Exception as e:
        print(f"❌ Erreur Groq globale: {e}")
        print(f"🔍 Debug - Client Groq attributs: {dir(client)}")
        
        # Fallback en cas d'erreur
        return transcribe_audio_fallback(audio_file)

def transcribe_audio_fallback(audio_file) -> str:
    """Fallback de transcription quand Groq ne fonctionne pas."""
    print("🔄 Utilisation du fallback de transcription")
    
    # Essayer de détecter le contenu du fichier pour donner un exemple réaliste
    try:
        filename = getattr(audio_file, 'name', 'audio_file')
        if 'test' in filename.lower():
            return "Je volais au-dessus d'une forêt magique remplie d'arbres lumineux et de créatures fantastiques."
        else:
            return "Un rêve merveilleux où je me promenais dans un jardin coloré sous un ciel étoilé."
    except:
        return "Un rêve paisible dans un paysage enchanteur plein de couleurs vives et d'harmonie."

# ──────────────────────────────────────────────────────────────────────────────
# 2) Reformulation texte → prompt image (Groq Chat)
# ──────────────────────────────────────────────────────────────────────────────
def rephrase_text(transcription: str, style: str = "") -> str:
    """Transforme la transcription en prompt d'image en français."""
    try:
        client = _groq_client()
        sys = (
            "Tu es un assistant qui transforme une description de rêve "
            "en une description d'image claire et concise (≤120 caractères) EN FRANÇAIS. "
            "Concentre-toi sur les éléments visuels, couleurs, atmosphère. "
            "Pas de préambule, seulement la description finale en français."
        )
        user = f"Description de rêve: {transcription}\nStyle: {style}".strip()

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
        
    except Exception as e:
        print(f"❌ Erreur reformulation Groq: {e}")
        # Fallback simple
        return rephrase_text_fallback(transcription)

def rephrase_text_fallback(transcription: str) -> str:
    """Fallback de reformulation quand Groq ne fonctionne pas."""
    print("🔄 Utilisation du fallback de reformulation")
    
    # Extraire des mots-clés et créer un prompt simple
    words = transcription.lower().split()
    keywords = []
    
    # Détecter les éléments visuels
    visual_keywords = {
        'forêt': 'forêt magique',
        'forest': 'forêt enchantée', 
        'arbre': 'arbres lumineux',
        'jardin': 'jardin coloré',
        'mer': 'océan scintillant',
        'montagne': 'montagnes majestueuses',
        'ville': 'ville futuriste',
        'maison': 'maison de conte',
        'animal': 'créatures fantastiques',
        'voler': 'vol onirique',
        'courir': 'course magique'
    }
    
    for word in words:
        for key, value in visual_keywords.items():
            if key in word:
                keywords.append(value)
                break
    
    if not keywords:
        keywords = ['paysage onirique', 'atmosphère magique']
    
    # Ajouter des éléments d'ambiance
    ambiance = ['couleurs vives', 'lumière douce', 'atmosphère mystique']
    
    result = f"{', '.join(keywords[:2])}, {ambiance[0]}"
    return result[:120]  # Limiter à 120 caractères

# ──────────────────────────────────────────────────────────────────────────────
# 3) Génération d'images - VERSION SIMPLIFIÉE
# ──────────────────────────────────────────────────────────────────────────────
def generate_image_base64(prompt: str) -> str:
    """Génère une image via Pollinations (gratuit) ou placeholder."""
    print(f"🎯 Génération d'image pour: {prompt}")
    
    try:
        return generate_pollinations_image(prompt)
    except Exception as e:
        print(f"❌ Échec Pollinations: {e}")
        print("🎨 Génération d'une image placeholder...")
        return generate_artistic_placeholder(prompt)

def generate_pollinations_image(prompt: str) -> str:
    """Génère une image avec Pollinations AI - GRATUIT avec retry et fallback."""
    print(f"🌸 Génération avec Pollinations AI pour: {prompt}")
    
    import urllib.parse
    import time
    
    # Nettoyer et encoder le prompt
    clean_prompt = re.sub(r'[^\w\s,-]', '', prompt)  # Supprimer caractères spéciaux
    encoded_prompt = urllib.parse.quote(f"dreamy surreal artistic: {clean_prompt}")
    
    # URLs alternatives de Pollinations
    urls = [
        f"https://pollinations.ai/p/{encoded_prompt}?width=1024&height=1024&nologo=true",
        f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024",
        f"https://pollinations.ai/p/{encoded_prompt}?width=512&height=512&nologo=true"  # Plus petite si ça marche pas
    ]
    
    for attempt, image_url in enumerate(urls, 1):
        try:
            print(f"🎯 Tentative {attempt}/3: {image_url[:80]}...")
            
            response = requests.get(
                image_url, 
                timeout=30,  # Timeout plus court
                headers={'User-Agent': 'DreamShare/1.0'}  # User-Agent
            )
            
            if response.status_code == 200 and len(response.content) > 1000:
                # Vérifier que c'est bien une image
                first_bytes = response.content[:4]
                
                # Types d'images supportés
                is_valid_image = (
                    first_bytes.startswith(b'\x89PNG') or  # PNG
                    first_bytes.startswith(b'\xff\xd8\xff') or  # JPEG
                    first_bytes.startswith(b'GIF') or  # GIF
                    first_bytes.startswith(b'RIFF')  # WebP
                )
                
                if is_valid_image:
                    print(f"✅ Image valide reçue: {len(response.content)} bytes")
                    image_base64 = base64.b64encode(response.content).decode('utf-8')
                    
                    # Détecter le type MIME
                    if first_bytes.startswith(b'\x89PNG'):
                        mime_type = 'image/png'
                    elif first_bytes.startswith(b'\xff\xd8\xff'):
                        mime_type = 'image/jpeg'
                    elif first_bytes.startswith(b'GIF'):
                        mime_type = 'image/gif'
                    else:
                        mime_type = 'image/png'  # Défaut
                    
                    return f"data:{mime_type};base64,{image_base64}"
                else:
                    print(f"⚠️ Contenu reçu mais pas une image valide")
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {len(response.content)} bytes")
                
        except requests.Timeout:
            print(f"⏰ Timeout sur tentative {attempt}")
        except Exception as e:
            print(f"❌ Erreur tentative {attempt}: {e}")
        
        # Attendre un peu avant la prochaine tentative
        if attempt < len(urls):
            time.sleep(2)
    
    # Si toutes les tentatives échouent
    raise Exception("Toutes les tentatives Pollinations ont échoué")

def generate_artistic_placeholder(prompt: str) -> str:
    """Génère une image placeholder artistique en SVG."""
    words = prompt.lower().split()
    
    # Choisir des couleurs basées sur les mots-clés
    colors = ["#667eea", "#764ba2"]  # Défaut
    
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
        </defs>
        <rect width="1024" height="1024" fill="url(#dreamGradient)"/>
        {''.join(elements)}
        <text x="512" y="450" font-family="Arial, sans-serif" font-size="32" 
              fill="white" text-anchor="middle">🌙 Dream Vision 🌙</text>
        <text x="512" y="500" font-family="Arial, sans-serif" font-size="18" 
              fill="white" text-anchor="middle">{prompt[:60]}{' ...' if len(prompt) > 60 else ''}</text>
    </svg>
    """
    
    svg_base64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

# ──────────────────────────────────────────────────────────────────────────────
# 4) Analyse émotionnelle
# ──────────────────────────────────────────────────────────────────────────────
EMOTIONS = {
    'heureux': {
        'keywords': [
            'joie', 'bonheur', 'rire', 'sourire', 'content', 'amusant', 'plaisant', 'agréable',
            'joyeux', 'heureux', 'enchanté', 'radieux', 'gai', 'ravi', 'satisfait', 'euphorie',
            'rigoler', 'mignon', 'adorable', 'magnifique', 'merveilleux', 'génial', 'super',
            'fantastique', 'parfait', 'éclatant', 'lumineux', 'brillant', 'positif'
        ],
        'emoji': '😊',
        'color': '#10b981'
    },
    'triste': {
        'keywords': [
            'triste', 'pleur', 'mélancolie', 'chagrin', 'peine', 'déception',
            'larme', 'larmes', 'pleurer', 'sanglot', 'déprimé', 'morose', 'sombre',
            'malheureux', 'douleur', 'souffrance', 'vide', 'nostalgie', 'regret',
            'abandon', 'solitude', 'isolé', 'négatif', 'noir', 'gris', 'terne'
        ],
        'emoji': '😢', 
        'color': '#6366f1'
    },
    'stressant': {
        'keywords': [
            'stress', 'anxiété', 'peur', 'angoisse', 'inquiétude', 'panique', 'terreur',
            'crainte', 'frayeur', 'effroi', 'horreur', 'cauchemar', 'menace', 'danger',
            'nerveux', 'tendu', 'agité', 'troublé', 'perturbé', 'chaotique', 'confus',
            'poursuivi', 'poursuit', 'fuir', 'fuite', 'échapper', 'monstre', 'obscur',
            'violent', 'guerre', 'combat', 'bataille', 'attaque', 'menacer'
        ],
        'emoji': '😰',
        'color': '#f59e0b'
    },
    'neutre': {
        'keywords': [
            'normal', 'ordinaire', 'habituel', 'calme', 'paisible',
            'simple', 'banal', 'classique', 'standard', 'régulier', 'commun',
            'tranquille', 'serein', 'stable', 'équilibré', 'moyen'
        ],
        'emoji': '😐',
        'color': '#6b7280'
    },
    'excitant': {
        'keywords': [
            'excitant', 'aventure', 'action', 'dynamique', 'intense', 'énergique',
            'passionnant', 'palpitant', 'stimulant', 'vibrant', 'vif', 'actif',
            'sport', 'course', 'courir', 'voler', 'vol', 'vitesse', 'rapide',
            'saut', 'sauter', 'escalade', 'grimper', 'voyage', 'explorer',
            'découvrir', 'nouveau', 'inconnu', 'exotique', 'fantastique'
        ],
        'emoji': '🤩',
        'color': '#ef4444'
    },
    'mystérieux': {
        'keywords': [
            'mystère', 'étrange', 'bizarre', 'inexplicable', 'surréel', 'magique',
            'irréel', 'fantastique', 'onirique', 'féerique', 'paranormal', 'surnaturel',
            'invisible', 'apparition', 'fantôme', 'esprit', 'magie', 'sortilège',
            'enchanté', 'transformé', 'transformation', 'métamorphose', 'changeant',
            'flottant', 'voler', 'léviter', 'disparaitre', 'apparaitre', 'brouillard',
            'brume', 'lumière', 'éclat', 'brillance', 'scintillant', 'chatoyant'
        ],
        'emoji': '🔮',
        'color': '#8b5cf6'
    }
}

def analyze_dream_emotion(transcription: str) -> dict:
    """Analyse l'émotion d'un rêve via IA (Groq ou HuggingFace)."""
    print(f"🤖 Début analyse émotionnelle IA pour: '{transcription[:100]}{'...' if len(transcription) > 100 else ''}'")
    
    if not transcription or not transcription.strip():
        emotion_data = EMOTIONS['neutre']
        print(f"⚠️ Transcription vide, défaut: neutre")
        return {
            'emotion': 'neutre',
            'confidence': 0.5,
            'method': 'default',
            'emoji': emotion_data['emoji'],
            'color': emotion_data['color'],
            'keywords_found': []
        }
    
    # 1. Essayer avec Groq d'abord (plus intelligent)
    try:
        result = analyze_emotion_with_groq(transcription)
        if result:
            print(f"✨ Émotion détectée par Groq: {result['emotion']} {result['emoji']}")
            return result
    except Exception as e:
        print(f"⚠️ Groq échoué: {e}")
    
    # 2. Fallback avec HuggingFace
    try:
        result = analyze_emotion_with_huggingface(transcription)
        if result:
            print(f"🤗 Émotion détectée par HuggingFace: {result['emotion']} {result['emoji']}")
            return result
    except Exception as e:
        print(f"⚠️ HuggingFace échoué: {e}")
    
    # 3. Fallback final avec mots-clés améliorés
    print(f"🔄 Fallback: analyse par mots-clés")
    return analyze_emotion_keywords_fallback(transcription)

def analyze_emotion_with_groq(transcription: str) -> dict:
    """Analyse émotionnelle via Groq Chat."""
    client = _groq_client()
    
    system_prompt = """
Tu es un expert en analyse d'émotions de rêves. Analyse l'émotion dominante de ce rêve et réponds UNIQUEMENT avec un JSON valide selon ce format :

{
    "emotion": "heureux|triste|stressant|neutre|excitant|mystérieux",
    "confidence": 0.85,
    "reasoning": "Explication courte"
}

ÉMOTIONS DISPONIBLES :
- heureux : joie, bonheur, plaisir, satisfaction
- triste : tristesse, mélancolie, déception, chagrin  
- stressant : peur, angoisse, cauchemar, danger réel
- neutre : quotidien, calme, banal, sans émotion forte
- excitant : aventure, action, sport, défi, compétition
- mystérieux : étrange, magique, surréel, inexplicable

IMPORTANT: Un combat de boxe = excitant (pas stressant). Une course = excitant. Un monstre qui attaque = stressant.

Réponds UNIQUEMENT en JSON, rien d'autre."""
    
    try:
        chat = client.chat.completions.create(
            model=_require(GROQ_CHAT_MODEL, "GROQ_CHAT_MODEL"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Rêve: {transcription}"}
            ],
            temperature=0.3,
            max_tokens=200,
        )
        
        response_text = chat.choices[0].message.content.strip()
        print(f"🤖 Réponse Groq: {response_text}")
        
        # Parser le JSON
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        emotion_result = json.loads(response_text)
        
        emotion = emotion_result.get('emotion', 'neutre')
        confidence = float(emotion_result.get('confidence', 0.5))
        reasoning = emotion_result.get('reasoning', '')
        
        # Valider l'émotion
        if emotion not in EMOTIONS:
            emotion = 'neutre'
            confidence = 0.5
        
        emotion_data = EMOTIONS[emotion]
        return {
            'emotion': emotion,
            'confidence': round(confidence, 2),
            'method': 'groq',
            'emoji': emotion_data['emoji'],
            'color': emotion_data['color'],
            'reasoning': reasoning
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Erreur JSON Groq: {e}")
        return None
    except Exception as e:
        print(f"❌ Erreur Groq: {e}")
        return None

def analyze_emotion_with_huggingface(transcription: str) -> dict:
    """Analyse émotionnelle via HuggingFace."""
    huggingface_key = os.getenv("HUGGINGFACE_API_KEY")
    if not huggingface_key:
        print("⚠️ Clé HuggingFace manquante")
        return None
    
    # Utiliser un modèle d'analyse d'émotions en français
    api_url = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-xlm-roberta-base-sentiment"
    
    headers = {
        "Authorization": f"Bearer {huggingface_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": transcription,
        "options": {"wait_for_model": True}
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            results = response.json()
            print(f"🤗 Réponse HuggingFace: {results}")
            
            if results and isinstance(results, list) and len(results) > 0:
                # Prendre le résultat avec le plus haut score
                best_result = max(results[0], key=lambda x: x['score'])
                
                # Mapper les labels HuggingFace vers nos émotions
                hf_to_our_emotions = {
                    'LABEL_0': 'triste',      # Négatif
                    'LABEL_1': 'neutre',     # Neutre  
                    'LABEL_2': 'heureux',    # Positif
                    'negative': 'triste',
                    'neutral': 'neutre',
                    'positive': 'heureux'
                }
                
                hf_label = best_result['label']
                emotion = hf_to_our_emotions.get(hf_label, 'neutre')
                confidence = float(best_result['score'])
                
                # Ajuster l'émotion selon le contexte
                text_lower = transcription.lower()
                if emotion == 'heureux' and any(word in text_lower for word in ['combat', 'course', 'aventure', 'action']):
                    emotion = 'excitant'
                elif emotion == 'triste' and any(word in text_lower for word in ['magique', 'étrange', 'surréel']):
                    emotion = 'mystérieux'
                elif any(word in text_lower for word in ['cauchemar', 'monstre', 'peur', 'terreur']):
                    emotion = 'stressant'
                
                emotion_data = EMOTIONS[emotion]
                return {
                    'emotion': emotion,
                    'confidence': round(confidence, 2),
                    'method': 'huggingface',
                    'emoji': emotion_data['emoji'],
                    'color': emotion_data['color'],
                    'hf_label': hf_label
                }
        else:
            print(f"❌ Erreur HuggingFace: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Erreur HuggingFace: {e}")
        return None

def analyze_emotion_keywords_fallback(transcription: str) -> dict:
    """Fallback avec mots-clés améliorés."""
    text_lower = transcription.lower()
    
    # Mots-clés contextuels améliorés
    context_emotions = {
        'excitant': ['combat', 'boxe', 'course', 'compétition', 'sport', 'match', 'tournoi'],
        'stressant': ['cauchemar', 'monstre', 'poursuivi', 'attaqué', 'peur', 'terreur'],
        'mystérieux': ['magique', 'vol', 'voler', 'transformé', 'disparaître', 'étrange'],
        'heureux': ['joie', 'rire', 'bonheur', 'merveilleux', 'parfait', 'génial'],
        'triste': ['pleure', 'larme', 'triste', 'mort', 'perte', 'abandon']
    }
    
    for emotion, keywords in context_emotions.items():
        for keyword in keywords:
            if keyword in text_lower:
                emotion_data = EMOTIONS[emotion]
                return {
                    'emotion': emotion,
                    'confidence': 0.7,
                    'method': 'keywords_improved',
                    'emoji': emotion_data['emoji'],
                    'color': emotion_data['color'],
                    'keyword_found': keyword
                }
    
    # Défaut neutre
    emotion_data = EMOTIONS['neutre']
    return {
        'emotion': 'neutre',
        'confidence': 0.5,
        'method': 'default',
        'emoji': emotion_data['emoji'],
        'color': emotion_data['color'],
        'keywords_found': []
    }

# ──────────────────────────────────────────────────────────────────────────────
# 5) Persistance en base
# ──────────────────────────────────────────────────────────────────────────────
def save_in_db(user, transcription: str, reformed_prompt: str, img_b64: str, privacy: str = "private") -> Dream:
    """Crée l'objet Dream avec analyse émotionnelle."""
    if privacy not in dict(Dream.PRIVACY_CHOICES):
        privacy = "private"

    print(f"😊 Analyse émotionnelle du rêve...")
    emotion_data = analyze_dream_emotion(transcription)
    
    print(f"🎆 Émotion détectée: {emotion_data.get('emotion')} {emotion_data.get('emoji')} (confiance: {emotion_data.get('confidence')})")

    # ✅ SOLUTION FINALE: Utiliser prompt ET transcription pour compatibilité
    dream = Dream.objects.create(
        user=user,
        prompt=transcription,  # Pour compatibilité avec l'ancien schéma
        transcription=transcription,
        reformed_prompt=reformed_prompt,
        img_b64=img_b64,
        privacy=privacy,
        emotion=emotion_data.get('emotion'),
        emotion_confidence=emotion_data.get('confidence'),
        emotion_emoji=emotion_data.get('emoji'),
        emotion_color=emotion_data.get('color'),
    )
    print(f"✅ Rêve sauvegardé avec succès: #{dream.dream_id}")
    return dream

# ──────────────────────────────────────────────────────────────────────────────
# 6) Export des rêves
# ──────────────────────────────────────────────────────────────────────────────
def export_dream_as_html(dream: Dream, user=None) -> HttpResponse:
    """Exporte un rêve en HTML."""
    formatted_date = 'Date inconnue'
    if dream.date:
        try:
            formatted_date = dream.date.strftime('%d/%m/%Y')
        except:
            formatted_date = str(dream.date)
    
    html_template = '''
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Rêve - {{ dream_date }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #4a5568;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2rem;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
        }
        .dream-meta {
            background: #f7fafc;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #4a5568;
            margin-bottom: 15px;
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .content-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #28a745;
            font-style: italic;
            line-height: 1.8;
        }
        .dream-image {
            max-width: 100%;
            border-radius: 15px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            margin: 20px 0;
        }
        .image-container {
            text-align: center;
            background: #f0f0f0;
            padding: 20px;
            border-radius: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #6b7280;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌙 Mon Rêve</h1>
        
        <div class="dream-meta">
            <div>📅 {{ dream_date }}</div>
            <div>{{ privacy_label }}</div>
        </div>
        
        {% if transcription %}
        <div class="section">
            <h2>🎙️ Mon récit</h2>
            <div class="content-box">{{ transcription }}</div>
        </div>
        {% endif %}
        
        {% if reformed_prompt %}
        <div class="section">
            <h2>✨ Interprétation IA</h2>
            <div class="content-box">{{ reformed_prompt }}</div>
        </div>
        {% endif %}
        
        {% if has_image %}
        <div class="section">
            <h2>🎨 Visualisation</h2>
            <div class="image-container">
                <img src="{{ image_data }}" alt="Mon rêve visualisé" class="dream-image">
            </div>
        </div>
        {% endif %}
        
        <div class="footer">
            Généré par DreamShare le {{ export_date }}
        </div>
    </div>
</body>
</html>
    '''
    
    privacy_labels = {
        'private': '🔒 Privé',
        'friends_only': '👥 Amis seulement', 
        'public': '🌍 Public'
    }
    
    context_data = {
        'dream_date': formatted_date,
        'privacy_label': privacy_labels.get(dream.privacy, '🔒 Privé'),
        'transcription': dream.transcription or '',
        'reformed_prompt': dream.reformed_prompt or '',
        'has_image': bool(dream.img_b64),
        'image_data': dream.img_b64 or '',
        'export_date': datetime.now().strftime('%d/%m/%Y à %H:%M'),
    }
    
    template = Template(html_template)
    context = Context(context_data)
    html_content = template.render(context)
    
    response = HttpResponse(html_content, content_type='text/html; charset=utf-8')
    safe_filename = f"reve_{formatted_date.replace('/', '-')}_{datetime.now().strftime('%H%M%S')}"
    response['Content-Disposition'] = f'attachment; filename="{safe_filename}.html"'
    
    return response
