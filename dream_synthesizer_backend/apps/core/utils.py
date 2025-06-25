# apps/core/utils.py
import os
from groq import Groq
from mistralai import Mistral # CHANGEMENT CRUCIAL : Import de la nouvelle classe client Mistral

def get_groq_client():
    """
    Initialise et retourne un client Groq.
    Assurez-vous que GROQ_API_KEY est défini dans les variables d'environnement.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY non trouvée dans les variables d'environnement.")
    return Groq(api_key=api_key)

def get_mistral_client():
    """
    Initialise et retourne un client Mistral (nouvelle API).
    Assurez-vous que MISTRAL_API_KEY est défini dans les variables d'environnement.
    """
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY non trouvée dans les variables d'environnement.")
    # CHANGEMENT CRUCIAL : Utilisation de la nouvelle classe Mistral
    return Mistral(api_key=api_key)