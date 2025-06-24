from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    """
    Modèle de profil utilisateur, étendant le modèle User de Django.
    Contient des informations supplémentaires sur l'utilisateur.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True, null=True, verbose_name="Biographie")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Avatar")
    # Ajoutez d'autres champs de profil ici si nécessaire (ex: date de naissance, localisation)

    def __str__(self):
        return f"Profil de {self.user.username}"

# Signal pour créer ou mettre à jour le profil lorsque l'objet User est créé/mis à jour
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Crée un profil pour chaque nouvel utilisateur ou met à jour un profil existant.
    """
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save() # Ensure the profile is saved/updated on User save