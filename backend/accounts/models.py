from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    # Utilisation d'une chaîne pour éviter l'import circulaire
    photo_profil = models.OneToOneField(
        'dreams.Dream',  # <== ✅ CORRECTION ici
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="utilisateur_profil"
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
