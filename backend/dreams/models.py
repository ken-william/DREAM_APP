from django.db import models
from django.conf import settings  # ✅ on importe settings au lieu de faire get_user_model()

class Dream(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('friends_only', 'Friends only'),
    ]

    dream_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_dreams',  # ✅ important pour éviter le lien par défaut
    )
    prompt = models.TextField()
    reformed_prompt = models.TextField()
    transcription = models.TextField()
    img_b64 = models.TextField(blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES)

    def __str__(self):
        return f"Dream {self.dream_id} - {self.privacy}"
