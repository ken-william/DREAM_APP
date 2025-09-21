# Migration pour remplir created_at et updated_at avec la valeur de date

from django.db import migrations
from django.utils import timezone


def populate_datetime_fields(apps, schema_editor):
    """Remplir created_at et updated_at avec la valeur de date"""
    Dream = apps.get_model('dreams', 'Dream')
    
    for dream in Dream.objects.all():
        # Utiliser la date existante pour created_at
        if dream.date:
            # Convertir date en datetime
            created_datetime = timezone.datetime.combine(
                dream.date, 
                timezone.datetime.min.time()
            )
            # S'assurer que c'est timezone-aware
            if timezone.is_naive(created_datetime):
                created_datetime = timezone.make_aware(created_datetime)
            
            dream.created_at = created_datetime
            dream.updated_at = created_datetime
            dream.save(update_fields=['created_at', 'updated_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('dreams', '0005_add_only_missing_fields'),
    ]

    operations = [
        migrations.RunPython(
            populate_datetime_fields,
            migrations.RunPython.noop
        ),
    ]
