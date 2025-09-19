# social/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import FriendRequest, Message, DreamLike, DreamComment
from dreams.models import Dream  # pour les liens avec Dream

User = get_user_model()

class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"] 

class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserPublicSerializer(read_only=True)
    to_user = UserPublicSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "to_user", "status", "created_at"]

class FriendRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ["to_user"]

    def create(self, validated_data):
        return FriendRequest.objects.create(
            from_user=self.context["request"].user,
            **validated_data
        )

class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    receiver = UserPublicSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "receiver", "content", "dream", "timestamp"]

    def create(self, validated_data):
        return Message.objects.create(
            sender=self.context["request"].user,
            **validated_data
        )

class DreamLikeSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    dream = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DreamLike
        fields = ["id", "user", "dream", "created_at"]

    def create(self, validated_data):
        return DreamLike.objects.create(
            user=self.context["request"].user,
            dream=self.context["dream"],
            **validated_data
        )

class DreamCommentSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    dream = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DreamComment
        fields = ["id", "user", "dream", "content", "created_at"]

    def create(self, validated_data):
        return DreamComment.objects.create(
            user=self.context["request"].user,
            dream=self.context["dream"],
            **validated_data
        )

class FriendRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ["status"]

    def validate_status(self, value):
        if value not in ("accepted", "rejected"):
            raise serializers.ValidationError("Status must be 'accepted' or 'rejected'.")
        return value

    def validate(self, attrs):
        instance: FriendRequest = self.instance
        if instance is None:
            raise serializers.ValidationError("Instance is required.")
        if instance.status != "pending":
            raise serializers.ValidationError("This friend request is already resolved.")
        request = self.context.get("request")
        if request and request.user != instance.to_user:
            raise serializers.ValidationError("Only the recipient can accept/reject this request.")
        return attrs
