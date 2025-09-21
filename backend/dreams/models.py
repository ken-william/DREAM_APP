from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, MaxLengthValidator

class Dream(models.Model):
    """
    Modèle principal pour les rêves
    """
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Privé'),
        ('friends_only', 'Amis seulement'),
    ]
    
    EMOTION_CHOICES = [
        ('heureux', 'Heureux'),
        ('triste', 'Triste'),
        ('stressant', 'Stressant'),
        ('neutre', 'Neutre'),
        ('excitant', 'Excitant'),
        ('mystérieux', 'Mystérieux'),
    ]

    # Identifiant principal
    dream_id = models.AutoField(primary_key=True)
    
    # Relation utilisateur
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dreams',
        verbose_name="Utilisateur"
    )
    
    # Contenu du rêve
    prompt = models.TextField(
        verbose_name="Prompt original (legacy)",
        help_text="Champ legacy - sera supprimé",
        null=True,
        blank=True
    )
    
    transcription = models.TextField(
        verbose_name="Transcription du rêve",
        validators=[MinLengthValidator(10, "Le rêve doit faire au moins 10 caractères")],
        help_text="Récit original du rêve tel que raconté"
    )
    
    reformed_prompt = models.TextField(
        verbose_name="Prompt reformulé",
        validators=[MaxLengthValidator(500, "Le prompt ne doit pas dépasser 500 caractères")],
        help_text="Version reformulée pour la génération d'image"
    )
    
    img_b64 = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Image en base64",
        help_text="Image générée du rêve en format base64"
    )
    
    # Métadonnées
    date = models.DateField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date et heure exactes"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )
    
    # Confidentialité
    privacy = models.CharField(
        max_length=20, 
        choices=PRIVACY_CHOICES, 
        default='private',
        verbose_name="Niveau de confidentialité"
    )
    
    # Analyse émotionnelle
    emotion = models.CharField(
        max_length=50, 
        choices=EMOTION_CHOICES,
        blank=True, 
        null=True,
        verbose_name="Émotion dominante"
    )
    
    emotion_confidence = models.FloatField(
        blank=True, 
        null=True,
        verbose_name="Confiance de l'analyse",
        help_text="Score de confiance de 0 à 1"
    )
    
    emotion_emoji = models.CharField(
        max_length=10, 
        blank=True, 
        null=True,
        verbose_name="Emoji associé"
    )
    
    emotion_color = models.CharField(
        max_length=10, 
        blank=True, 
        null=True,
        verbose_name="Couleur associée",
        help_text="Code couleur hexadécimal"
    )
    
    # Statistiques (dénormalisées pour performance)
    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Nombre de vues"
    )
    
    likes_count_cache = models.PositiveIntegerField(
        default=0,
        verbose_name="Cache du nombre de likes"
    )
    
    comments_count_cache = models.PositiveIntegerField(
        default=0,
        verbose_name="Cache du nombre de commentaires"
    )

    class Meta:
        verbose_name = "Rêve"
        verbose_name_plural = "Rêves"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['privacy', '-created_at']),
            models.Index(fields=['emotion']),
        ]

    def __str__(self):
        return f"Rêve #{self.dream_id} de {self.user.username} - {self.emotion or 'Non analysé'}"
    
    def save(self, *args, **kwargs):
        """Override save pour mettre à jour les caches"""
        # Si c'est une nouvelle création
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Mettre à jour les stats utilisateur si nouveau rêve
        if is_new and hasattr(self.user, 'update_stats'):
            self.user.update_stats()
    
    def update_cache_counts(self):
        """Met à jour les compteurs en cache"""
        self.likes_count_cache = self.likes.count()
        self.comments_count_cache = self.comments.count()
        self.save(update_fields=['likes_count_cache', 'comments_count_cache'])
    
    def increment_views(self):
        """Incrémente le compteur de vues"""
        self.views_count += 1
        self.save(update_fields=['views_count'])
    
    def can_view(self, user):
        """Vérifie si un utilisateur peut voir ce rêve"""
        # Le propriétaire peut toujours voir son rêve
        if self.user == user:
            return True
        
        # Rêve public : tout le monde peut voir
        if self.privacy == 'public':
            return True
        
        # Rêve privé : personne d'autre
        if self.privacy == 'private':
            return False
        
        # Rêve amis seulement : vérifier l'amitié
        if self.privacy == 'friends_only':
            from social.models import FriendRequest
            return FriendRequest.objects.filter(
                models.Q(from_user=self.user, to_user=user) |
                models.Q(from_user=user, to_user=self.user),
                status='accepted'
            ).exists()
        
        return False
    
    def can_edit(self, user):
        """Vérifie si un utilisateur peut éditer ce rêve"""
        return self.user == user
    
    @property
    def is_public(self):
        """Le rêve est-il public ?"""
        return self.privacy == 'public'
    
    @property
    def emotion_display(self):
        """Affichage formaté de l'émotion"""
        if self.emotion and self.emotion_emoji:
            return f"{self.emotion_emoji} {self.emotion.capitalize()}"
        return self.emotion or "Non analysé"
