# dreams/tests/test_apis.py
"""Tests pour les APIs REST de dreams"""

from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from dreams.models import Dream
from dreams.utils import MAX_AUDIO_SIZE_MB

User = get_user_model()


class DreamAPITests(APITestCase):
    """Tests pour les APIs Dream"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        # Créer quelques rêves de test
        self.dream1 = Dream.objects.create(
            user=self.user,
            prompt="prompt test",
            transcription="Premier rêve de test",
            reformed_prompt="first test dream",
            img_b64="data:image/png;base64,testimage1",
            privacy='private'
        )
        
        self.dream2 = Dream.objects.create(
            user=self.user,
            prompt="prompt test 2",
            transcription="Deuxième rêve public",
            reformed_prompt="second public dream",
            img_b64="data:image/png;base64,testimage2",
            privacy='public',
            emotion='heureux',
            emotion_confidence=0.9,
            emotion_emoji='😊'
        )
    
    def create_test_audio_file(self, size_mb=1, filename="test.mp3"):
        """Helper : crée un fichier audio de test"""
        content = b'fake audio content' * (size_mb * 1024 * 60)
        return SimpleUploadedFile(filename, content, content_type="audio/mpeg")
    
    def test_dream_list_api(self):
        """Test de l'API de liste des rêves"""
        url = '/api/dreams/list'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('dreams', response.data)
        self.assertIn('stats', response.data)
        
        dreams = response.data['dreams']
        self.assertEqual(len(dreams), 2)
        
        stats = response.data['stats']
        self.assertEqual(stats['total_dreams'], 2)
        self.assertEqual(stats['private_dreams'], 1)
        self.assertEqual(stats['public_dreams'], 1)
    
    @patch('dreams.views.validate_audio_complete')
    @patch('dreams.views.transcribe_audio')
    @patch('dreams.views.rephrase_text')
    @patch('dreams.views.generate_image_base64')
    @patch('dreams.views.analyze_dream_emotion')
    def test_dream_generate_api_success(self, mock_emotion, mock_generate_image, 
                                       mock_rephrase, mock_transcribe, mock_validate):
        """Test de l'API de génération de rêve réussie avec mocks dans views"""
        
        # Configuration des mocks - dans l'ordre d'appel
        mock_validate.return_value = {
            'valid': True,
            'errors': [],
            'details': {'file_size_mb': 1.0, 'file_extension': '.mp3', 'filename': 'test.mp3'}
        }
        mock_transcribe.return_value = "Transcription de test"
        mock_rephrase.return_value = "Prompt reformulé"
        mock_emotion.return_value = {
            'emotion': 'heureux',
            'confidence': 0.8,
            'emoji': '😊',
            'color': '#10b981'
        }
        mock_generate_image.return_value = "data:image/png;base64,testimage"
        
        url = '/api/dreams/generate'
        audio_file = self.create_test_audio_file()
        
        response = self.client.post(url, {
            'audio': audio_file
        }, format='multipart')
        
        print(f"Response status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transcription', response.data)
        self.assertIn('prompt', response.data)
        self.assertIn('image', response.data)
        self.assertIn('emotion', response.data)
        self.assertIn('preview_data', response.data)
    
    def test_dream_generate_api_invalid_audio(self):
        """Test génération avec fichier audio invalide"""
        url = '/api/dreams/generate'
        large_audio = self.create_test_audio_file(size_mb=MAX_AUDIO_SIZE_MB + 1)
        
        response = self.client.post(url, {
            'audio': large_audio
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('audio invalide', response.data['error'].lower())
    
    def test_dream_save_api_success(self):
        """Test de l'API de sauvegarde de rêve"""
        url = '/api/dreams/save'
        data = {
            'transcription': 'Transcription de test pour sauvegarde',
            'reformed_prompt': 'Test prompt for save',
            'img_b64': 'data:image/png;base64,testimageforsave',
            'privacy': 'public'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('dream_id', response.data)
        self.assertIn('privacy', response.data)
        
        dream_id = response.data['dream_id']
        dream = Dream.objects.get(dream_id=dream_id)
        self.assertEqual(dream.user, self.user)
        self.assertEqual(dream.privacy, 'public')
    
    def test_dream_update_privacy_api(self):
        """Test de l'API de mise à jour de privacy"""
        url = f'/api/dreams/{self.dream1.dream_id}/privacy'
        data = {'privacy': 'public'}
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['privacy'], 'public')
        
        self.dream1.refresh_from_db()
        self.assertEqual(self.dream1.privacy, 'public')


class DreamAPIAuthTests(APITestCase):
    """Tests d'authentification pour les APIs"""
    
    def test_authentication_required_endpoints(self):
        """Test que l'authentification est requise"""
        endpoints = [
            '/api/dreams/list',
            '/api/dreams/generate',
            '/api/dreams/save'
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_405_METHOD_NOT_ALLOWED])
