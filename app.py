# app.py
import streamlit as st
import os
import uuid
import dotenv
import re
import json
import matplotlib.pyplot as plt
import math
import datetime # Ajout pour les timestamps

# Import Streamlit Extras for styling
from streamlit_extras.stylable_container import stylable_container
from streamlit_extras.colored_header import colored_header
from streamlit_mic_recorder import mic_recorder
from mistralai import Mistral

# Import des fonctions du backend
# Assurez-vous que backend.py est à jour avec les fonctions d'authentification et de sauvegarde des rêves
from backend import audio_transcription, generate_image, register_user, login_user, save_dream, get_user_dreams, chat_with_mistral, init_db

# Initialiser la base de données si ce n'est pas déjà fait
init_db()

dotenv.load_dotenv()

# Assurez-vous que ces clés sont définies dans votre fichier .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# --- Configuration de la page et styles généraux ---
st.set_page_config(page_title="Synthétiseur de Rêves", layout="wide", initial_sidebar_state="expanded")

# --- Styles CSS personnalisés (Le code CSS est le même que précédemment) ---
st.markdown(
    """
    <style>
    /* Import Google Fonts pour un look premium */
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600&display=swap');

    /* Application des polices globales */
    body, .stApp, .stButton, .stTextInput, .stTextArea, .stFileUploader, .stAudio, .st-emotion-cache-1jm692t {
        font-family: 'Montserrat', sans-serif;
    }
    h1, h2, h3, h4, h5, h6, .st-emotion-cache-10wump9 div[data-testid="stMarkdownContainer"] h3 {
        font-family: 'Playfair Display', serif;
    }

    /* Styles généraux du corps de l'application */
    body {
        background-color: #000000; /* Noir profond */
        color: #FFFFFF; /* Blanc pur pour le texte par défaut */
    }

    /* Conteneur principal de Streamlit */
    .stApp {
        background-color: #000000;
        color: #FFFFFF;
    }

    /* Titre principal de la page d'accueil */
    h1.main-title {
        color: #FFFFFF;
        text-align: center;
        font-weight: 700;
        font-size: 4.5em; /* Grande taille pour l'impact */
        letter-spacing: -2px;
        margin-top: 60px;
        margin-bottom: 20px;
        text-shadow: 0 0 15px rgba(255,255,255,0.1), 0 0 30px rgba(255,255,255,0.05); /* Effet lumineux subtil */
    }

    /* Sous-titre principal de la page d'accueil */
    .subtitle {
        color: #B0B0B0; /* Gris clair pour la distinction */
        text-align: center;
        font-size: 1.5em;
        margin-bottom: 60px;
        line-height: 1.5;
    }

    /* Titres de sections (H3) */
    h3 {
        color: #FFFFFF;
        text-align: center;
        font-weight: 600;
        font-size: 2.2em;
        margin-top: 60px;
        margin-bottom: 30px;
        position: relative;
        padding-bottom: 15px;
    }
    h3::after { /* Ligne décorative sous les titres de section */
        content: '';
        display: block;
        width: 80px;
        height: 2px;
        background: linear-gradient(to right, #7e22ce, #a755f7); /* Dégradé violet */
        margin: 10px auto 0 auto;
    }
    
    /* Adaptation du colored_header */
    .st-emotion-cache-10wump9 p {
        color: #AAAAAA !important;
        font-size: 1.1em;
        text-align: center;
        margin-top: -15px;
        margin-bottom: 20px;
    }
    .st-emotion-cache-10wump9 div[data-testid="stMarkdownContainer"] h3 {
        color: #FFFFFF !important;
        border-bottom: none !important;
        padding-bottom: 0 !important;
        text-align: center;
        font-family: 'Playfair Display', serif !important;
    }
    .st-emotion-cache-10wump9 div[data-testid="stMarkdownContainer"] h3::after {
        content: '';
        display: block;
        width: 80px;
        height: 2px;
        background: linear-gradient(to right, #7e22ce, #a755f7);
        margin: 10px auto 0 auto;
    }

    /* Conteneurs de contenu (Spinner, Alertes, etc.) */
    .stSpinner + div > div, 
    .stAlert {
        background-color: #121212; /* Gris très foncé, proche du noir */
        border: 1px solid #333333;
        border-radius: 15px; /* Bords plus arrondis */
        padding: 35px;
        margin-top: 30px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.6); /* Ombre luxueuse */
        transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
    }
    .stSpinner + div > div:hover, .stAlert:hover {
        transform: translateY(-5px); /* Effet subtil au survol */
        box-shadow: 0 12px 25px rgba(0,0,0,0.7);
    }

    /* Styles spécifiques des alertes */
    .stAlert.success { background-color: #1a361a; border-color: #2b542b; color: #d4edda; }
    .stAlert.error { background-color: #4a1e1e; border-color: #721c24; color: #f8d7da; }
    .stAlert.info { background-color: #1e2a3a; border-color: #314b67; color: #d1ecf1; }

    /* Boutons standards */
    .stButton > button {
        background-color: #333333;
        color: #FFFFFF;
        border: 1px solid #555555;
        border-radius: 10px;
        padding: 14px 30px;
        font-weight: 600;
        font-size: 1.15em;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.2s, border-color 0.3s, box-shadow 0.3s;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    }
    .stButton > button:hover {
        background-color: #555555;
        border-color: #777777;
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.5);
    }
    .stButton > button:active {
        transform: translateY(0);
        background-color: #222222;
        border-color: #444444;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    }

    /* Bouton principal de traitement (Analyser mon Rêve) */
    div[data-testid="stVerticalBlock"] > div > div > div > div > button {
        background-color: #7e22ce; /* Violet profond, luxueux */
        border-color: #9333ea;
        padding: 18px 40px; /* Plus grand pour le focus */
        font-size: 1.4em;
        font-weight: 700;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    }
    div[data-testid="stVerticalBlock"] > div > div > div > div > button:hover {
        background-color: #9333ea;
        border-color: #a755f7;
        transform: translateY(-5px);
        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.6);
    }
    div[data-testid="stVerticalBlock"] > div > div > div > div > button:active {
        background-color: #6d28d9;
        border-color: #8b5cf6;
        transform: translateY(0);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    }

    /* Images générées */
    .stImage {
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.7);
        margin-top: 30px;
    }
    .stImage img {
        border-radius: 15px;
    }

    /* Diagramme circulaire des émotions */
    .stPlotlyChart {
        background-color: #121212;
        border: 1px solid #333333;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        margin-top: 30px;
    }

    /* Bouton d'enregistrement Micro (mic_recorder) */
    div[data-testid="stMicRecorder"] button {
        background-color: #9333ea; /* Violet pour l'enregistrement */
        border-radius: 50% !important;
        width: 90px; /* Taille augmentée */
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 30px auto; /* Centrer et espacer */
        font-size: 38px; /* Icône plus grande */
        color: white;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
        transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
        border: none !important;
    }
    div[data-testid="stMicRecorder"] button:hover {
        background-color: #a755f7;
        transform: scale(1.05); /* Léger agrandissement au survol */
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.6);
    }
    div[data-testid="stMicRecorder"] button:active {
        transform: scale(0.98);
        background-color: #6d28d9;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    div[data-testid="stMicRecorder"] p {
        display: none; /* Masquer le texte par défaut du composant */
    }

    /* Style du texte général */
    div[data-testid="stMarkdownContainer"] p, div[data-testid="stText"] {
        font-family: 'Montserrat', sans-serif;
        color: #E0E0E0; /* Gris clair pour le texte courant */
        line-height: 1.6;
    }

    /* Styles de la Sidebar */
    .st-emotion-cache-vk3305 { /* Classe pour le conteneur principal de la sidebar */
        background-color: #0d0d0d !important; /* Fond noir très foncé */
        border-right: 1px solid #222222; /* Bordure subtile */
        padding-top: 30px;
    }
    .st-emotion-cache-1jm692t { /* Classe pour les éléments à l'intérieur de la sidebar */
        color: #FFFFFF !important;
    }
    /* Titres dans la sidebar */
    .st-emotion-cache-1jm696d div[data-testid="stMarkdownContainer"] h2 {
        font-family: 'Playfair Display', serif;
        color: #FFFFFF;
        text-align: left;
        margin-bottom: 20px;
        font-size: 1.8em;
    }
    /* Boutons de navigation dans la sidebar */
    .st-emotion-cache-1jm696d .stButton button {
        background-color: transparent !important;
        border: none !important;
        color: #BBBBBB !important;
        font-family: 'Montserrat', sans-serif !important;
        font-weight: 400 !important;
        font-size: 1.1em !important;
        text-align: left !important;
        padding: 10px 15px !important;
        width: 100%;
        margin-bottom: 5px;
        transition: background-color 0.2s, color 0.2s;
        box-shadow: none !important; /* Pas d'ombre pour les boutons de navigation */
    }
    .st-emotion-cache-1jm696d .stButton button:hover {
        background-color: #222222 !important;
        color: #FFFFFF !important;
        transform: none !important; /* Supprimer l'effet de translation */
    }
    .st-emotion-cache-1jm696d .stButton button:active {
        background-color: #333333 !important;
        color: #FFFFFF !important;
        transform: none !important;
    }

    /* Style du chat dans la sidebar */
    .chat-container {
        background-color: #0d0d0d;
        border-radius: 10px;
        padding: 15px;
        height: 400px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    .chat-message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
    }
    .user-message {
        background-color: #7e22ce; /* Violet pour l'utilisateur */
        color: white;
        align-self: flex-end; /* Alignement à droite */
        text-align: right;
    }
    .ai-message {
        background-color: #333333; /* Gris foncé pour l'IA */
        color: white;
        align-self: flex-start; /* Alignement à gauche */
        text-align: left;
    }
    .chat-input-container {
        margin-top: 15px;
        display: flex;
        gap: 10px;
    }
    /* Styles pour les champs de texte du chat */
    .chat-input-container input, .chat-input-container textarea {
        flex-grow: 1;
        background-color: #222222 !important;
        color: white !important;
        border: 1px solid #444444 !important;
        border-radius: 8px !important;
        padding: 10px !important;
    }
    /* Bouton d'envoi du chat */
    .chat-input-container button {
        background-color: #555555 !important;
        border-color: #777777 !important;
        color: white !important;
        border-radius: 8px !important;
        padding: 10px 15px !important;
    }
    .chat-input-container button:hover {
        background-color: #777777 !important;
    }

    /* Suppression des marges/padding par défaut de Streamlit pour un meilleur contrôle */
    .st-emotion-cache-1cpxdwv { /* conteneur principal */
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
    }
    /* Padding du contenu principal */
    .main .block-container {
        padding-left: 5rem;
        padding-right: 5rem;
        padding-top: 3rem;
        padding-bottom: 3rem;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# Initialisation de la page actuelle, de l'historique du chat et de l'état de connexion
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'home'
if 'chat_messages' not in st.session_state:
    st.session_state.chat_messages = []
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'username' not in st.session_state:
    st.session_state.username = None
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
# Ajout pour l'historique de chat spécifique au rêve analysé
if 'dream_chat_history' not in st.session_state:
    st.session_state.dream_chat_history = []
if 'current_dream_for_chat' not in st.session_state:
    st.session_state.current_dream_for_chat = None


# --- Fonctions utilitaires (conservées) ---
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

# --- Sidebar (Barre Latérale) ---
with st.sidebar:
    st.markdown("<h2>Synthétiseur</h2>", unsafe_allow_html=True) # Titre de la sidebar
    st.markdown("---")

    if st.session_state.logged_in:
        st.success(f"Bienvenue, {st.session_state.username}!")
        if st.button("Accueil", key="nav_home", use_container_width=True):
            st.session_state.current_page = 'home'
        if st.button("Analyser Rêve", key="nav_analyze", use_container_width=True):
            st.session_state.current_page = 'analyze'
        if st.button("Chat sur les Rêves", key="nav_chat", use_container_width=True):
            st.session_state.current_page = 'chat'
        if st.button("Historique des Rêves", key="nav_history", use_container_width=True):
            st.session_state.current_page = 'history'
        st.markdown("---")
        if st.button("Déconnexion", key="logout_button", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.username = None
            st.session_state.user_id = None
            st.session_state.current_page = 'home'
            st.session_state.chat_messages = [] # Nettoyer le chat global
            st.session_state.dream_chat_history = [] # Nettoyer l'historique de chat du rêve
            st.session_state.current_dream_for_chat = None # Réinitialiser le rêve pour le chat
            st.rerun()
    else:
        # Boutons d'authentification si non connecté
        if st.button("Se Connecter", key="nav_login", use_container_width=True):
            st.session_state.current_page = 'login'
        if st.button("Créer un Compte", key="nav_register", use_container_width=True):
            st.session_state.current_page = 'register'
        st.markdown("---")
        if st.button("Accueil", key="nav_home_logged_out", use_container_width=True):
            st.session_state.current_page = 'home'

    st.markdown("---")
    st.markdown("""
        <div style="font-family: 'Montserrat', sans-serif; color: #888888; font-size: 0.9em; text-align: center; margin-top: 20px;">
            Version 1.0<br>
            © 2024 DreamAI Inc.
        </div>
    """, unsafe_allow_html=True)

# --- Contenu Principal de l'Application en fonction de la page sélectionnée ---

# Page d'Accueil (ouverte à tous)
if st.session_state.current_page == 'home':
    st.markdown("<h1 class='main-title'>Explorez les Profondeurs de Vos Rêves</h1>", unsafe_allow_html=True)
    st.markdown("<p class='subtitle'>Transformez vos récits nocturnes en expériences visuelles et émotionnelles uniques grâce à l'Intelligence Artificielle.</p>", unsafe_allow_html=True)
    
    # Image de couverture pour la page d'accueil
    st.image("https://images.unsplash.com/photo-1610472192601-42116c9f8186?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", caption="L'univers onirique vous attend", use_container_width=True)
    
    # Section "Notre Vision"
    st.markdown("""
        <div style='font-family: \"Montserrat\", sans-serif; font-size: 1.1em; color: #E0E0E0; margin-top: 50px; padding: 20px 40px; background-color: #1a1a1a; border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.6);'>
            <h3 style='text-align: center; font-family: \"Playfair Display\", serif; border-bottom: none; padding-bottom: 0; margin-bottom: 20px; font-weight: 700;'>Notre Vision</h3>
            <p>Le Synthétiseur de Rêves est conçu pour révolutionner la façon dont vous interagissez avec votre monde onirique. En combinant les dernières avancées en matière de reconnaissance vocale, de génération d'images et d'analyse sémantique, nous offrons une plateforme intuitive pour :</p>
            <ul>
                <li>Capturer l'essence de vos rêves par la voix.</li>
                <li>Visualiser des scènes oniriques uniques.</li>
                <li>Comprendre les émotions profondes qu'ils recèlent.</li>
            </ul>
            <p style='text-align: center; margin-top: 30px; font-weight: 600;'>Plongez dans l'inconnu, révélez le caché.</p>
        </div>
    """, unsafe_allow_html=True)

# Pages d'authentification (Login / Register)
elif st.session_state.current_page == 'login':
    st.markdown("<h1 style='text-align: center; font-family: \"Playfair Display\", serif;'>Connexion</h1>", unsafe_allow_html=True)
    with st.form("login_form"):
        username = st.text_input("Nom d'utilisateur", key="login_username")
        password = st.text_input("Mot de passe", type="password", key="login_password")
        submit_button = st.form_submit_button("Se Connecter")

        if submit_button:
            if username and password:
                user_data = login_user(username, password)
                if user_data:
                    st.session_state.logged_in = True
                    st.session_state.user_id = user_data[0]
                    st.session_state.username = user_data[1]
                    st.success(f"Connexion réussie ! Bienvenue, {st.session_state.username}.")
                    st.session_state.current_page = 'analyze' # Rediriger vers l'analyse des rêves
                    st.rerun()
                else:
                    st.error("Nom d'utilisateur ou mot de passe incorrect.")
            else:
                st.warning("Veuillez entrer un nom d'utilisateur et un mot de passe.")

elif st.session_state.current_page == 'register':
    st.markdown("<h1 style='text-align: center; font-family: \"Playfair Display\", serif;'>Créer un Compte</h1>", unsafe_allow_html=True)
    with st.form("register_form"):
        username = st.text_input("Nom d'utilisateur", key="register_username")
        password = st.text_input("Mot de passe", type="password", key="register_password")
        confirm_password = st.text_input("Confirmer le mot de passe", type="password", key="register_confirm_password")
        submit_button = st.form_submit_button("Créer le Compte")

        if submit_button:
            if username and password and confirm_password:
                if password == confirm_password:
                    user_id = register_user(username, password)
                    if user_id:
                        st.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.")
                        st.session_state.current_page = 'login' # Rediriger vers la page de connexion
                        st.rerun()
                    else:
                        st.error("Ce nom d'utilisateur existe déjà. Veuillez en choisir un autre.")
                else:
                    st.error("Les mots de passe ne correspondent pas.")
            else:
                st.warning("Veuillez remplir tous les champs.")

# Pages nécessitant une connexion
elif not st.session_state.logged_in:
    st.warning("Veuillez vous connecter ou créer un compte pour accéder à cette fonctionnalité.")
    st.session_state.current_page = 'login' # Rediriger automatiquement vers la page de connexion
    st.rerun()

else: # L'utilisateur est connecté, afficher les pages protégées
    if st.session_state.current_page == 'analyze':
        st.markdown("<h1 style='text-align: center; font-family: \"Playfair Display\", serif;'>Synthétiseur de Rêves</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; font-size: 1.1em; color: #BBBBBB;'>Laissez l'IA analyser et visualiser votre monde onirique.</p>", unsafe_allow_html=True)

        # --- Section Capture du rêve ---
        colored_header(label="Capturez votre rêve", description="Enregistrez ou téléchargez un fichier audio de votre rêve.", color_name="violet-70")

        st.markdown("#### Enregistrement vocal")
        audio_bytes = mic_recorder(
            start_prompt="",
            stop_prompt="",
            just_once=True,
            key="recorder_analyze"
        )

        if audio_bytes and len(audio_bytes['bytes']) > 0:
            st.session_state.audio_data = audio_bytes['bytes']
            st.success("Enregistrement terminé.")
            st.audio(st.session_state.audio_data, format='audio/wav')

        st.markdown("Télécharger un fichier audio")
        uploaded_file = st.file_uploader("Choisissez un fichier audio (.wav, .mp3)", type=["wav", "mp3"], key="uploader_analyze")

        if uploaded_file is not None:
            st.session_state.audio_data = uploaded_file.read()
            st.success(f"Fichier '{uploaded_file.name}' téléchargé.")
            st.audio(st.session_state.audio_data, format=uploaded_file.type)

        # --- Bouton de traitement principal ---
        if st.session_state.get("audio_data"):
            with stylable_container(
                key="process_button_container",
                css_styles="""
                    button { 
                        background-color: #7e22ce;
                        color: white;
                        border: 1px solid #9333ea;
                        border-radius: 15px;
                        padding: 18px 40px;
                        font-weight: 700;
                        font-size: 1.5em;
                        width: 100%;
                        margin-top: 40px;
                        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
                    }
                    button:hover {
                        background-color: #9333ea;
                        border-color: #a755f7;
                        transform: translateY(-3px);
                    }
                    button:active {
                        transform: translateY(0);
                    }
                """,
            ):
                process_button = st.button("Analyser mon Rêve", key="analyze_dream_button")
        else:
            st.info("Enregistrez ou téléchargez un audio pour lancer l'analyse.")
            process_button = False

        if process_button:
            audio_path = "temp_processing.wav"
            with open(audio_path, "wb") as f:
                f.write(st.session_state.audio_data)

            st.session_state.raw_prompt = None
            st.session_state.image_path = None
            st.session_state.emotion_json = None

            # --- Transcription ---
            colored_header(label="Transcription du rêve", description="Conversion de votre audio en texte.", color_name="violet-70")
            with st.spinner("Transcription audio en texte..."):
                try:
                    st.session_state.raw_prompt = audio_transcription(audio_path)
                    st.success("Transcription terminée.")
                    st.markdown(f"**Votre rêve :**\n\n*\"_{st.session_state.raw_prompt}_\"*")
                except Exception as e:
                    st.error(f"Erreur lors de la transcription : {e}")
                    st.session_state.raw_prompt = None # Assurez-vous que le prompt est None en cas d'erreur
            
            # Stocker le raw_prompt pour le chat futur
            if st.session_state.raw_prompt:
                st.session_state.current_dream_for_chat = st.session_state.raw_prompt
                st.session_state.dream_chat_history = [] # Réinitialiser l'historique du chat pour ce nouveau rêve

            # --- Génération d'image ---
            if st.session_state.raw_prompt:
                colored_header(label="Visualisation du rêve", description="Création d'une image unique à partir de votre récit.", color_name="violet-70")
                with st.spinner("Génération de l'image..."):
                    try:
                        # Assurez-vous d'avoir la clé MISTRAL_API_KEY disponible ici ou passée à generate_image
                        if not MISTRAL_API_KEY:
                            raise ValueError("MISTRAL_API_KEY non trouvée. Veuillez la définir dans votre fichier .env")
                        
                        client_mistral = Mistral(api_key=MISTRAL_API_KEY)
                        reform_response = client_mistral.chat.complete(
                            model="mistral-small-latest",
                            messages=[
                                {"role": "system", "content": "Tu es un assistant qui reformule des récits de rêve pour en faire des prompts d'image courts, créatifs et clairs, optimisés pour la génération visuelle. Utilise des mots-clés descriptifs et des adjectifs évocateurs, inspirés de l'art conceptuel, avec une ambiance cinématographique. Concentre-toi sur l'essentiel pour un prompt percutant."},
                                {"role": "user", "content": f"Reformule ce rêve en un prompt d'image percutant, réaliste et évocateur : '{st.session_state.raw_prompt}'."}
                            ]
                        )
                        image_prompt = reform_response.choices[0].message.content
                        st.info(f"**Prompt d'image :**\n\n*\"{image_prompt}\"*")

                        image_output_path = generate_image(f"Génère une image réaliste basée sur ce rêve : {image_prompt}")

                        st.session_state.image_path = image_output_path
                        
                        if st.session_state.image_path:
                            st.success("Image générée !")
                            st.image(st.session_state.image_path, caption="Votre rêve visualisé", use_container_width=True)
                        else:
                            st.warning("Aucune image n’a été générée. Réessayez ou ajustez le rêve.")
                    except Exception as e:
                        st.error(f"Erreur lors de la génération d'image : {e}")

            # --- Analyse émotionnelle ---
            if st.session_state.raw_prompt:
                colored_header(label="Analyse émotionnelle", description="Décodage des émotions dominantes de votre rêve.", color_name="violet-70")
                with st.spinner("Analyse des émotions..."):
                    try:
                        if not MISTRAL_API_KEY:
                            raise ValueError("MISTRAL_API_KEY non trouvée. Veuillez la définir dans votre fichier .env")

                        client_mistral_emotion = Mistral(api_key=MISTRAL_API_KEY)

                        emotion_response = client_mistral_emotion.chat.complete(
                            model="mistral-small-latest",
                            messages=[
                                {"role": "system", "content": (
                                    "Tu es un assistant expert en interprétation de rêves qui analyse les émotions présentes. "
                                    "Réponds UNIQUEMENT avec un JSON valide contenant les clés 'Joie', 'Anxiété', 'Tristesse', 'Colère', 'Peur', 'Surprise', 'Neutre'. "
                                    "Assigne un score sur 10 (0 étant aucune présence, 10 étant très forte présence) pour chaque émotion. "
                                    "Ne rajoute jamais du texte avant ou après le JSON. Si une émotion n'est pas présente, son score est 0."
                                )},
                                {"role": "user", "content": f"Analyse les émotions de ce rêve et donne-moi une estimation en score sur 10 pour chaque catégorie : '{st.session_state.raw_prompt}'. Si une émotion n'est pas pertinente, donne 0."}
                            ]
                        )
                        text = emotion_response.choices[0].message.content
                        match = re.search(r"\{.*\}", text, re.DOTALL)
                        if not match:
                            raise ValueError("Aucun JSON détecté dans la réponse d'analyse émotionnelle.")
                        
                        emotion_json_raw = json.loads(match.group(0))
                        
                        expected_emotions = ['Joie', 'Anxiété', 'Tristesse', 'Colère', 'Peur', 'Surprise', 'Neutre']
                        full_emotion_json_raw = {emotion: emotion_json_raw.get(emotion, 0) for emotion in expected_emotions}

                        st.session_state.emotion_json = softmax(full_emotion_json_raw)
                        st.success("Analyse émotionnelle terminée.")
                        st.markdown("**Répartition des émotions :**")
                        
                        for emotion, percentage in st.session_state.emotion_json.items():
                            st.write(f"**{emotion} :** {percentage}%")
                            st.progress(percentage / 100.0)

                        labels = list(st.session_state.emotion_json.keys())
                        values = [st.session_state.emotion_json[k] for k in labels]
                        
                        fig, ax = plt.subplots(figsize=(7, 7))
                        ax.pie(values, labels=labels, autopct='%1.0f%%', startangle=90,
                                colors=['#FFDDC1', '#FFADAD', '#A0CED9', '#B5EAD7', '#C7CEEA', '#FCE9AD', '#E0E0E0'])
                        ax.axis('equal')
                        ax.set_title("Distribution émotionnelle de votre rêve", color='#FFFFFF')
                        st.pyplot(fig)

                    except Exception as e:
                        st.error(f"Erreur lors de l'analyse émotionnelle : {e}")

            # --- Sauvegarde du rêve dans l'historique si tout est complet ---
            if st.session_state.raw_prompt and st.session_state.image_path and st.session_state.emotion_json and st.session_state.user_id:
                try:
                    # Convertir le JSON des émotions en string avant de sauvegarder
                    emotion_json_str = json.dumps(st.session_state.emotion_json)
                    save_dream(
                        st.session_state.user_id,
                        st.session_state.raw_prompt,
                        st.session_state.image_path,
                        emotion_json_str
                    )
                    st.success("Rêve sauvegardé dans votre historique !")
                except Exception as e:
                    st.error(f"Erreur lors de la sauvegarde du rêve : {e}")

            # Nettoyage du fichier audio temporaire
            if os.path.exists(audio_path):
                os.remove(audio_path)

    elif st.session_state.current_page == 'chat':
        st.markdown("<h1 style='text-align: center; font-family: \"Playfair Display\", serif;'>Dialogue Onirique</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; font-size: 1.1em; color: #BBBBBB;'>Discutez avec notre IA pour explorer vos rêves en profondeur.</p>", unsafe_allow_html=True)

        if not st.session_state.current_dream_for_chat:
            st.info("Veuillez analyser un rêve d'abord pour pouvoir discuter à son sujet.")
        else:
            st.markdown(f"**Contexte du rêve actuel :** *\"_{st.session_state.current_dream_for_chat[:150]}..._\"*")

            # Conteneur pour les messages de chat
            st.markdown('<div class="chat-container">', unsafe_allow_html=True)
            for msg in st.session_state.dream_chat_history: # Utiliser l'historique spécifique au rêve
                if msg["role"] == "user":
                    st.markdown(f'<div class="chat-message user-message">{msg["content"]}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(f'<div class="chat-message ai-message">{msg["content"]}</div>', unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)

            # Entrée de texte pour le chat
            with st.form("chat_form", clear_on_submit=True):
                col1, col2 = st.columns([5, 1])
                with col1:
                    user_input = st.text_input("Votre message...", label_visibility="collapsed")
                with col2:
                    send_button = st.form_submit_button("Envoyer")
            
            if send_button and user_input:
                st.session_state.dream_chat_history.append({"role": "user", "content": user_input})
                with st.spinner("L'IA réfléchit..."):
                    try:
                        ai_response = chat_with_mistral(
                            st.session_state.user_id, # Passer l'ID utilisateur (peut être utilisé pour la personnalisation future)
                            st.session_state.current_dream_for_chat,
                            user_input,
                            st.session_state.dream_chat_history # Passer l'historique complet pour maintenir le contexte
                        )
                        st.session_state.dream_chat_history.append({"role": "ai", "content": ai_response})
                    except Exception as e:
                        st.error(f"Erreur lors de la discussion avec l'IA : {e}")
                st.rerun() # Pour rafraîchir l'affichage du chat

    elif st.session_state.current_page == 'history':
        st.markdown("<h1 style='text-align: center; font-family: \"Playfair Display\", serif;'>Historique des Rêves</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; font-size: 1.1em; color: #BBBBBB;'>Retrouvez et explorez tous vos rêves passés.</p>", unsafe_allow_html=True)

        user_dreams = get_user_dreams(st.session_state.user_id)

        if not user_dreams:
            st.info("Vous n'avez pas encore d'historique de rêves. Analysez un rêve pour commencer !")
        else:
            for i, dream in enumerate(user_dreams):
                # Utilisation d'un expander pour chaque rêve
                with st.expander(f"Rêve du {datetime.datetime.strptime(dream['timestamp'], '%Y-%m-%d %H:%M:%S').strftime('%d/%m/%Y à %H:%M')} (ID: {dream['id']})"):
                    st.markdown(f"**Votre Récit :**\n\n*\"_{dream['raw_prompt']}_\"*")

                    if dream['image_path'] and os.path.exists(dream['image_path']):
                        st.image(dream['image_path'], caption="Image du rêve", use_container_width=True)
                    else:
                        st.warning("Image non disponible ou introuvable.")

                    st.markdown("**Analyse Émotionnelle :**")
                    if dream['emotion_analysis']:
                        for emotion, percentage in dream['emotion_analysis'].items():
                            st.write(f"**{emotion} :** {percentage}%")
                            st.progress(percentage / 100.0)
                        
                        labels = list(dream['emotion_analysis'].keys())
                        values = [dream['emotion_analysis'][k] for k in labels]
                        fig, ax = plt.subplots(figsize=(6, 6))
                        ax.pie(values, labels=labels, autopct='%1.0f%%', startangle=90,
                                colors=['#FFDDC1', '#FFADAD', '#A0CED9', '#B5EAD7', '#C7CEEA', '#FCE9AD', '#E0E0E0'])
                        ax.axis('equal')
                        ax.set_title("Distribution émotionnelle", color='#FFFFFF')
                        st.pyplot(fig)
                    else:
                        st.info("Analyse émotionnelle non disponible.")
                    
                    # Bouton pour utiliser ce rêve comme contexte pour le chat
                    if st.button(f"Discuter de ce rêve (ID: {dream['id']})", key=f"chat_dream_{dream['id']}", use_container_width=True):
                        st.session_state.current_dream_for_chat = dream['raw_prompt']
                        st.session_state.dream_chat_history = [] # Réinitialiser l'historique pour le nouveau contexte
                        st.session_state.current_page = 'chat'
                        st.rerun()


# --- Footer Minimaliste ---
st.markdown("---")
st.markdown("""
    <div style="text-align: center; color: #888888; font-size: 0.85em; font-family: 'Montserrat', sans-serif; padding-top: 20px; padding-bottom: 20px;">
        Conçu pour révéler les mystères du subconscient.<br>
        © 2024 DreamAI. Tous droits réservés.
    </div>
    """, unsafe_allow_html=True)