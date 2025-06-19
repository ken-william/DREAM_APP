import streamlit as st
import os
import uuid
import dotenv
from mistralai import Mistral
from mistralai.models import ToolFileChunk
from groq import Groq
from streamlit_mic_recorder import mic_recorder
from io import BytesIO
import re
import json
import matplotlib.pyplot as plt
import math

dotenv.load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

st.set_page_config(page_title="Synthétiseur de rêves", layout="centered")
st.title("🌙 Synthétiseur de rêves - Prototype")

st.markdown("### 🎤 Enregistrez un rêve audio")

st.subheader("🎙️ Enregistrement vocal")
audio_bytes = mic_recorder(
    start_prompt="⏺️ Démarrer l'enregistrement",
    stop_prompt="⏹️ Arrêter l'enregistrement",
    just_once=True,
    key="recorder"
)
if audio_bytes and len(audio_bytes['bytes']) > 0:
    with open("temp_recorded.wav", "wb") as f:
        f.write(audio_bytes['bytes'])
    st.session_state.audio_path = "temp_recorded.wav"
    st.success("✅ Enregistrement terminé")
    st.audio("temp_recorded.wav")

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

if st.session_state.get("audio_path") and st.button("🔁 Transcrire et générer l'image"):
    audio_path = st.session_state["audio_path"]

    with st.spinner("Transcription en cours..."):
        try:
            client_groq = Groq(api_key=GROQ_API_KEY)
            with open(audio_path, "rb") as file:
                transcription = client_groq.audio.transcriptions.create(
                    file=file,
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json"
                )
            raw_prompt = transcription.text
            st.success("✅ Transcription terminée")
            st.write("**Texte extrait :**", raw_prompt)
        except Exception as e:
            st.error(f"Erreur lors de la transcription : {e}")
            st.stop()

    with st.spinner("Reformulation du rêve pour la génération d'image..."):
        try:
            client_mistral = Mistral(api_key=MISTRAL_API_KEY)
            reform_response = client_mistral.chat.complete(
                model="mistral-small-latest",
                messages=[
                    {"role": "system", "content": "Tu es un assistant qui reformule des récits de rêve pour en faire des prompts d'image courts et clairs."},
                    {"role": "user", "content": f"Voici un rêve : {raw_prompt}. Donne une description courte pour générer une image."}
                ]
            )
            image_prompt = reform_response.choices[0].message.content
            st.write("**Prompt reformulé :**", image_prompt)
        except Exception as e:
            st.error(f"Erreur lors de la reformulation par Mistral : {e}")
            st.stop()

    with st.spinner("Génération d'image avec Mistral..."):
        try:
            image_agent = client_mistral.beta.agents.create(
                model="mistral-medium-latest",
                name="Image Generator",
                description="Génère des images à partir d’un prompt.",
                instructions="Utilise l’outil image_generation pour créer des images réalistes.",
                tools=[{"type": "image_generation"}],
                completion_args={"temperature": 0.3, "top_p": 0.95},
            )

            response = client_mistral.beta.conversations.start(
                agent_id=image_agent.id,
                inputs=f"Génère une image réaliste à partir de ce rêve : {image_prompt}",
                stream=False,
            )

            os.makedirs("images", exist_ok=True)
            image_found = False
            for output in response.outputs:
                if getattr(output, "type", "") == "tool.execution" and output.name == "image_generation":
                    continue
                if getattr(output, "content", None):
                    for chunk in output.content:
                        if isinstance(chunk, ToolFileChunk):
                            data = client_mistral.files.download(file_id=chunk.file_id).read()
                            unique_name = f"image_{uuid.uuid4().hex}.{chunk.file_type}"
                            path = os.path.join("images", unique_name)
                            with open(path, "wb") as img_file:
                                img_file.write(data)
                            st.image(path, caption="🖼️ Image générée à partir de votre rêve")
                            image_found = True
            if not image_found:
                st.warning("Aucune image n’a été générée par Mistral. Voici la sortie brute :")
                for output in response.outputs:
                    st.write(output)
        except Exception as e:
            st.error(f"Erreur lors de la génération d'image : {e}")

    with st.spinner("Analyse des émotions du rêve..."):
        try:
            emotion_response = client_mistral.chat.complete(
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
            st.write("**Analyse émotionnelle (en %)**")
            st.json(emotion_json)

            labels = list(emotion_json.keys())
            values = [emotion_json[k] for k in labels]
            fig, ax = plt.subplots()
            ax.pie(values, labels=labels, autopct='%1.0f%%', startangle=90)
            ax.axis('equal')
            st.pyplot(fig)
        except Exception as e:
            st.error(f"Erreur lors de l'analyse émotionnelle : {e}")