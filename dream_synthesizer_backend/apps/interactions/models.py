# apps/interactions/models.py
from django.db import models
from django.contrib.auth.models import User
from apps.dreams.models import Dream # Importez le modèle Dream

class Friendship(models.Model):
    """
    Modèle pour gérer les relations d'amitié entre utilisateurs.
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('rejected', 'Rejeté'),
    ]
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_requests', verbose_name="Utilisateur 1")
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_requests', verbose_name="Utilisateur 2")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name="Statut")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")

    class Meta:
        unique_together = ('user1', 'user2') # Empêche les doublons pour la même paire d'utilisateurs
        verbose_name = "Amitié"
        verbose_name_plural = "Amitiés"

    def __str__(self):
        return f"Amitié entre {self.user1.username} et {self.user2.username} ({self.status})"

class Like(models.Model):
    """
    Modèle pour gérer les likes sur les rêves.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes', verbose_name="Utilisateur")
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE, related_name='likes', verbose_name="Rêve")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date du like")

    class Meta:
        unique_together = ('user', 'dream') # Un seul like par utilisateur et par rêve
        verbose_name = "Like"
        verbose_name_plural = "Likes"

    def __str__(self):
        return f"{self.user.username} aime le rêve de {self.dream.user.username} ({self.dream.id})"

class Comment(models.Model):
    """
    Modèle pour gérer les commentaires sur les rêves.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name="Utilisateur")
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE, related_name='comments', verbose_name="Rêve")
    content = models.TextField(verbose_name="Contenu du commentaire")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date du commentaire")

    class Meta:
        ordering = ['created_at'] # Ordonner les commentaires par le plus ancien en premier
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"

    def __str__(self):
        return f"Commentaire de {self.user.username} sur le rêve {self.dream.id}: {self.content[:50]}..."

class Notification(models.Model):
    """
    Modèle pour les notifications.
    """
    NOTIFICATION_TYPES = [
        ('friend_request', 'Demande d\'ami'),
        ('friend_accepted', 'Demande d\'ami acceptée'),
        ('dream_liked', 'Rêve aimé'),
        ('dream_commented', 'Rêve commenté'),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name="Destinataire")
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications', verbose_name="Expéditeur")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name="Type de notification")
    content = models.TextField(verbose_name="Contenu de la notification")
    is_read = models.BooleanField(default=False, verbose_name="Lu ?")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    related_dream = models.ForeignKey(Dream, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Rêve associé")
    related_friendship = models.ForeignKey(Friendship, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Amitié associée")

    class Meta:
        ordering = ['-created_at'] # Les notifications les plus récentes en premier
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"Notification pour {self.recipient.username} ({self.notification_type})"