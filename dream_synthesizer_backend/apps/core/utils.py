# apps/core/utils.py
import os
from groq import Groq
from mistralai.client import MistralClient

def get_groq_client():
    """Returns a Groq API client instance."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Cette erreur est levée si la clé n'est pas trouvée
        raise ValueError("GROQ_API_KEY not found in environment variables.")
    print(f"DEBUG: GROQ_API_KEY chargée: {api_key[:5]}...{api_key[-5:]}") # <--- AJOUTEZ CETTE LIGNE
    return Groq(api_key=api_key)

def get_mistral_client():
    """Returns a Mistral AI client instance."""
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not found in environment variables.")
    return MistralClient(api_key=api_key)