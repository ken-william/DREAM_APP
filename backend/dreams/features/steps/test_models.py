# dreams/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model

from dreams.models import Dream

User = get_user_model()


class DreamModelTests(TestCase):
    """Tests pour le modèle Dream"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_dream_basic(self):
        """Test création d'un rêve basique"""
        dream = Dream.objects.create(
            user=self.user,
            transcription="Je rêvais d'un jardin magnifique",
            reformed_prompt="beautiful garden with flowers",
            img_b64="data:image/png;base64,iVBORw0KGgoAAAANSU",
            privacy='private'
        )
        
        self.assertEqual(dream.user, self.user)
        self.assertEqual(dream.transcription, "Je rêvais d'un jardin magnifique")
        self.assertEqual(dream.privacy, 'private')
        self.assertIsNotNone(dream.dream_id)
        self.assertIsNotNone(dream.date)
    
    def test_dream_privacy_choices(self):
        """Test que les choix de privacy sont corrects"""
        expected_choices = ['public', 'private', 'friends_only']
        actual_choices = [choice[0] for choice in Dream.PRIVACY_CHOICES]
        
        for choice in expected_choices:
            self.assertIn(choice, actual_choices)
    
    def test_dream_with_emotions(self):
        """Test création d'un rêve avec émotions"""
        dream = Dream.objects.create(
            user=self.user,
            transcription="Je rêvais d'un jardin magnifique avec des fleurs",
            reformed_prompt="beautiful garden",
            img_b64="data:image/png;base64,test",
            privacy='private',
            emotion='heureux',
            emotion_confidence=0.85,
            emotion_emoji='😊',
            emotion_color='#10b981'
        )
        
        self.assertEqual(dream.emotion, 'heureux')
        self.assertEqual(dream.emotion_confidence, 0.85)
        self.assertEqual(dream.emotion_emoji, '😊')
        self.assertEqual(dream.emotion_color, '#10b981')
    
    def test_dream_str_representation(self):
        """Test représentation string du modèle"""
        dream = Dream.objects.create(
            user=self.user,
            transcription="Test dream",
            reformed_prompt="test",
            img_b64="data:image/png;base64,test",
            privacy='private'
        )
        
        expected_str = f"Dream {dream.dream_id} by {self.user.username}"
        self.assertEqual(str(dream), expected_str)
    
    def test_dream_default_values(self):
        """Test valeurs par défaut du modèle"""
        dream = Dream.objects.create(
            user=self.user,
            transcription="Test minimal",
            reformed_prompt="test",
            img_b64="test"
        )
        
        self.assertEqual(dream.privacy, 'private')  # Valeur par défaut
        self.assertIsNone(dream.emotion)  # Peut être null
        self.assertIsNone(dream.emotion_confidence)
