# apps/dreams/admin.py
from django.contrib import admin
from .models import Dream

@admin.register(Dream)
class DreamAdmin(admin.ModelAdmin):
    """
    Personnalisation de l'interface d'administration pour le modèle Dream.
    """
    list_display = ('user', 'timestamp', 'raw_prompt', 'visibility', 'image_path_exists', 'emotion_analysis_exists')
    list_filter = ('visibility', 'timestamp', 'user')
    search_fields = ('user__username', 'raw_prompt')
    raw_id_fields = ('user',) # Permet une recherche plus facile des utilisateurs
    readonly_fields = ('timestamp',) # Le timestamp est auto-généré

    def image_path_exists(self, obj):
        return bool(obj.image_path)
    image_path_exists.boolean = True
    image_path_exists.short_description = "Image générée ?"

    def emotion_analysis_exists(self, obj):
        return bool(obj.emotion_analysis)
    emotion_analysis_exists.boolean = True
    emotion_analysis_exists.short_description = "Analyse émotionnelle ?"
