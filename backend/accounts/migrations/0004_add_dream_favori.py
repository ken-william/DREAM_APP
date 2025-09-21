# Generated manually to add dream_favori field after dreams migration

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_fix_photo_profil_field'),
        ('dreams', '0004_alter_dream_user'),  # S'assurer que dreams est migré
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='dream_favori',
            field=models.ForeignKey(
                blank=True,
                help_text="Votre rêve préféré à afficher sur votre profil",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="utilisateur_favori",
                to='dreams.dream',
                verbose_name="Rêve favori"
            ),
        ),
    ]
