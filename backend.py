import os
import uuid
import dotenv

from mistralai import Mistral
from mistralai.models import ToolFileChunk
from groq import Groq

# Load environment variables
dotenv.load_dotenv()

# Transcription using Groq's Whisper model

def audio_transcription(file_path: str) -> str:
    """
    Transcribe audio file using Groq's Whisper model.
    """
    client_groq = Groq(api_key=os.environ["GROQ_API_KEY"])

    with open(file_path, "rb") as file:
        transcription = client_groq.audio.transcriptions.create(
            file=file,
            model="whisper-large-v3-turbo",
            response_format="verbose_json"
        )
    return transcription.text

# IMAGE GENERATION WITH MISTRAL
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

if __name__ == "__main__":
    prompt = audio_transcription("audios/audio_test.mp3")
    print(f"🎙️ Transcription : {prompt}")
    image_path = generate_image(prompt)
