# apps/dreams/serializers.py
from rest_framework import serializers
from .models import Dream

class DreamSerializer(serializers.ModelSerializer):
    """
    Serializer for the Dream model.
    """
    # The user is read-only and will be automatically set by the view
    user = serializers.ReadOnlyField(source='user.username')
    # To display the ID of the user linked to the dream
    user_id = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = Dream
        fields = (
            'id', 'user', 'user_id', 'timestamp', 'raw_prompt', 'image_path',
            'emotion_analysis', 'visibility'
        )
        # REMOVED 'image_path' and 'emotion_analysis' from read_only_fields
        read_only_fields = ('id', 'user', 'user_id', 'timestamp')
        # raw_prompt and visibility can be modified by the user