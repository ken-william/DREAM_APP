# dream_synthesizer_backend/apps/dreams/tests.py
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
import json
import io
from unittest.mock import patch, MagicMock
from django.conf import settings # Pour accéder à MEDIA_ROOT et MEDIA_URL

from .models import Dream

class DreamAPITests(TestCase):
    """
    Tests unitaires pour les vues API de l'application Dreams.
    """
    def setUp(self):
        # Créer un utilisateur de test
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='testpassword'
        )
        # Obtenir un token JWT pour l'authentification
        self.client = APIClient()
        response = self.client.post(
            reverse('token_obtain_pair'), # 'token_obtain_pair' est le nom d'URL de simplejwt
            {'username': 'testuser', 'password': 'testpassword'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_dream_creation(self):
        """
        Teste la création d'un rêve via l'API.
        """
        data = {
            'raw_prompt': 'Un rêve où je vole au-dessus des nuages.',
            'image_path': 'http://example.com/image.jpg',
            'emotion_analysis': {'Joie': 0.8, 'Surprise': 0.5},
            'visibility': 'public'
        }
        response = self.client.post(reverse('dream_list_create'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Dream.objects.count(), 1)
        self.assertEqual(Dream.objects.get().raw_prompt, 'Un rêve où je vole au-dessus des nuages.')

    def test_dream_list_retrieval(self):
        """
        Teste la récupération de la liste des rêves de l'utilisateur.
        """
        Dream.objects.create(user=self.user, raw_prompt='Rêve 1', visibility='private')
        Dream.objects.create(user=self.user, raw_prompt='Rêve 2', visibility='public')
        
        response = self.client.get(reverse('dream_list_create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['raw_prompt'], 'Rêve 2') # Ordonné par timestamp
        self.assertEqual(response.data[1]['raw_prompt'], 'Rêve 1')

    def test_dream_detail_retrieval(self):
        """
        Teste la récupération d'un rêve spécifique.
        """
        dream = Dream.objects.create(user=self.user, raw_prompt='Mon rêve unique', visibility='private')
        response = self.client.get(reverse('dream_detail', kwargs={'pk': dream.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['raw_prompt'], 'Mon rêve unique')

    def test_dream_update(self):
        """
        Teste la mise à jour d'un rêve.
        """
        dream = Dream.objects.create(user=self.user, raw_prompt='Ancien rêve', visibility='private')
        updated_data = {'raw_prompt': 'Nouveau rêve', 'visibility': 'public'}
        response = self.client.patch(reverse('dream_detail', kwargs={'pk': dream.id}), updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dream.refresh_from_db()
        self.assertEqual(dream.raw_prompt, 'Nouveau rêve')
        self.assertEqual(dream.visibility, 'public')

    def test_dream_deletion(self):
        """
        Teste la suppression d'un rêve.
        """
        dream = Dream.objects.create(user=self.user, raw_prompt='Rêve à supprimer', visibility='private')
        response = self.client.delete(reverse('dream_detail', kwargs={'pk': dream.id}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Dream.objects.count(), 0)

    @patch('apps.core.utils.Groq')
    def test_audio_transcription(self, MockGroq):
        """
        Teste la transcription audio en mockant l'API Groq.
        """
        mock_groq_instance = MockGroq.return_value
        mock_transcription_object = MagicMock()
        mock_transcription_object.text = "Ceci est un test de transcription."
        mock_groq_instance.audio.transcriptions.create.return_value = mock_transcription_object

        audio_file = io.BytesIO(b"dummy audio data")
        audio_file.name = 'test_audio.webm'
        response = self.client.post(
            reverse('transcribe_audio'),
            {'audio': audio_file},
            format='multipart' # Important pour les fichiers
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['transcription'], "Ceci est un test de transcription.")
        mock_groq_instance.audio.transcriptions.create.assert_called_once()
        # Vérifier que le modèle est bien celui attendu
        self.assertIn('model', mock_groq_instance.audio.transcriptions.create.call_args.kwargs)
        self.assertEqual(mock_groq_instance.audio.transcriptions.create.call_args.kwargs['model'], "whisper-large-v3-turbo")

    @patch('apps.core.utils.MistralClient')
    @patch('os.getenv', return_value="fake_mistral_key") # Mock MISTRAL_API_KEY
    def test_image_generation(self, mock_getenv, MockMistralClient):
        """
        Teste la génération d'image en mockant l'API Mistral (agents et téléchargement).
        """
        mock_mistral_instance = MockMistralClient.return_value

        # Mock pour la reformulation du prompt
        mock_chat_completion = MagicMock()
        mock_chat_completion.choices = [MagicMock(message=MagicMock(content="Reformed prompt for image."))]
        mock_mistral_instance.chat.completions.create.return_value = mock_chat_completion

        # Mock pour la création de l'agent
        mock_agent_creation = MagicMock()
        mock_agent_creation.id = "agent_id_123"
        mock_mistral_instance.beta.agents.create.return_value = mock_agent_creation

        # Mock pour la conversation de l'agent et la génération de fichier
        mock_tool_file_chunk = MagicMock(spec=ToolFileChunk)
        mock_tool_file_chunk.file_id = "file_id_456"
        mock_tool_file_chunk.file_type = "png"
        mock_conversation_response = MagicMock()
        mock_conversation_response.outputs = [mock_tool_file_chunk] # L'agent retourne un ToolFileChunk
        mock_mistral_instance.beta.conversations.start.return_value = mock_conversation_response

        # Mock pour le téléchargement du fichier image
        mock_file_data_response = MagicMock()
        mock_file_data_response.read.return_value = b"dummy_image_data"
        mock_mistral_instance.files.download.return_value = mock_file_data_response
        
        # Mock pour la suppression de l'agent
        mock_mistral_instance.beta.agents.delete.return_value = None


        original_media_root = settings.MEDIA_ROOT
        # Créer un répertoire temporaire pour les images générées
        with self.settings(MEDIA_ROOT=self.temporary_media_root()):
            data = {'prompt': 'A dream of a flying cat.'}
            response = self.client.post(reverse('generate_image'), data, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('image_url', response.data)
            self.assertTrue(response.data['image_url'].startswith(settings.MEDIA_URL + 'generated_images/image_'))
            self.assertTrue(response.data['image_url'].endswith('.png'))

            mock_mistral_instance.chat.completions.create.assert_called_once()
            mock_mistral_instance.beta.agents.create.assert_called_once()
            mock_mistral_instance.beta.conversations.start.assert_called_once()
            mock_mistral_instance.files.download.assert_called_once_with(file_id="file_id_456")
            mock_mistral_instance.beta.agents.delete.assert_called_once_with(agent_id="agent_id_123")

    @patch('apps.core.utils.MistralClient')
    @patch('os.getenv', return_value="fake_mistral_key") # Mock MISTRAL_API_KEY
    def test_emotion_analysis(self, mock_getenv, MockMistralClient):
        """
        Teste l'analyse émotionnelle en mockant l'API Mistral.
        """
        mock_mistral_instance = MockMistralClient.return_value
        mock_chat_completion = MagicMock()
        # Simuler la réponse JSON de l'API Mistral pour l'analyse émotionnelle
        mock_chat_completion.choices = [MagicMock(message=MagicMock(content='{"Joie": 8, "Tristesse": 2, "Neutre": 5}'))]
        mock_mistral_instance.chat.completions.create.return_value = mock_chat_completion

        data = {'text': 'J\'ai rêvé que je volais et que j\'étais très heureux.'}
        response = self.client.post(reverse('analyze_emotion'), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Les scores sont normalisés de 0 à 1 dans la vue
        expected_emotions = {'Joie': 0.8, 'Anxiété': 0.0, 'Tristesse': 0.2, 'Colère': 0.0, 'Peur': 0.0, 'Surprise': 0.0, 'Neutre': 0.5}
        self.assertEqual(response.data['emotion_analysis'], expected_emotions)
        mock_mistral_instance.chat.completions.create.assert_called_once()
        self.assertIn('model', mock_mistral_instance.chat.completions.create.call_args.kwargs)
        self.assertEqual(mock_mistral_instance.chat.completions.create.call_args.kwargs['model'], "mistral-small-latest")


    @patch('apps.core.utils.MistralClient')
    @patch('os.getenv', return_value="fake_mistral_key") # Mock MISTRAL_API_KEY
    def test_chat_with_mistral(self, mock_getenv, MockMistralClient):
        """
        Teste la fonctionnalité de chat avec Mistral en mockant l'API.
        """
        mock_mistral_instance = MockMistralClient.return_value
        mock_chat_completion = MagicMock()
        mock_chat_completion.choices = [MagicMock(message=MagicMock(content="L'IA dit que votre rêve est intéressant."))]
        mock_mistral_instance.chat.completions.create.return_value = mock_chat_completion

        data = {
            'dream_context': 'J\'ai rêvé que je courais dans une forêt sombre.',
            'user_question': 'Que signifie la forêt sombre ?',
            'chat_history': []
        }
        response = self.client.post(reverse('chat_dream'), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['ai_response'], "L'IA dit que votre rêve est intéressant.")
        mock_mistral_instance.chat.completions.create.assert_called_once()
        self.assertIn('model', mock_mistral_instance.chat.completions.create.call_args.kwargs)
        self.assertEqual(mock_mistral_instance.chat.completions.create.call_args.kwargs['model'], "mistral-large-latest")


    def temporary_media_root(self):
        """
        Crée un répertoire MEDIA_ROOT temporaire pour les tests.
        """
        temp_dir = os.path.join(settings.BASE_DIR, 'test_media')
        os.makedirs(temp_dir, exist_ok=True)
        self.addCleanup(lambda: self._remove_temp_dir(temp_dir))
        return temp_dir

    def _remove_temp_dir(self, path):
        """
        Nettoie le répertoire temporaire après les tests.
        """
        import shutil
        if os.path.exists(path):
            shutil.rmtree(path)