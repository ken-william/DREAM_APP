# apps/dreams/models.py
from django.db import models
from django.contrib.auth.models import User # Pour lier le rêve à un utilisateur

class Dream(models.Model):
    """
    Modèle représentant un rêve enregistré par un utilisateur.
    """
    # Visibilité du rêve
    VISIBILITY_CHOICES = [
        ('private', 'Privé'),
        ('friends', 'Amis uniquement'),
        ('public', 'Public'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dreams', verbose_name="Utilisateur")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Date d'enregistrement")
    raw_prompt = models.TextField(verbose_name="Description du rêve (texte brut)")
    image_path = models.URLField(max_length=500, blank=True, null=True, verbose_name="URL de l'image générée") # Stocke l'URL de l'image
    emotion_analysis = models.JSONField(blank=True, null=True, verbose_name="Analyse émotionnelle (JSON)") # Pour stocker les émotions sous forme de JSON
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private', verbose_name="Visibilité")

    class Meta:
        ordering = ['-timestamp'] # Ordonner les rêves par date décroissante
        verbose_name = "Rêve"
        verbose_name_plural = "Rêves"

    def __str__(self):
        return f"Rêve de {self.user.username} le {self.timestamp.strftime('%Y-%m-%d %H:%M')}"