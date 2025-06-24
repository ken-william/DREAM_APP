from django.db import models
from django.contrib.auth.models import User
from apps.dreams.models import Dream # Importation du modèle Dream

class Friendship(models.Model):
    """
    Modèle représentant une relation d'amitié bidirectionnelle entre deux utilisateurs.
    """
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_friendships', verbose_name="Utilisateur 1")
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friendships', verbose_name="Utilisateur 2")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    status = models.CharField(
        max_length=10,
        choices=[('pending', 'En attente'), ('accepted', 'Accepté'), ('rejected', 'Rejeté')],
        default='pending',
        verbose_name="Statut"
    )

    class Meta:
        # Assure qu'il n'y a pas de doublons pour une paire d'amis, quelle que soit l'ordre
        unique_together = ('user1', 'user2')
        verbose_name = "Amitié"
        verbose_name_plural = "Amis"

    def __str__(self):
        return f"Amitié entre {self.user1.username} et {self.user2.username} ({self.status})"

class Like(models.Model):
    """
    Modèle représentant un "like" sur un rêve.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes', verbose_name="Utilisateur")
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE, related_name='likes', verbose_name="Rêve")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date du like")

    class Meta:
        unique_together = ('user', 'dream') # Un utilisateur ne peut liker un rêve qu'une seule fois
        verbose_name = "J'aime"
        verbose_name_plural = "J'aimes"

    def __str__(self):
        return f"{self.user.username} a liké le rêve {self.dream.id}"

class Comment(models.Model):
    """
    Modèle représentant un commentaire sur un rêve.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name="Utilisateur")
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE, related_name='comments', verbose_name="Rêve")
    content = models.TextField(verbose_name="Contenu du commentaire")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date du commentaire")
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name="Commentaire parent")

    class Meta:
        ordering = ['created_at'] # Ordonner les commentaires par date croissante
        verbose_name = "Commentaire"
        verbose_name_plural = "Commentaires"

    def __str__(self):
        return f"Commentaire de {self.user.username} sur le rêve {self.dream.id}"

class Notification(models.Model):
    """
    Modèle représentant une notification pour un utilisateur.
    """
    TYPE_CHOICES = [
        ('like', 'J\'aime votre rêve'),
        ('comment', 'A commenté votre rêve'),
        ('friend_request', 'Demande d\'ami'),
        ('friend_accepted', 'A accepté votre demande d\'ami'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name="Destinataire")
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Expéditeur") # Peut être nul si le système envoie
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Rêve concerné")
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Type de notification")
    content = models.TextField(blank=True, verbose_name="Contenu personnalisé") # Ex: "Jane a aimé votre rêve"
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        ordering = ['-created_at'] # Ordonner les notifications par date décroissante
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"Notification pour {self.recipient.username}: {self.notification_type} - {self.content}"