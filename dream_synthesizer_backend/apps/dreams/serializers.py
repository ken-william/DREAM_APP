from rest_framework import serializers
from .models import Dream

class DreamSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Dream.
    """
    # L'utilisateur est en lecture seule et sera défini automatiquement par la vue
    user = serializers.ReadOnlyField(source='user.username')
    # Pour afficher l'ID de l'utilisateur qui est lié au rêve
    user_id = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = Dream
        fields = (
            'id', 'user', 'user_id', 'timestamp', 'raw_prompt', 'image_path',
            'emotion_analysis', 'visibility'
        )
        read_only_fields = ('id', 'user', 'user_id', 'timestamp', 'image_path', 'emotion_analysis')
        # raw_prompt et visibility peuvent être modifiés par l'utilisateur