# dreams/tests/test_emotions.py
"""Tests pour l'analyse émotionnelle des rêves"""

from django.test import TestCase

from dreams.utils import (
    analyze_dream_emotion,
    EMOTIONS
)


class EmotionAnalysisTests(TestCase):
    """Tests pour l'analyse émotionnelle"""
    
    def test_emotion_analysis_happy(self):
        """Test analyse d'un rêve heureux"""
        transcription = "Je rêvais d'un jardin magnifique plein de joie et de bonheur avec des sourires partout"
        result = analyze_dream_emotion(transcription)
        
        self.assertIn('emotion', result)
        self.assertIn('confidence', result)
        self.assertIn('emoji', result)
        self.assertIn('color', result)
        self.assertIn(result['emotion'], ['heureux', 'excitant'])
    
    def test_emotion_analysis_sad(self):
        """Test analyse d'un rêve triste"""
        transcription = "Je rêvais de tristesse et de mélancolie, avec des pleurs et de la peine partout"
        result = analyze_dream_emotion(transcription)
        
        self.assertEqual(result['emotion'], 'triste')
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(result['method'], 'keywords')
    
    def test_emotion_analysis_stressful(self):
        """Test analyse d'un rêve stressant"""
        transcription = "C'était un rêve terrifiant plein de stress et d'angoisse, j'avais peur et je paniquais"
        result = analyze_dream_emotion(transcription)
        
        self.assertEqual(result['emotion'], 'stressant')
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(result['emoji'], '😰')
    
    def test_emotion_analysis_exciting(self):
        """Test analyse d'un rêve excitant"""
        transcription = "Une aventure incroyable et dynamique, pleine d'action et d'énergie intense"
        result = analyze_dream_emotion(transcription)
        
        self.assertEqual(result['emotion'], 'excitant')
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(result['emoji'], '🤩')
    
    def test_emotion_analysis_mysterious(self):
        """Test analyse d'un rêve mystérieux"""
        transcription = "Un rêve étrange et mystérieux, avec des événements bizares et surréels"
        result = analyze_dream_emotion(transcription)
        
        self.assertEqual(result['emotion'], 'mystérieux')
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(result['emoji'], '🔮')
    
    def test_emotion_analysis_neutral(self):
        """Test analyse d'un rêve neutre"""
        transcription = "Un rêve normal et ordinaire, très calme et paisible"
        result = analyze_dream_emotion(transcription)
        
        self.assertEqual(result['emotion'], 'neutre')
        self.assertGreater(result['confidence'], 0)
        self.assertEqual(result['emoji'], '😐')
    
    def test_emotion_analysis_empty_text(self):
        """Test analyse avec texte vide"""
        result = analyze_dream_emotion("")
        
        self.assertEqual(result['emotion'], 'neutre')
        self.assertEqual(result['confidence'], 0.5)
        self.assertEqual(result['method'], 'default')
    
    def test_emotion_analysis_mixed_emotions(self):
        """Test avec plusieurs émotions - devrait prendre la dominante"""
        transcription = "Un rêve avec de la joie et du bonheur, mais aussi un peu de tristesse"
        result = analyze_dream_emotion(transcription)
        
        # Devrait détecter 'heureux' car plus de mots-clés positifs
        self.assertEqual(result['emotion'], 'heureux')
        self.assertIn('keywords_found', result)
        self.assertGreater(len(result['keywords_found']), 0)


class EmotionStructureTests(TestCase):
    """Tests pour la structure des émotions"""
    
    def test_emotions_structure(self):
        """Test que la structure EMOTIONS est correcte"""
        required_keys = ['keywords', 'emoji', 'color']
        
        for emotion_name, emotion_data in EMOTIONS.items():
            for key in required_keys:
                self.assertIn(key, emotion_data, f"Clé '{key}' manquante pour l'émotion '{emotion_name}'")
            
            # Vérifier que keywords est une liste non-vide
            self.assertIsInstance(emotion_data['keywords'], list)
            self.assertGreater(len(emotion_data['keywords']), 0)
            
            # Vérifier que emoji n'est pas vide
            self.assertIsInstance(emotion_data['emoji'], str)
            self.assertGreater(len(emotion_data['emoji']), 0)
            
            # Vérifier que color est un code couleur
            self.assertIsInstance(emotion_data['color'], str)
            self.assertTrue(emotion_data['color'].startswith('#'))
    
    def test_all_emotions_exist(self):
        """Test que toutes les émotions attendues existent"""
        expected_emotions = ['heureux', 'triste', 'stressant', 'neutre', 'excitant', 'mystérieux']
        
        for emotion in expected_emotions:
            self.assertIn(emotion, EMOTIONS, f"Émotion '{emotion}' manquante")
    
    def test_emotion_keywords_unique(self):
        """Test que les mots-clés d'émotions ne se chevauchent pas trop"""
        all_keywords = []
        for emotion_data in EMOTIONS.values():
            all_keywords.extend(emotion_data['keywords'])
        
        # Il ne devrait pas y avoir trop de doublons
        unique_keywords = set(all_keywords)
        overlap_ratio = len(all_keywords) / len(unique_keywords)
        
        # Tolérance : pas plus de 20% de chevauchement
        self.assertLess(overlap_ratio, 1.2, "Trop de mots-clés dupliqués entre émotions")
