from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """
    Modèle utilisateur personnalisé pour l'application DreamShare
    """
    email = models.EmailField(unique=True, verbose_name="Email")
    
    # Photo de profil - Utiliser une URL ou un fichier uploadé
    photo_profil = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="URL de la photo de profil",
        help_text="URL de votre photo de profil (peut être générée depuis un rêve)"
    )
    
    # OU utiliser ImageField pour upload direct (nécessite Pillow)
    # photo_profil = models.ImageField(
    #     upload_to='profiles/',
    #     blank=True,
    #     null=True,
    #     verbose_name="Photo de profil"
    # )
    
    # Métadonnées utilisateur
    bio = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Biographie",
        help_text="Parlez-nous de vos rêves..."
    )
    
    # Rêve favori pour le profil (optionnel)
    dream_favori = models.ForeignKey(
        'dreams.Dream',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="utilisateur_favori",
        verbose_name="Rêve favori",
        help_text="Votre rêve préféré à afficher sur votre profil"
    )
    
    # Statistiques
    dreams_count = models.PositiveIntegerField(default=0, verbose_name="Nombre de rêves")
    friends_count = models.PositiveIntegerField(default=0, verbose_name="Nombre d'amis")
    
    # Préférences
    notification_email = models.BooleanField(
        default=True,
        verbose_name="Notifications par email"
    )
    privacy_default = models.CharField(
        max_length=20,
        choices=[
            ('private', 'Privé'),
            ('friends_only', 'Amis uniquement'),
            ('public', 'Public')
        ],
        default='private',
        verbose_name="Confidentialité par défaut des rêves"
    )
    
    # Dates
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    last_active = models.DateTimeField(auto_now=True, verbose_name="Dernière activité")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.username} ({self.email})"
    
    def get_full_name(self):
        """Retourne le nom complet de l'utilisateur"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def update_stats(self):
        """Met à jour les statistiques de l'utilisateur"""
        from dreams.models import Dream
        from social.models import FriendRequest
        
        self.dreams_count = Dream.objects.filter(user=self).count()
        self.friends_count = FriendRequest.objects.filter(
            models.Q(from_user=self) | models.Q(to_user=self),
            status='accepted'
        ).count()
        self.save(update_fields=['dreams_count', 'friends_count'])
