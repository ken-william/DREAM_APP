from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Dream

User = get_user_model()

class DreamUserSerializer(serializers.ModelSerializer):
    """Serializer pour les infos utilisateur dans un rêve"""
    class Meta:
        model = User
        fields = ['id', 'username', 'photo_profil']
        read_only_fields = fields


class DreamSerializer(serializers.ModelSerializer):
    """Serializer complet pour un rêve"""
    user = DreamUserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Dream
        fields = [
            'dream_id', 'user', 
            'transcription', 'reformed_prompt', 
            'img_b64', 'date', 'privacy',
            'emotion', 'emotion_confidence', 
            'emotion_emoji', 'emotion_color',
            'likes_count', 'comments_count', 'user_liked'
        ]
        read_only_fields = ['dream_id', 'date', 'user']
    
    def get_likes_count(self, obj):
        """Nombre de likes sur le rêve"""
        return obj.likes.count() if hasattr(obj, 'likes') else 0
    
    def get_comments_count(self, obj):
        """Nombre de commentaires sur le rêve"""
        return obj.comments.count() if hasattr(obj, 'comments') else 0
    
    def get_user_liked(self, obj):
        """L'utilisateur actuel a-t-il liké ce rêve ?"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class DreamListSerializer(serializers.ModelSerializer):
    """Serializer optimisé pour les listes de rêves (moins de données)"""
    user = DreamUserSerializer(read_only=True)
    has_image = serializers.SerializerMethodField()
    truncated_transcription = serializers.SerializerMethodField()
    
    class Meta:
        model = Dream
        fields = [
            'dream_id', 'user', 
            'truncated_transcription', 'date', 'privacy',
            'emotion', 'emotion_emoji', 'emotion_color',
            'has_image'
        ]
        read_only_fields = fields
    
    def get_has_image(self, obj):
        """Le rêve a-t-il une image ?"""
        return bool(obj.img_b64)
    
    def get_truncated_transcription(self, obj):
        """Transcription tronquée pour les listes"""
        max_length = 200
        if len(obj.transcription) > max_length:
            return obj.transcription[:max_length] + '...'
        return obj.transcription


class DreamCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'un rêve"""
    class Meta:
        model = Dream
        fields = [
            'transcription', 'reformed_prompt', 
            'img_b64', 'privacy',
            'emotion', 'emotion_confidence',
            'emotion_emoji', 'emotion_color'
        ]
    
    def create(self, validated_data):
        """Créer un rêve en associant l'utilisateur actuel"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)


class DreamUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour d'un rêve"""
    class Meta:
        model = Dream
        fields = ['privacy', 'reformed_prompt']
    
    def validate(self, data):
        """Validation des données de mise à jour"""
        if 'privacy' in data:
            valid_choices = ['private', 'public', 'friends_only']
            if data['privacy'] not in valid_choices:
                raise serializers.ValidationError(
                    f"Privacy doit être parmi : {', '.join(valid_choices)}"
                )
        return data


class DreamExportSerializer(serializers.ModelSerializer):
    """Serializer pour l'export de rêves"""
    user = serializers.StringRelatedField()
    formatted_date = serializers.SerializerMethodField()
    privacy_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Dream
        fields = [
            'dream_id', 'user', 
            'transcription', 'reformed_prompt',
            'img_b64', 'formatted_date', 'privacy_label',
            'emotion', 'emotion_emoji'
        ]
        read_only_fields = fields
    
    def get_formatted_date(self, obj):
        """Date formatée pour l'export"""
        return obj.date.strftime('%d/%m/%Y') if obj.date else 'Date inconnue'
    
    def get_privacy_label(self, obj):
        """Label de privacy pour l'export"""
        labels = {
            'private': '🔒 Privé',
            'friends_only': '👥 Amis seulement',
            'public': '🌍 Public'
        }
        return labels.get(obj.privacy, '🔒 Privé')


class DreamStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques des rêves"""
    total_dreams = serializers.IntegerField()
    public_dreams = serializers.IntegerField()
    private_dreams = serializers.IntegerField()
    friends_only_dreams = serializers.IntegerField()
    
    emotions_distribution = serializers.DictField(
        child=serializers.IntegerField(),
        required=False
    )
    
    dreams_per_month = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    
    most_liked_dream = DreamListSerializer(required=False)
    most_commented_dream = DreamListSerializer(required=False)
