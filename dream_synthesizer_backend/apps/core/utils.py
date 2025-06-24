# This file will contain utility functions and API clients for external services
# (e.g., Groq, Mistral, DALL-E)

import os
from groq import Groq
from mistralai.client import MistralClient

# Placeholder for API clients
# These will be initialized with API keys from settings.py (via environment variables)

def get_groq_client():
    """Returns a Groq API client instance."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables.")
    return Groq(api_key=api_key)

def get_mistral_client():
    """Returns a Mistral AI client instance."""
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not found in environment variables.")
    return MistralClient(api_key=api_key)

# Add similar functions for DALL-E or other services here