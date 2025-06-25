# apps/dreams/models.py
from django.db import models
from django.contrib.auth.models import User
import json

class Dream(models.Model):
    """
    Modèle représentant un rêve sauvegardé par un utilisateur.
    """
    VISIBILITY_CHOICES = [
        ('private', 'Privé'),
        ('friends', 'Amis uniquement'),
        ('public', 'Public'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dreams', verbose_name="Utilisateur")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    raw_prompt = models.TextField(verbose_name="Description du rêve brut")
    # Utiliser CharField pour le chemin de l'image (non Base64)
    image_path = models.CharField(max_length=255, blank=True, null=True, verbose_name="Chemin de l'image générée")
    # emotion_analysis stockera un JSON, donc nous utilisons TextField
    emotion_analysis = models.TextField(blank=True, null=True, verbose_name="Analyse émotionnelle (JSON)")
    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default='private',
        verbose_name="Visibilité"
    )

    class Meta:
        ordering = ['-timestamp'] # Ordonner les rêves par le plus récent en premier
        verbose_name = "Rêve"
        verbose_name_plural = "Rêves"

    def __str__(self):
        return f"Rêve de {self.user.username} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    def set_emotion_analysis(self, data):
        """Convertit un dict Python en chaîne JSON et le stocke."""
        self.emotion_analysis = json.dumps(data)

    def get_emotion_analysis(self):
        """Convertit la chaîne JSON stockée en dict Python."""
        if self.emotion_analysis:
            try:
                return json.loads(self.emotion_analysis)
            except json.JSONDecodeError:
                return {}
        return None