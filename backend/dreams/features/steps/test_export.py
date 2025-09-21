# dreams/tests/test_export.py
"""Tests pour l'export des rêves"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from dreams.models import Dream
from dreams.utils import export_dream_as_html

User = get_user_model()


class DreamExportTests(TestCase):
    """Tests pour l'export HTML des rêves"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.dream = Dream.objects.create(
            user=self.user,
            transcription="Je rêvais d'un magnifique jardin avec des fleurs colorées",
            reformed_prompt="beautiful colorful garden with flowers",
            img_b64="data:image/png;base64,testimage123",
            privacy='private',
            emotion='heureux',
            emotion_confidence=0.85,
            emotion_emoji='😊',
            emotion_color='#10b981'
        )
    
    def test_export_dream_as_html_basic(self):
        """Test export HTML basique"""
        response = export_dream_as_html(self.dream, self.user)
        
        self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('reve_', response['Content-Disposition'])
    
    def test_export_html_contains_transcription(self):
        """Test que l'HTML contient la transcription"""
        response = export_dream_as_html(self.dream, self.user)
        content = response.content.decode('utf-8')
        
        # Vérifier que la transcription est présente (avec échappement HTML)
        self.assertIn(self.dream.transcription.replace("'", "&#x27;"), content)
        self.assertIn("magnifique jardin", content)
    
    def test_export_html_contains_reformed_prompt(self):
        """Test que l'HTML contient le prompt reformulé"""
        response = export_dream_as_html(self.dream, self.user)
        content = response.content.decode('utf-8')
        
        self.assertIn(self.dream.reformed_prompt, content)
        self.assertIn("beautiful colorful garden", content)
    
    def test_export_html_contains_image(self):
        """Test que l'HTML contient l'image"""
        response = export_dream_as_html(self.dream, self.user)
        content = response.content.decode('utf-8')
        
        self.assertIn(self.dream.img_b64, content)
        self.assertIn("data:image/png;base64,", content)
    
    def test_export_html_contains_privacy_label(self):
        """Test que l'HTML contient le label de privacy"""
        response = export_dream_as_html(self.dream, self.user)
        content = response.content.decode('utf-8')
        
        self.assertIn("🔒 Privé", content)  # Privacy private
    
    def test_export_html_privacy_labels(self):
        """Test tous les labels de privacy"""
        privacy_tests = [
            ('private', '🔒 Privé'),
            ('public', '🌍 Public'),
            ('friends_only', '👥 Amis seulement')
        ]
        
        for privacy, expected_label in privacy_tests:
            self.dream.privacy = privacy
            self.dream.save()
            
            response = export_dream_as_html(self.dream, self.user)
            content = response.content.decode('utf-8')
            
            self.assertIn(expected_label, content)
    
    def test_export_html_date_formatting(self):
        """Test formatage de la date"""
        response = export_dream_as_html(self.dream, self.user)
        content = response.content.decode('utf-8')
        
        # Devrait contenir une date au format français
        self.assertIn("📅", content)
        # La date exacte dépend de quand le test s'exécute
    
    def test_export_html_structure(self):
        """Test structure HTML"""
        response = export_dream_as_html(self.dream, self.user)
        content = response.content.decode('utf-8')
        
        # Vérifier la structure HTML de base
        self.assertIn('<!DOCTYPE html>', content)
        self.assertIn('<html lang="fr">', content)
        self.assertIn('<title>Mon Rêve', content)
        self.assertIn('🌙 Mon Rêve', content)
        
        # Vérifier les sections
        self.assertIn('🎙️ Mon récit', content)
        self.assertIn('✨ Interprétation IA', content)
        self.assertIn('🎨 Visualisation', content)
    
    def test_export_dream_without_emotion(self):
        """Test export d'un rêve sans émotion"""
        dream_no_emotion = Dream.objects.create(
            user=self.user,
            transcription="Rêve sans émotion",
            reformed_prompt="dream without emotion",
            img_b64="data:image/png;base64,test",
            privacy='private'
        )
        
        response = export_dream_as_html(dream_no_emotion, self.user)
        content = response.content.decode('utf-8')
        
        # Devrait quand même fonctionner
        self.assertIn("Rêve sans émotion", content)
        self.assertEqual(response.status_code, 200)
    
    def test_export_dream_minimal_data(self):
        """Test export avec données minimales"""
        minimal_dream = Dream.objects.create(
            user=self.user,
            transcription="Test minimal",
            reformed_prompt="minimal test",
            img_b64="",  # Pas d'image
            privacy='private'
        )
        
        response = export_dream_as_html(minimal_dream, self.user)
        content = response.content.decode('utf-8')
        
        self.assertIn("Test minimal", content)
        self.assertEqual(response.status_code, 200)


class DreamExportAPITests(APITestCase):
    """Tests pour l'API d'export"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.dream = Dream.objects.create(
            user=self.user,
            transcription="Rêve pour test API export",
            reformed_prompt="dream for export API test",
            img_b64="data:image/png;base64,testexport",
            privacy='private'
        )
    
    def test_export_api_success(self):
        """Test API d'export réussie"""
        url = f'/api/dreams/{self.dream.dream_id}/export'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_export_api_nonexistent_dream(self):
        """Test export d'un rêve inexistant"""
        url = '/api/dreams/99999/export'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_export_api_unauthorized(self):
        """Test export sans authentification"""
        self.client.credentials()  # Supprimer auth
        
        url = f'/api/dreams/{self.dream.dream_id}/export'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
