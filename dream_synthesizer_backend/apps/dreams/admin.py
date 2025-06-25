from django.contrib import admin
from .models import Dream

@admin.register(Dream)
class DreamAdmin(admin.ModelAdmin):
    """
    Personnalise l'affichage du modèle Dream dans l'interface d'administration.
    """
    list_display = ('user', 'timestamp', 'raw_prompt', 'image_path', 'visibility')
    list_filter = ('visibility', 'user', 'timestamp')
    search_fields = ('raw_prompt', 'user__username')
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp', 'image_path', 'emotion_analysis') # Ces champs sont générés ou ne sont pas modifiables directement
    fieldsets = (
        (None, {
            'fields': ('user', 'raw_prompt', 'visibility')
        }),
        ('Détails Générés', {
            'fields': ('image_path', 'emotion_analysis', 'timestamp'),
            'classes': ('collapse',) # Permet de masquer/afficher cette section
        }),
    )