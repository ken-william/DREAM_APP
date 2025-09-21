"""
Script de migration pour gérer le changement du modèle CustomUser
À exécuter après makemigrations et migrate
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class Command(BaseCommand):
    help = 'Migre les données utilisateur et met à jour les statistiques'

    def handle(self, *args, **options):
        self.stdout.write('🔄 Migration des profils utilisateurs...')
        
        users_updated = 0
        
        # Pour chaque utilisateur
        for user in User.objects.all():
            try:
                # Mettre à jour les statistiques
                from dreams.models import Dream
                from social.models import FriendRequest
                
                # Compter les rêves
                dreams_count = Dream.objects.filter(user=user).count()
                
                # Compter les amis acceptés
                friends_count = FriendRequest.objects.filter(
                    models.Q(from_user=user) | models.Q(to_user=user),
                    status='accepted'
                ).distinct().count()
                
                # Mettre à jour l'utilisateur
                user.dreams_count = dreams_count
                user.friends_count = friends_count
                
                # Si l'utilisateur n'a pas de photo de profil, générer une URL placeholder
                if not user.photo_profil:
                    # Utiliser un service de génération d'avatar
                    user.photo_profil = f"https://ui-avatars.com/api/?name={user.username}&background=667eea&color=fff&size=200"
                
                user.save()
                users_updated += 1
                
                self.stdout.write(f'  ✓ {user.username}: {dreams_count} rêves, {friends_count} amis')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Erreur pour {user.username}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Migration terminée ! {users_updated} utilisateurs mis à jour.')
        )
