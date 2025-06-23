from django.db import models

class Dream(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('friends_only', 'Friends only'),
    ]

    dream_id = models.AutoField(primary_key=True)
    prompt = models.TextField()
    reformed_prompt = models.TextField()
    transcription = models.TextField()
    img_id = models.IntegerField()  # ou ForeignKey vers un modèle d'image si tu veux le lier
    date = models.DateField(auto_now_add=True)
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES)

    def __str__(self):
        return f"Dream {self.dream_id} - {self.privacy}"
