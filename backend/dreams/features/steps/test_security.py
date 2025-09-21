# dreams/tests/test_security.py
"""Tests de sécurité pour l'application dreams"""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from dreams.models import Dream

User = get_user_model()


class DreamSecurityTests(APITestCase):
    """Tests de sécurité pour les APIs Dream"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        self.token1 = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)
        
        self.dream_user1 = Dream.objects.create(
            user=self.user1,
            transcription="Rêve privé de user1",
            reformed_prompt="private dream",
            img_b64="data:image/png;base64,test",
            privacy='private'
        )
    
    def test_cannot_access_other_user_dreams_export(self):
        """Test qu'un utilisateur ne peut pas exporter les rêves d'un autre"""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        
        url = f'/api/dreams/{self.dream_user1.dream_id}/export'
        response = client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_cannot_modify_other_user_dreams_privacy(self):
        """Test qu'un utilisateur ne peut pas modifier la privacy des rêves d'un autre"""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        
        url = f'/api/dreams/{self.dream_user1.dream_id}/privacy'
        response = client.put(url, {'privacy': 'public'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_dream_list_isolation(self):
        """Test que chaque utilisateur ne voit que ses propres rêves"""
        # Créer des rêves pour user2
        Dream.objects.create(
            user=self.user2,
            transcription="Rêve de user2",
            reformed_prompt="user2 dream",
            img_b64="data:image/png;base64,test2",
            privacy='private'
        )
        
        # Tester avec user1
        client1 = APIClient()
        client1.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response1 = client1.get('/api/dreams/list')
        
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        dreams1 = response1.data['dreams']
        self.assertEqual(len(dreams1), 1)  # Seulement le rêve de user1
        self.assertEqual(dreams1[0]['user']['username'], 'user1')
        
        # Tester avec user2
        client2 = APIClient()
        client2.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        response2 = client2.get('/api/dreams/list')
        
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        dreams2 = response2.data['dreams']
        self.assertEqual(len(dreams2), 1)  # Seulement le rêve de user2
        self.assertEqual(dreams2[0]['user']['username'], 'user2')
    
    def test_invalid_token_access(self):
        """Test accès avec token invalide"""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token invalid_token_123')
        
        response = client.get('/api/dreams/list')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_no_token_access(self):
        """Test accès sans token"""
        client = APIClient()
        
        endpoints = [
            '/api/dreams/list',
            '/api/dreams/generate',
            '/api/dreams/save',
            f'/api/dreams/{self.dream_user1.dream_id}/export',
            f'/api/dreams/{self.dream_user1.dream_id}/privacy'
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            self.assertIn(response.status_code, [
                status.HTTP_401_UNAUTHORIZED, 
                status.HTTP_405_METHOD_NOT_ALLOWED
            ])


class DreamPrivacyTests(APITestCase):
    """Tests spécifiques à la gestion de la confidentialité"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.private_dream = Dream.objects.create(
            user=self.user,
            transcription="Rêve privé",
            reformed_prompt="private dream",
            img_b64="data:image/png;base64,test",
            privacy='private'
        )
    
    def test_privacy_update_valid_values(self):
        """Test mise à jour privacy avec valeurs valides"""
        valid_privacies = ['private', 'public', 'friends_only']
        
        for privacy in valid_privacies:
            url = f'/api/dreams/{self.private_dream.dream_id}/privacy'
            response = self.client.put(url, {'privacy': privacy}, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['privacy'], privacy)
    
    def test_privacy_update_invalid_value(self):
        """Test mise à jour privacy avec valeur invalide"""
        url = f'/api/dreams/{self.private_dream.dream_id}/privacy'
        response = self.client.put(url, {'privacy': 'invalid_privacy'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('privacy invalide', response.data['error'].lower())
    
    def test_privacy_update_nonexistent_dream(self):
        """Test mise à jour privacy pour un rêve inexistant"""
        url = '/api/dreams/99999/privacy'
        response = self.client.put(url, {'privacy': 'public'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
