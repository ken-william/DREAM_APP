# apps/dreams/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
import logging
import os
import json
import uuid # For unique file names
from django.conf import settings # To access MEDIA_ROOT and MEDIA_URL
import traceback # NEW: Import traceback for detailed error logging

from .models import Dream
from .serializers import DreamSerializer
from apps.core.utils import get_groq_client, get_mistral_client # get_mistral_client is used for standard completions

logger = logging.getLogger(__name__)

class DreamViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows dreams to be created, viewed, edited, or deleted.
    """
    queryset = Dream.objects.all()
    serializer_class = DreamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='transcribe-audio')
    def transcribe_audio(self, request):
        if 'audio' not in request.FILES:
            logger.warning("No audio file provided for transcription.")
            return Response({"error": "No audio file provided."}, status=status.HTTP_400_BAD_REQUEST)

        audio_file = request.FILES['audio']

        try:
            groq_client = get_groq_client()
            transcription = groq_client.audio.transcriptions.create(
                file=("dream_audio.webm", audio_file.read()),
                model="whisper-large-v3-turbo" # Using the same model name as your backend.py
            )
            logger.info("Audio transcription successful.")
            return Response({"transcription": transcription.text}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error during audio transcription with Groq:")
            return Response({"error": f"Transcription error: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='generate-image')
    def generate_image(self, request):
        raw_prompt = request.data.get('prompt') # The original dream prompt
        if not raw_prompt:
            logger.warning("No prompt provided for image generation.")
            return Response({"error": "No prompt provided."}, status=status.HTTP_400_BAD_REQUEST)

        mistral_api_key = os.getenv("MISTRAL_API_KEY")
        if not mistral_api_key:
            logger.error("MISTRAL_API_KEY not found in environment variables. Cannot proceed with image generation.")
            return Response({"error": "MISTRAL_API_KEY not found in environment variables. Please configure it."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        image_agent = None # Initialiser image_agent à None
        image_file_url = None # Initialiser image_file_url à None

        try:
            client_mistralai = get_mistral_client() # Using the configured Mistral client

            # 1. Reformulate the prompt for image generation
            logger.info(f"Attempting to reformulate prompt: '{raw_prompt}'")
            try:
                reform_response = client_mistralai.chat.complete(
                    model="mistral-small-latest",
                    messages=[
                        {"role": "system", "content": "You are an assistant who reformulates dream narratives into short, creative, and clear image prompts, optimized for visual generation. Use descriptive keywords and evocative adjectives, inspired by conceptual art, with a cinematic ambiance. Focus on the essential for an impactful prompt."},
                        {"role": "user", "content": f"Reformulate this dream into a striking, realistic, and evocative image prompt: '{raw_prompt}'."}
                    ]
                )
                image_prompt = reform_response.choices[0].message.content
                logger.info(f"Image prompt reformulated by Mistral: {image_prompt}")
            except Exception as e:
                logger.error(f"Error during prompt reformulation with Mistral: {e}", exc_info=True)
                return Response({"error": f"Error during prompt reformulation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 2. Create a Mistral image generation agent
            logger.info("Attempting to create Mistral image generation agent.")
            try:
                image_agent = client_mistralai.beta.agents.create(
                    model="mistral-large-latest", # Using mistral-large-latest as specified
                    name="Image Generator",
                    description="Generates images from a prompt.",
                    instructions="Use the image_generation tool to create realistic images.",
                    tools=[{"type": "image_generation"}],
                    completion_args={"temperature": 0.3, "top_p": 0.95},
                )
                logger.info(f"Mistral agent created successfully with ID: {image_agent.id}")
            except Exception as e:
                logger.error(f"Error creating Mistral agent: {e}. Check Mistral API key, permissions, and ensure 'image_generation' tool is available for the model.", exc_info=True)
                return Response({"error": f"Error creating Mistral agent: {e}. Check MISTRAL_API_KEY and agent permissions."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 3. Start a conversation with the agent to generate the image
            logger.info(f"Starting conversation with agent {image_agent.id} for image generation.")
            try:
                conversation_response = client_mistralai.beta.conversations.start(
                    agent_id=image_agent.id,
                    inputs=f"Generate a realistic image based on this dream: {image_prompt}",
                    stream=False,
                )
                logger.info(f"Agent conversation raw response received: {conversation_response}")

                # CHANGEMENT MAJEUR ICI : Correctement extraire le fichier de la réponse de l'agent
                # Look for the generated image file in the conversation response outputs
                found_image_in_response = False
                for output in conversation_response.outputs:
                    logger.info(f"Processing agent output: type='{output.type}', content='{output.content}', files_present={hasattr(output, 'files') and bool(output.files)}")
                    if output.type == "tool_output" and hasattr(output, 'files') and output.files:
                        for file_item in output.files: # Itérer directement sur les fichiers de l'objet output
                            logger.info(f"Attempting to download file with ID: {file_item.file_id}, type: {file_item.type}")
                            try:
                                # Download the binary image file content using file_id
                                file_data = client_mistralai.files.download(file_id=file_item.file_id).read()

                                # Define the save directory within MEDIA_ROOT
                                media_dir = os.path.join(settings.MEDIA_ROOT, 'generated_images')
                                os.makedirs(media_dir, exist_ok=True) # Create the folder if it doesn't exist

                                # Generate a unique filename and save the image
                                # Use file_item.type for the extension (e.g., 'image/jpeg' -> 'jpeg')
                                extension = file_item.type.split('/')[-1] if '/' in file_item.type else 'png' # Default to png
                                unique_filename = f"image_{uuid.uuid4().hex}.{extension}"
                                full_file_path = os.path.join(media_dir, unique_filename)

                                with open(full_file_path, "wb") as f:
                                    f.write(file_data)

                                # Construct the image URL for the frontend
                                image_file_url = os.path.join(settings.MEDIA_URL, 'generated_images', unique_filename).replace(os.sep, '/')
                                logger.info(f"Image saved locally: {full_file_path}, URL: {image_file_url}")
                                found_image_in_response = True
                                break # Image found and saved, exit this inner loop
                            except Exception as download_save_e:
                                logger.error(f"Error downloading or saving image file (file_id: {file_item.file_id}): {download_save_e}", exc_info=True)
                    if found_image_in_response:
                        break # Exit the main outputs loop if image is found

                if not found_image_in_response:
                    logger.warning("No image file found in the conversation response outputs after agent execution. This could mean the agent did not generate an image or the output structure was unexpected.")
                    return Response({"error": "Mistral agent did not return an image. The prompt might have been too abstract or the tool couldn't generate the image."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except Exception as e:
                logger.error(f"Error during Mistral agent conversation or processing its outputs: {e}", exc_info=True)
                return Response({"error": f"Error during image generation conversation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            # Catch any other unexpected errors that might occur outside the specific Mistral calls
            logger.exception("An unhandled exception occurred during the image generation process:")
            return Response({"error": f"An unexpected error occurred during image generation: {e}. Please check server logs for details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Always attempt to delete the agent (commented for debugging as requested)
            if image_agent and hasattr(image_agent, 'id'): # Ensure the agent was created and has an ID
                try:
                    # UNCOMMENT THIS LINE FOR PRODUCTION: client_mistralai.beta.agents.delete(agent_id=image_agent.id)
                    logger.info(f"Agent deletion for {image_agent.id} commented for debugging. UNCOMMENT FOR PRODUCTION.")
                except AttributeError as ae:
                    logger.error(f"AttributeError during agent deletion: {ae}. "
                                 f"Please check that your 'mistralai' library is up to date (pip install --upgrade mistralai).", exc_info=True)
                except Exception as delete_e:
                    logger.error(f"Unexpected error during agent deletion {image_agent.id}: {delete_e}", exc_info=True)

        if image_file_url:
            logger.info(f"Successfully generated and saved image. Returning URL: {image_file_url}")
            return Response({"image_url": image_file_url}, status=status.HTTP_200_OK)
        else:
            logger.error("Final check: image_file_url is None despite prior attempts. This indicates a logical flaw or missed error in the image extraction/saving path.")
            return Response({"error": "Failed to retrieve or save the generated image. Please check server logs for more details and retry with a more precise prompt."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='analyze-emotion')
    def analyze_emotion(self, request):
        text = request.data.get('text')
        if not text:
            logger.warning("No text provided for emotion analysis.")
            return Response({"error": "No text provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mistral_client = get_mistral_client()
            logger.info("Attempting emotion analysis with Mistral.")
            emotion_response = mistral_client.chat.complete(
                model="mistral-small-latest",
                messages=[
                    {"role": "system", "content": (
                        "You are an expert dream interpretation assistant who analyzes present emotions. "
                        "Respond ONLY with a valid JSON containing the keys 'Joie', 'Anxiété', 'Tristesse', 'Colère', 'Peur', 'Surprise', 'Neutre'. "
                        "Assign a score out of 10 (0 being no presence, 10 being very strong presence) for each emotion. "
                        "Never add text before or after the JSON. If an emotion is not relevant, give 0."
                    )},
                    {"role": "user", "content": f"Analyze the emotions of this dream and give me an estimated score out of 10 for each category: '{text}'. If an emotion is not relevant, give 0."}
                ],
                response_format={"type": "json_object"}
            )

            emotion_analysis_raw = emotion_response.choices[0].message.content
            logger.info(f"Raw emotion analysis response from Mistral: {emotion_analysis_raw}")
            received_emotions = json.loads(emotion_analysis_raw)

            expected_emotions_backend = ['Joie', 'Anxiété', 'Tristesse', 'Colère', 'Peur', 'Surprise', 'Neutre']
            validated_analysis = {
                emotion: max(0.0, min(10.0, float(received_emotions.get(emotion, 0))))
                for emotion in expected_emotions_backend
            }

            final_emotion_scores = {k: v / 10.0 for k, v in validated_analysis.items()}
            logger.info(f"Emotion analysis successful: {final_emotion_scores}")
            return Response({"emotion_analysis": final_emotion_scores}, status=status.HTTP_200_OK)
        except json.JSONDecodeError as jde:
            logger.error(f"JSON decoding error in emotion analysis: {jde}. Raw response: {emotion_analysis_raw}", exc_info=True)
            return Response({"error": f"Invalid JSON response from emotion analysis: {jde}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.exception("Error during emotion analysis with Mistral:")
            return Response({"error": f"Error during emotion analysis: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='chat-dream')
    def chat_dream(self, request):
        dream_context = request.data.get('dream_context')
        user_question = request.data.get('user_question')
        chat_history = request.data.get('chat_history', [])

        if not dream_context or not user_question:
            logger.warning("Dream context or user question missing for chat.")
            return Response({"error": "Dream context and user question are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mistral_client = get_mistral_client()

            messages = [
                {"role": "system", "content": f"You are an AI assistant specialized in dream interpretation. You must help the user understand their dream by answering their questions. The dream to analyze is: \"{dream_context}\". Respond informatively and contextually. Do not invent information not related to the dream or general dream interpretation."},
            ]

            for msg in chat_history:
                if msg['role'] in ['user', 'assistant']:
                    messages.append({"role": msg['role'], "content": msg['content']})

            messages.append({"role": "user", "content": user_question})

            logger.info("Starting chat completion with Mistral for dream interpretation.")
            response = mistral_client.chat.complete(
                model="mistral-large-latest",
                messages=messages,
                temperature=0.7,
                top_p=1,
            )

            ai_response = response.choices[0].message.content
            logger.info("Dream chat response received.")
            return Response({"ai_response": ai_response}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Error during AI chat (Mistral):")
            return Response({"error": f"Error during AI chat: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FeedView(viewsets.ReadOnlyModelViewSet):
    queryset = Dream.objects.all()
    serializer_class = DreamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        from apps.interactions.models import Friendship

        public_dreams = self.queryset.filter(visibility='public')

        friends_ids = Friendship.objects.filter(
            Q(user1=user, status='accepted') | Q(user2=user, status='accepted')
        ).values_list('user1_id', 'user2_id')

        friend_users_ids = set()
        for u1_id, u2_id in friends_ids:
            if u1_id != user.id:
                friend_users_ids.add(u1_id)
            if u2_id != user.id:
                friend_users_ids.add(u2_id)

        friends_dreams = self.queryset.filter(user__in=list(friend_users_ids), visibility='friends')

        my_dreams = self.queryset.filter(user=user)

        combined_queryset = (public_dreams | friends_dreams | my_dreams).distinct()
        return combined_queryset.order_by('-timestamp')