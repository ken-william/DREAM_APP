from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Friendship, Like, Comment, Notification
from apps.users.serializers import UserSerializer # Importation du sérialiseur User pour les relations
from apps.dreams.serializers import DreamSerializer # Importation du sérialiseur Dream


class FriendshipSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Friendship.
    Permet de visualiser les utilisateurs impliqués dans une amitié.
    """
    user1_username = serializers.ReadOnlyField(source='user1.username')
    user2_username = serializers.ReadOnlyField(source='user2.username')

    class Meta:
        model = Friendship
        fields = ('id', 'user1', 'user1_username', 'user2', 'user2_username', 'status', 'created_at')
        read_only_fields = ('user1', 'status', 'created_at') # user1 et status sont définis par la logique métier

class LikeSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Like.
    """
    user_username = serializers.ReadOnlyField(source='user.username')
    dream_id = serializers.ReadOnlyField(source='dream.id')

    class Meta:
        model = Like
        fields = ('id', 'user', 'user_username', 'dream', 'dream_id', 'created_at')
        read_only_fields = ('user', 'created_at')

class CommentSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Comment.
    """
    user_username = serializers.ReadOnlyField(source='user.username')
    dream_id = serializers.ReadOnlyField(source='dream.id')
    replies = serializers.SerializerMethodField() # Pour les commentaires imbriqués (réponses)

    class Meta:
        model = Comment
        fields = ('id', 'user', 'user_username', 'dream', 'dream_id', 'content', 'created_at', 'parent_comment', 'replies')
        read_only_fields = ('user', 'created_at')

    def get_replies(self, obj):
        """
        Récupère les réponses (commentaires enfants) d'un commentaire.
        """
        if obj.replies.exists():
            # Attention à la récursion infinie; limitez la profondeur si nécessaire
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

class NotificationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Notification.
    """
    sender_username = serializers.ReadOnlyField(source='sender.username')
    recipient_username = serializers.ReadOnlyField(source='recipient.username')
    dream_id = serializers.ReadOnlyField(source='dream.id')

    class Meta:
        model = Notification
        fields = ('id', 'recipient', 'recipient_username', 'sender', 'sender_username', 'dream', 'dream_id', 'notification_type', 'content', 'is_read', 'created_at')
        read_only_fields = ('recipient', 'sender', 'dream', 'notification_type', 'content', 'created_at')