from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL  # "accounts.CustomUser"

class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    to_user   = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=[
        ('pending', 'En attente'),
        ('accepted', 'Accepté'),
        ('rejected', 'Refusé'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user} → {self.to_user} ({self.status})"

class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Texte'),
        ('dream', 'Rêve partagé'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()  # Texte du message OU ID du rêve si type='dream'
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    dream = models.ForeignKey('dreams.Dream', on_delete=models.CASCADE, null=True, blank=True)  # Référence au rêve partagé
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        if self.message_type == 'dream':
            return f"De {self.sender} à {self.receiver} : [Rêve partagé]"
        return f"De {self.sender} à {self.receiver} : {self.content[:30]}"


# 🆕 Nouveaux modèles pour likes et commentaires
class DreamLike(models.Model):
    """Like sur un rêve"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dream = models.ForeignKey('dreams.Dream', on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'dream')  # Un seul like par utilisateur par rêve
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} aime le rêve #{self.dream.dream_id}"


class DreamComment(models.Model):
    """Commentaire sur un rêve"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dream = models.ForeignKey('dreams.Dream', on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} : {self.content[:50]}..."
