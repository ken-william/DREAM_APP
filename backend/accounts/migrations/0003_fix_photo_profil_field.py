# Generated manually to fix photo_profil field type conflict

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_initial'),
    ]

    operations = [
        # Supprimer l'ancien champ OneToOneField
        migrations.RemoveField(
            model_name='customuser',
            name='photo_profil',
        ),
        # Ajouter le nouveau champ URLField
        migrations.AddField(
            model_name='customuser',
            name='photo_profil',
            field=models.URLField(
                blank=True,
                help_text="URL de votre photo de profil (peut être générée depuis un rêve)",
                max_length=500,
                null=True,
                verbose_name="URL de la photo de profil"
            ),
        ),
        # Ajouter les nouveaux champs manquants
        migrations.AddField(
            model_name='customuser',
            name='bio',
            field=models.TextField(
                blank=True,
                help_text="Parlez-nous de vos rêves...",
                max_length=500,
                verbose_name="Biographie"
            ),
        ),
        migrations.AddField(
            model_name='customuser',
            name='dreams_count',
            field=models.PositiveIntegerField(default=0, verbose_name="Nombre de rêves"),
        ),
        migrations.AddField(
            model_name='customuser',
            name='friends_count',
            field=models.PositiveIntegerField(default=0, verbose_name="Nombre d'amis"),
        ),
        migrations.AddField(
            model_name='customuser',
            name='notification_email',
            field=models.BooleanField(default=True, verbose_name="Notifications par email"),
        ),
        migrations.AddField(
            model_name='customuser',
            name='privacy_default',
            field=models.CharField(
                choices=[
                    ('private', 'Privé'),
                    ('friends_only', 'Amis uniquement'),
                    ('public', 'Public')
                ],
                default='private',
                max_length=20,
                verbose_name="Confidentialité par défaut des rêves"
            ),
        ),
        migrations.AddField(
            model_name='customuser',
            name='last_active',
            field=models.DateTimeField(auto_now=True, verbose_name="Dernière activité"),
        ),
    ]
