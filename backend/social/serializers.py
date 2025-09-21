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
        me = self.context["request"].user
        to_user = validated_data["to_user"]

        # S'il existe déjà une requête REJETÉE dans le même sens, on la "réactive"
        existing = FriendRequest.objects.filter(
            from_user=me, to_user=to_user, status="rejected"
        ).first()
        if existing:
            if existing.status != "pending":
                existing.status = "pending"
                existing.save(update_fields=["status"])
            return existing

        # Sinon on crée normalement
        return FriendRequest.objects.create(from_user=me, **validated_data)


class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    receiver = UserPublicSerializer(read_only=True)  # sortie seulement (nested)

    class Meta:
        model = Message
        fields = ["id", "sender", "receiver", "content", "dream", "timestamp"]

    def create(self, validated_data):
        sender = self.context["request"].user
        receiver = self.context.get("receiver")

        # 2) Fallback (au cas où la vue enverrait encore un id 'receiver' dans le payload)
        if receiver is None:
            receiver_id = self.initial_data.get("receiver")
            if receiver_id:
                try:
                    receiver = User.objects.get(pk=receiver_id)
                except User.DoesNotExist:
                    raise serializers.ValidationError({"receiver": "Invalid receiver."})

        if receiver is None:
            raise serializers.ValidationError({"receiver": "Receiver is required."})

        return Message.objects.create(sender=sender, receiver=receiver, **validated_data)

class DreamLikeSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    dream = serializers.PrimaryKeyRelatedField(read_only=True)  

    class Meta:
        model = DreamLike
        fields = ["id", "user", "dream", "created_at"]

    def create(self, validated_data):
        return DreamLike.objects.create(
            user=self.context["request"].user,
            dream=self.context["dream"]
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
            content=validated_data.get("content", ""),
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
