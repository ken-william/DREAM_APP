# dreams/tests/test_images.py
"""Tests pour la génération d'images"""

import base64
from unittest.mock import patch, MagicMock
from django.test import TestCase

from dreams.utils import (
    generate_image_base64,
    generate_artistic_placeholder,
    generate_pollinations_image
)


class ArtisticPlaceholderTests(TestCase):
    """Tests pour la génération de placeholders artistiques"""
    
    def test_generate_artistic_placeholder_basic(self):
        """Test génération placeholder basique"""
        result = generate_artistic_placeholder("test prompt")
        
        self.assertTrue(result.startswith("data:image/svg+xml;base64,"))
        
        # Décoder le SVG
        base64_part = result.split(',')[1]
        svg_content = base64.b64decode(base64_part).decode('utf-8')
        
        self.assertIn('<svg', svg_content)
        self.assertIn('Dream Vision', svg_content)
        self.assertIn('test prompt', svg_content)
    
    def test_placeholder_color_selection_nature(self):
        """Test sélection couleurs nature"""
        result = generate_artistic_placeholder("forêt verte nature tree")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('#56ab2f', svg_content)  # Couleur nature
    
    def test_placeholder_color_selection_ocean(self):
        """Test sélection couleurs océan"""
        result = generate_artistic_placeholder("océan bleu mer water")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('#2196F3', svg_content)  # Couleur océan
    
    def test_placeholder_color_selection_fire(self):
        """Test sélection couleurs feu"""
        result = generate_artistic_placeholder("feu rouge warm sunset")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('#ff6b6b', svg_content)  # Couleur feu
    
    def test_placeholder_color_selection_night(self):
        """Test sélection couleurs nuit"""
        result = generate_artistic_placeholder("nuit dark moon star")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('#2c3e50', svg_content)  # Couleur nuit
    
    def test_placeholder_elements_moon(self):
        """Test génération éléments lune"""
        result = generate_artistic_placeholder("moon circle lune")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('circle cx="512" cy="300"', svg_content)
    
    def test_placeholder_elements_star(self):
        """Test génération éléments étoile"""
        result = generate_artistic_placeholder("star night étoile")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('polygon points=', svg_content)
    
    def test_placeholder_elements_cloud(self):
        """Test génération éléments nuage"""
        result = generate_artistic_placeholder("cloud nuage ciel")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        self.assertIn('ellipse cx="400"', svg_content)
    
    def test_placeholder_default_elements(self):
        """Test éléments par défaut quand pas de mots-clés spéciaux"""
        result = generate_artistic_placeholder("simple test")
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        # Devrait avoir les cercles par défaut
        self.assertIn('circle cx="512" cy="300" r="80"', svg_content)
        self.assertIn('circle cx="300" cy="500" r="60"', svg_content)
        self.assertIn('circle cx="700" cy="600" r="90"', svg_content)
    
    def test_placeholder_long_prompt_truncation(self):
        """Test troncature des prompts longs"""
        long_prompt = "Un très très très long prompt qui dépasse largement 60 caractères et devrait être tronqué"
        result = generate_artistic_placeholder(long_prompt)
        svg_content = base64.b64decode(result.split(',')[1]).decode('utf-8')
        
        # Devrait contenir '...' pour indiquer la troncature
        self.assertIn('...', svg_content)


class ImageGenerationIntegrationTests(TestCase):
    """Tests d'intégration pour la génération d'images"""
    
    @patch('dreams.utils.generate_pollinations_image')
    def test_generate_image_base64_pollinations_success(self, mock_pollinations):
        """Test génération réussie avec Pollinations"""
        mock_pollinations.return_value = "data:image/png;base64,pollinations_image"
        
        result = generate_image_base64("test prompt")
        
        self.assertEqual(result, "data:image/png;base64,pollinations_image")
        mock_pollinations.assert_called_once_with("test prompt")
    
    @patch('dreams.utils.generate_pollinations_image')
    @patch('dreams.utils.generate_artistic_placeholder')
    def test_generate_image_base64_fallback_to_placeholder(self, mock_placeholder, mock_pollinations):
        """Test fallback vers placeholder quand Pollinations échoue"""
        mock_pollinations.side_effect = Exception("Pollinations failed")
        mock_placeholder.return_value = "data:image/svg+xml;base64,placeholder"
        
        result = generate_image_base64("test prompt")
        
        self.assertEqual(result, "data:image/svg+xml;base64,placeholder")
        mock_pollinations.assert_called_once_with("test prompt")
        mock_placeholder.assert_called_once_with("test prompt")


class PollinationsTests(TestCase):
    """Tests pour l'API Pollinations (avec mocks)"""
    
    @patch('dreams.utils.requests.get')
    def test_generate_pollinations_image_success(self, mock_get):
        """Test génération Pollinations réussie"""
        # Simuler une réponse image PNG valide
        fake_image_data = b'\x89PNG\r\n\x1a\n' + b'fake png data' * 100
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = fake_image_data
        mock_get.return_value = mock_response
        
        result = generate_pollinations_image("test prompt")
        
        self.assertTrue(result.startswith("data:image/png;base64,"))
        mock_get.assert_called_once()
        
        # Vérifier que l'URL contient le prompt encodé
        called_url = mock_get.call_args[0][0]
        self.assertIn('pollinations.ai', called_url)
        self.assertIn('test%20prompt', called_url)
    
    @patch('dreams.utils.requests.get')
    def test_generate_pollinations_image_failure(self, mock_get):
        """Test échec Pollinations"""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.content = b'error'
        mock_get.return_value = mock_response
        
        with self.assertRaises(Exception):
            generate_pollinations_image("test prompt")
    
    @patch('dreams.utils.requests.get')
    def test_generate_pollinations_image_small_response(self, mock_get):
        """Test réponse trop petite de Pollinations"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'tiny'  # Moins de 1000 bytes
        mock_get.return_value = mock_response
        
        with self.assertRaises(Exception):
            generate_pollinations_image("test prompt")
