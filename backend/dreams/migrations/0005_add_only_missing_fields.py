# Generated manually to add only missing fields (created_at, updated_at, statistics)

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('dreams', '0004_alter_dream_user'),
    ]

    operations = [
        # Ajouter seulement les champs qui manquent vraiment
        
        # 1. Champs datetime manquants
        migrations.AddField(
            model_name='dream',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True,
                verbose_name="Date et heure exactes",
                null=True  # Temporairement nullable pour les données existantes
            ),
        ),
        migrations.AddField(
            model_name='dream',
            name='updated_at',
            field=models.DateTimeField(
                auto_now=True,
                verbose_name="Dernière modification",
                null=True  # Temporairement nullable
            ),
        ),
        
        # 2. Champs de statistiques
        migrations.AddField(
            model_name='dream',
            name='views_count',
            field=models.PositiveIntegerField(
                default=0,
                verbose_name="Nombre de vues"
            ),
        ),
        migrations.AddField(
            model_name='dream',
            name='likes_count_cache',
            field=models.PositiveIntegerField(
                default=0,
                verbose_name="Cache du nombre de likes"
            ),
        ),
        migrations.AddField(
            model_name='dream',
            name='comments_count_cache',
            field=models.PositiveIntegerField(
                default=0,
                verbose_name="Cache du nombre de commentaires"
            ),
        ),
        
        # 3. Améliorer les champs existants (ajouter validateurs et verbose_name)
        migrations.AlterField(
            model_name='dream',
            name='transcription',
            field=models.TextField(
                help_text="Récit original du rêve tel que raconté",
                validators=[django.core.validators.MinLengthValidator(10, "Le rêve doit faire au moins 10 caractères")],
                verbose_name="Transcription du rêve"
            ),
        ),
        migrations.AlterField(
            model_name='dream',
            name='reformed_prompt',
            field=models.TextField(
                help_text="Version reformulée pour la génération d'image",
                validators=[django.core.validators.MaxLengthValidator(500, "Le prompt ne doit pas dépasser 500 caractères")],
                verbose_name="Prompt reformulé"
            ),
        ),
        
        # 4. Améliorer les champs d'émotion existants
        migrations.AlterField(
            model_name='dream',
            name='emotion',
            field=models.CharField(
                blank=True,
                choices=[
                    ('heureux', 'Heureux'),
                    ('triste', 'Triste'),
                    ('stressant', 'Stressant'),
                    ('neutre', 'Neutre'),
                    ('excitant', 'Excitant'),
                    ('mystérieux', 'Mystérieux'),
                ],
                max_length=50,
                null=True,
                verbose_name="Émotion dominante"
            ),
        ),
        migrations.AlterField(
            model_name='dream',
            name='emotion_confidence',
            field=models.FloatField(
                blank=True,
                help_text="Score de confiance de 0 à 1",
                null=True,
                verbose_name="Confiance de l'analyse"
            ),
        ),
        migrations.AlterField(
            model_name='dream',
            name='emotion_emoji',
            field=models.CharField(
                blank=True,
                max_length=10,
                null=True,
                verbose_name="Emoji associé"
            ),
        ),
        migrations.AlterField(
            model_name='dream',
            name='emotion_color',
            field=models.CharField(
                blank=True,
                help_text="Code couleur hexadécimal",
                max_length=10,
                null=True,
                verbose_name="Couleur associée"
            ),
        ),
    ]
