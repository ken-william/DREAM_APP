# dreams/tests/test_validation.py
"""Tests pour la validation des fichiers audio"""

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from dreams.utils import (
    validate_audio_file,
    validate_audio_complete,
    _to_filename_and_bytes,
    MAX_AUDIO_SIZE_MB,
    ALLOWED_AUDIO_FORMATS
)


class AudioValidationTests(TestCase):
    """Tests pour la validation des fichiers audio"""
    
    def create_test_audio_file(self, size_mb=1, filename="test.mp3"):
        """Helper : crée un faux fichier audio pour les tests"""
        content = b'fake audio content' * (size_mb * 1024 * 60)
        return SimpleUploadedFile(filename, content, content_type="audio/mpeg")
    
    def test_validate_audio_file_valid(self):
        """Test validation d'un fichier audio valide"""
        audio_file = self.create_test_audio_file(size_mb=2, filename="test.mp3")
        result = validate_audio_file(audio_file)
        
        self.assertTrue(result['valid'])
        self.assertIsNone(result['error'])
        self.assertIn('file_size_mb', result['details'])
        self.assertIn('file_extension', result['details'])
    
    def test_validate_audio_file_too_large(self):
        """Test validation d'un fichier trop volumineux"""
        audio_file = self.create_test_audio_file(size_mb=MAX_AUDIO_SIZE_MB + 1)
        result = validate_audio_file(audio_file)
        
        self.assertFalse(result['valid'])
        self.assertIn('trop volumineux', result['error'].lower())
        self.assertIn('file_size_mb', result['details'])
    
    def test_validate_audio_file_invalid_format(self):
        """Test validation d'un format non supporté"""
        audio_file = self.create_test_audio_file(filename="test.txt")
        result = validate_audio_file(audio_file)
        
        self.assertFalse(result['valid'])
        self.assertIn('format', result['error'].lower())
        self.assertIn('file_extension', result['details'])
    
    def test_all_allowed_audio_formats(self):
        """Test que tous les formats autorisés sont acceptés"""
        for format_ext in ALLOWED_AUDIO_FORMATS:
            filename = f"test{format_ext}"
            audio_file = self.create_test_audio_file(size_mb=1, filename=filename)
            result = validate_audio_file(audio_file)
            
            self.assertTrue(result['valid'], f"Format {format_ext} devrait être accepté")
    
    def test_validate_audio_complete(self):
        """Test validation complète d'un fichier"""
        audio_file = self.create_test_audio_file(size_mb=2, filename="test.wav")
        result = validate_audio_complete(audio_file)
        
        self.assertTrue(result['valid'])
        self.assertEqual(len(result['errors']), 0)
        self.assertIn('details', result)


class FileConversionTests(TestCase):
    """Tests pour la conversion de fichiers"""
    
    def test_to_filename_and_bytes_uploadedfile(self):
        """Test conversion UploadedFile vers filename et bytes"""
        content = b'fake audio content'
        audio_file = SimpleUploadedFile("test.wav", content, content_type="audio/wav")
        
        filename, bytes_content = _to_filename_and_bytes(audio_file)
        
        self.assertEqual(filename, "test.wav")
        self.assertEqual(bytes_content, content)
    
    def test_to_filename_and_bytes_raw_bytes(self):
        """Test conversion bytes bruts"""
        test_bytes = b"raw audio data"
        filename, bytes_content = _to_filename_and_bytes(test_bytes)
        
        self.assertEqual(filename, "audio.wav")
        self.assertEqual(bytes_content, test_bytes)
    
    def test_to_filename_and_bytes_large_file(self):
        """Test conversion fichier volumineux"""
        large_content = b'x' * (5 * 1024 * 1024)  # 5MB
        audio_file = SimpleUploadedFile("large.mp3", large_content, content_type="audio/mpeg")
        
        filename, bytes_content = _to_filename_and_bytes(audio_file)
        
        self.assertEqual(filename, "large.mp3")
        self.assertEqual(len(bytes_content), len(large_content))
