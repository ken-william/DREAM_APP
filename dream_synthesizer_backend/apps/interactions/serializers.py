# apps/interactions/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Friendship, Like, Comment, Notification
from apps.dreams.serializers import DreamSerializer # Pour les notifications de rêves

class FriendshipSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Friendship.
    """
    user1_username = serializers.CharField(source='user1.username', read_only=True)
    user2_username = serializers.CharField(source='user2.username', read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'user1', 'user2', 'user1_username', 'user2_username', 'status', 'created_at', 'updated_at']
        read_only_fields = ['user1', 'status', 'created_at', 'updated_at']

class FriendshipRequestSerializer(serializers.Serializer):
    """
    Sérialiseur pour l'envoi d'une demande d'ami.
    """
    user_id = serializers.IntegerField(help_text="ID de l'utilisateur à qui envoyer la demande d'ami.")

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("L'utilisateur avec cet ID n'existe pas.")
        if self.context['request'].user.id == value:
            raise serializers.ValidationError("Vous ne pouvez pas vous envoyer une demande d'ami à vous-même.")
        return value

class FriendshipActionSerializer(serializers.Serializer):
    """
    Sérialiseur pour accepter ou rejeter une demande d'ami.
    """
    friendship_id = serializers.IntegerField(help_text="ID de la relation d'amitié à traiter.")
    action = serializers.ChoiceField(choices=['accept', 'reject'], help_text="Action à effectuer ('accept' ou 'reject').")

    def validate_friendship_id(self, value):
        try:
            friendship = Friendship.objects.get(id=value)
            if friendship.user2 != self.context['request'].user:
                raise serializers.ValidationError("Vous n'êtes pas le destinataire de cette demande.")
            if friendship.status != 'pending':
                raise serializers.ValidationError("Cette demande n'est plus en attente.")
            return value
        except Friendship.DoesNotExist:
            raise serializers.ValidationError("La relation d'amitié n'existe pas.")

class LikeSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Like.
    """
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Like
        fields = ['id', 'user', 'username', 'dream', 'created_at']
        read_only_fields = ['user', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Comment.
    """
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'username', 'dream', 'content', 'created_at']
        read_only_fields = ['user', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Notification.
    """
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    # Si vous voulez afficher les détails du rêve ou de l'amitié liés
    # related_dream = DreamSerializer(read_only=True) # Si nécessaire, attention à la profondeur
    # related_friendship = FriendshipSerializer(read_only=True) # Si nécessaire, attention à la profondeur

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'recipient_username', 'sender', 'sender_username', 'notification_type', 'content', 'is_read', 'created_at', 'related_dream', 'related_friendship']
        read_only_fields = ['recipient', 'sender', 'notification_type', 'content', 'created_at', 'related_dream', 'related_friendship']