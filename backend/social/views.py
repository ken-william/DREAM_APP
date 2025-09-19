# social/views.py
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import FriendRequest, Message, DreamLike, DreamComment
from dreams.models import Dream
from .serializers import (
    UserPublicSerializer,
    FriendRequestSerializer, FriendRequestCreateSerializer, FriendRequestUpdateSerializer,
    MessageSerializer,
    DreamLikeSerializer,
    DreamCommentSerializer,
)

User = get_user_model()


# ----------------------
# Helpers
# ----------------------
def _are_friends(a: User, b: User) -> bool:
    return FriendRequest.objects.filter(
        status="accepted"
    ).filter(
        (Q(from_user=a, to_user=b)) | (Q(from_user=b, to_user=a))
    ).exists()


# ----------------------
# Vues (match avec ton urls.py)
# ----------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def social_search(request):
    """
    GET /api/social/search/?search=xxx
    Recherche d'utilisateurs par username (icontains).
    """
    q = (request.GET.get("search") or "").strip()
    if not q:
        return Response({"results": []}, status=status.HTTP_200_OK)

    users = User.objects.filter(username__icontains=q).exclude(id=request.user.id).order_by("username")[:20]
    data = UserPublicSerializer(users, many=True).data
    return Response({"results": data}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_friend_request(request, username: str):
    """
    POST /api/social/friend-request/<username>/
    Envoie une demande d'ami.
    """
    me = request.user
    if getattr(me, "username", None) == username:
        return Response({"detail": "Impossible de s'ajouter soi-même."}, status=status.HTTP_400_BAD_REQUEST)

    to_user = get_object_or_404(User, username=username)

    # Existe déjà (pending/accepted) dans un sens ou l'autre ?
    exists = FriendRequest.objects.filter(
        (Q(from_user=me, to_user=to_user) | Q(from_user=to_user, to_user=me))
    ).exclude(status="rejected").exists()
    if exists:
        return Response({"detail": "Demande déjà existante."}, status=status.HTTP_400_BAD_REQUEST)

    ser = FriendRequestCreateSerializer(data={"to_user": to_user.id}, context={"request": request})
    if ser.is_valid():
        fr = ser.save()
        return Response(FriendRequestSerializer(fr).data, status=status.HTTP_201_CREATED)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friends(request):
    """
    GET /api/social/friends/
    Liste des amis (status=accepted dans un sens OU l'autre).
    """
    me = request.user
    accepted = FriendRequest.objects.filter(status="accepted").filter(Q(from_user=me) | Q(to_user=me))
    # Liste des users amis
    friend_ids = set(fr.to_user_id if fr.from_user_id == me.id else fr.from_user_id for fr in accepted)
    friends = User.objects.filter(id__in=friend_ids)
    return Response(UserPublicSerializer(friends, many=True).data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def view_requests(request):
    """
    GET /api/social/requests/
    Demandes reçues en attente (to_user=me, status=pending)
    """
    me = request.user
    pendings = FriendRequest.objects.filter(status="pending", to_user=me).select_related("from_user", "to_user").order_by("-id")
    return Response(FriendRequestSerializer(pendings, many=True).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_to_request(request, request_id: int, action: str):
    """
    POST /api/social/respond/<request_id>/<action>/
    action ∈ {'accept','reject'}
    """
    me = request.user
    fr = get_object_or_404(FriendRequest, id=request_id, to_user=me, status="pending")

    if action not in {"accept", "reject"}:
        return Response({"detail": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)

    new_status = "accepted" if action == "accept" else "rejected"
    ser = FriendRequestUpdateSerializer(fr, data={"status": new_status}, context={"request": request}, partial=True)
    if ser.is_valid():
        ser.save()
        return Response(FriendRequestSerializer(fr).data, status=status.HTTP_200_OK)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_friend(request, username: str):
    """
    POST /api/social/remove-friend/<username>/
    Supprime le lien d'amitié (toutes les requêtes 'accepted' dans les deux sens).
    """
    me = request.user
    other = get_object_or_404(User, username=username)

    qs = FriendRequest.objects.filter(status="accepted").filter(
        (Q(from_user=me, to_user=other)) | (Q(from_user=other, to_user=me))
    )
    deleted, _ = qs.delete()
    return Response({"detail": f"Amitié supprimée ({deleted} enregistrement(s))."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request, username: str):
    """
    GET /api/social/messages/<username>/
    Récupère le thread avec 'username'.
    """
    other = get_object_or_404(User, username=username)
    me = request.user
    if not _are_friends(me, other):
        return Response({"detail": "Vous n'êtes pas amis."}, status=status.HTTP_403_FORBIDDEN)

    qs = Message.objects.filter(
        (Q(sender=me, receiver=other)) | (Q(sender=other, receiver=me))
    ).select_related('sender', 'receiver', 'dream').order_by("timestamp", "id")

    return Response(MessageSerializer(qs, many=True).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, username: str):
    """
    POST /api/social/messages/send/<username>/
    Envoie un message à 'username'
    Payload attendu:
      - message_type: "text" ou "dream"
      - content (si text)
      - dream (id du rêve si dream)
    """
    other = get_object_or_404(User, username=username)
    me = request.user
    if not _are_friends(me, other):
        return Response({"detail": "Vous n'êtes pas amis."}, status=status.HTTP_403_FORBIDDEN)

    payload = {
        "receiver": other.id,
        "content": request.data.get("content", ""),
        "message_type": request.data.get("message_type", "text"),
        "dream": request.data.get("dream"),  # id ou null
    }
    ser = MessageSerializer(data=payload, context={"request": request})
    if ser.is_valid():
        msg = ser.save()
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def share_dream(request, username: str):
    """
    POST /api/social/share-dream/<username>/
    Partage un rêve avec un ami (payload: { "dream_id": 123, "message": "..." }).
    """
    me = request.user
    other = get_object_or_404(User, username=username)

    if not _are_friends(me, other):
        return Response({"detail": "Vous n'êtes pas amis."}, status=status.HTTP_403_FORBIDDEN)

    dream_id = request.data.get("dream_id")
    if not dream_id:
        return Response({"detail": "ID du rêve requis."}, status=status.HTTP_400_BAD_REQUEST)

    dream = get_object_or_404(Dream, dream_id=dream_id)

    # Permissions de partage selon la privacy
    if dream.privacy == 'private' and dream.user != me:
        return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
    if dream.privacy == 'friends_only' and dream.user != me and not _are_friends(me, dream.user):
        return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)

    payload = {
        "receiver": other.id,
        "message_type": "dream",
        "dream": dream.id,
        "content": request.data.get("message", "") or f"A partagé un rêve : {dream.transcription[:50]}...",
    }
    ser = MessageSerializer(data=payload, context={"request": request})
    if ser.is_valid():
        msg = ser.save()
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_dream_like(request, dream_id: int):
    """
    POST /api/social/dream/<dream_id>/like/
    Like/Unlike un rêve.
    """
    dream = get_object_or_404(Dream, dream_id=dream_id)

    # Vérifier visibilité
    if dream.privacy == 'private' and dream.user != request.user:
        return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
    if dream.privacy == 'friends_only' and dream.user != request.user and not _are_friends(request.user, dream.user):
        return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)

    # Toggle
    existing = DreamLike.objects.filter(user=request.user, dream=dream)
    if existing.exists():
        existing.delete()
        liked = False
    else:
        # ⬇️ Option 1: on ne passe plus 'dream' dans data, on l'injecte via le context
        ser = DreamLikeSerializer(
            data={},  # rien à poster
            context={"request": request, "dream": dream},
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        liked = True

    total_likes = DreamLike.objects.filter(dream=dream).count()
    return Response({"liked": liked, "total_likes": total_likes}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_dream_comment(request, dream_id: int):
    dream = get_object_or_404(Dream, dream_id=dream_id)

    # Vérifier visibilité
    if dream.privacy == 'private' and dream.user != request.user:
        return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
    if dream.privacy == 'friends_only' and dream.user != request.user and not _are_friends(request.user, dream.user):
        return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)

    # Option 1: on passe l'objet dream via le context (plus de dream.id/dream.dream_id dans data)
    ser = DreamCommentSerializer(
        data={"content": request.data.get("content", "")},
        context={"request": request, "dream": dream},
    )
    if ser.is_valid():
        comment = ser.save()
        return Response(DreamCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dream_comments(request, dream_id: int):
    """
    GET /api/social/dream/<dream_id>/comments/
    Récupérer les commentaires d'un rêve.
    """
    dream = get_object_or_404(Dream, dream_id=dream_id)

    # Vérifier visibilité
    if dream.privacy == 'private' and dream.user != request.user:
        return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
    if dream.privacy == 'friends_only' and dream.user != request.user and not _are_friends(request.user, dream.user):
        return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)

    comments = DreamComment.objects.filter(dream=dream).select_related('user').order_by("-created_at")
    return Response(DreamCommentSerializer(comments, many=True).data, status=status.HTTP_200_OK)
