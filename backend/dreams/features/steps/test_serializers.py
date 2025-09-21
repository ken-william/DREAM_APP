# dreams/tests/test_serializers.py
"""Tests pour les serializers de dreams"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from dreams.models import Dream
from dreams.serializers import DreamSerializer, DreamListSerializer, DreamUserSerializer

User = get_user_model()


class DreamSerializerTests(TestCase):
    """Tests pour les serializers de Dream"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.dream = Dream.objects.create(
            user=self.user,
            transcription="Rêve de test",
            reformed_prompt="test dream",
            img_b64="data:image/png;base64,testimage",
            privacy='private',
            emotion='heureux',
            emotion_confidence=0.8,
            emotion_emoji='😊'
        )
    
    def test_dream_user_serializer_fields(self):
        """Test des champs du DreamUserSerializer"""
        serializer = DreamUserSerializer(self.user)
        expected_fields = ['id', 'username', 'photo_profil']
        
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
        self.assertEqual(serializer.data['username'], 'testuser')
        self.assertEqual(serializer.data['id'], self.user.id)
    
    def test_dream_serializer_complete_fields(self):
        """Test que DreamSerializer contient tous les champs"""
        serializer = DreamSerializer(self.dream)
        expected_fields = [
            'dream_id', 'user', 'transcription', 'reformed_prompt', 
            'img_b64', 'date', 'privacy', 'emotion', 'emotion_confidence',
            'emotion_emoji', 'emotion_color', 'likes_count', 'comments_count', 'user_liked'
        ]
        
        self.assertEqual(set(serializer.data.keys()), set(expected_fields))
        self.assertEqual(serializer.data['transcription'], "Rêve de test")
        self.assertEqual(serializer.data['emotion'], 'heureux')
        self.assertIn('username', serializer.data['user'])
    
    def test_dream_list_serializer_optimization(self):
        """Test optimisation DreamListSerializer"""
        serializer = DreamListSerializer(self.dream)
        
        # L'image complète ne devrait pas être incluse (optimisation)
        self.assertNotIn('img_b64', serializer.data)
        # Mais has_image devrait être présent
        self.assertIn('has_image', serializer.data)
        self.assertTrue(serializer.data['has_image'])
        # Vérifier la transcription tronquée
        self.assertIn('truncated_transcription', serializer.data)
    
    def test_dream_serializer_with_null_emotion(self):
        """Test serialization avec émotion nulle"""
        dream_no_emotion = Dream.objects.create(
            user=self.user,
            transcription="Rêve sans émotion",
            reformed_prompt="test",
            img_b64="data:image/png;base64,test",
            privacy='private'
        )
        
        serializer = DreamSerializer(dream_no_emotion)
        
        self.assertIsNone(serializer.data['emotion'])
        self.assertIsNone(serializer.data['emotion_confidence'])
        self.assertIsNone(serializer.data['emotion_emoji'])
    
    def test_dream_list_serializer_with_no_image(self):
        """Test DreamListSerializer avec rêve sans image"""
        dream_no_image = Dream.objects.create(
            user=self.user,
            transcription="Rêve sans image",
            reformed_prompt="no image dream",
            img_b64="",  # Pas d'image
            privacy='private'
        )
        
        serializer = DreamListSerializer(dream_no_image)
        
        self.assertFalse(serializer.data['has_image'])
        self.assertEqual(serializer.data['truncated_transcription'], "Rêve sans image")
