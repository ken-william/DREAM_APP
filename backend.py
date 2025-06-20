# backend.py
import os
import uuid
import dotenv
import sqlite3
import json
from passlib.hash import bcrypt # Pour le hachage des mots de passe

from mistralai import Mistral
from mistralai.models import ToolFileChunk
from groq import Groq

# Load environment variables
dotenv.load_dotenv()

# --- Configuration de la base de données ---
DATABASE_FILE = "dreams.db"

def init_db():
    """Initialise la base de données SQLite et crée les tables nécessaires."""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    # Table des utilisateurs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)

    # Table des rêves
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dreams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_prompt TEXT,
            image_path TEXT,
            emotion_analysis TEXT, -- Stockera le JSON des émotions sous forme de texte
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()

# Initialiser la base de données au démarrage du backend
init_db()

# --- Fonctions d'authentification ---

def register_user(username, password):
    """
    Enregistre un nouvel utilisateur.
    Retourne l'ID de l'utilisateur si l'inscription est réussie, False si l'utilisateur existe déjà.
    """
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    try:
        password_hash = bcrypt.hash(password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        # L'utilisateur existe déjà
        return False
    finally:
        conn.close()

def login_user(username, password):
    """
    Connecte un utilisateur.
    Retourne (user_id, username) si la connexion est réussie, False sinon.
    """
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password_hash FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user:
        user_id, stored_username, password_hash = user
        if bcrypt.verify(password, password_hash):
            return user_id, stored_username
    return False

# --- Fonctions de gestion des rêves ---

def save_dream(user_id, raw_prompt, image_path, emotion_analysis):
    """
    Sauvegarde les détails d'un rêve pour un utilisateur donné.
    emotion_analysis doit être un string JSON.
    """
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO dreams (user_id, raw_prompt, image_path, emotion_analysis) VALUES (?, ?, ?, ?)",
        (user_id, raw_prompt, image_path, emotion_analysis)
    )
    conn.commit()
    conn.close()
    return True

def get_user_dreams(user_id):
    """
    Récupère tous les rêves pour un utilisateur donné.
    Retourne une liste de dictionnaires.
    """
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, timestamp, raw_prompt, image_path, emotion_analysis FROM dreams WHERE user_id = ? ORDER BY timestamp DESC",
        (user_id,)
    )
    dreams_data = cursor.fetchall()
    conn.close()

    dreams_list = []
    for dream in dreams_data:
        dream_id, timestamp, raw_prompt, image_path, emotion_analysis_str = dream
        try:
            emotion_analysis = json.loads(emotion_analysis_str) if emotion_analysis_str else {}
        except json.JSONDecodeError:
            emotion_analysis = {} # En cas d'erreur de parsing JSON
        dreams_list.append({
            "id": dream_id,
            "timestamp": timestamp,
            "raw_prompt": raw_prompt,
            "image_path": image_path,
            "emotion_analysis": emotion_analysis
        })
    return dreams_list


# Transcription using Groq's Whisper model
def audio_transcription(file_path: str) -> str:
    """
    Transcribe audio file using Groq's Whisper model.
    """
    # Assurez-vous que la clé API Groq est chargée
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY non trouvée dans les variables d'environnement.")
    client_groq = Groq(api_key=groq_api_key)

    with open(file_path, "rb") as file:
        transcription = client_groq.audio.transcriptions.create(
            file=file,
            model="whisper-large-v3-turbo",
            response_format="verbose_json"
        )
    return transcription.text

# IMAGE GENERATION WITH MISTRAL
def generate_image(prompt, output_dir="images", model="mistral-medium-latest"):
    """
    Génère une image à partir d'un prompt en utilisant l'agent de génération d'images de Mistral.
    """
    # Assurez-vous que la clé API Mistral est chargée
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        raise ValueError("MISTRAL_API_KEY non trouvée dans les variables d'environnement.")
    
    client_mistralai = Mistral(api_key=mistral_api_key)

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

def chat_with_mistral(user_id, dream_context, user_question, chat_history=None):
    """
    Permet à l'utilisateur de discuter avec Mistral en lui fournissant un contexte de rêve.
    """
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        raise ValueError("MISTRAL_API_KEY non trouvée dans les variables d'environnement.")
    
    client = Mistral(api_key=mistral_api_key)

    messages = [{"role": "system", "content": f"Vous êtes un assistant IA spécialisé dans l'interprétation des rêves. Vous devez aider l'utilisateur à comprendre son rêve en répondant à ses questions. Le rêve à analyser est : \"{dream_context}\". Répondez de manière informative et contextuelle."}]
    
    if chat_history:
        # Ajouter l'historique de chat précédent, en excluant le message système initial pour éviter la duplication
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_question})

    try:
        response = client.chat.complete(
            model="mistral-large-latest", # Utilisez un modèle plus puissant pour le chat
            messages=messages,
            temperature=0.7,
            top_p=0.9
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Erreur lors de la communication avec Mistral : {e}"