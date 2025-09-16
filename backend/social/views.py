from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import FriendRequest, Message, DreamLike, DreamComment

User = get_user_model()

# ----------------------
# Helpers de sérialisation
# ----------------------
def _serialize_user(u):
    return {"id": u.id, "username": u.username, "email": u.email}

def _serialize_message(m):
    # Gestion des anciens messages qui n'ont pas message_type
    message_type = getattr(m, 'message_type', 'text')
    
    base_data = {
        "id": m.id,
        "from_id": m.sender_id,
        "to_id": m.receiver_id,
        "from_username": m.sender.username,
        "to_username": m.receiver.username,
        "message_type": message_type,
        "text": m.content if message_type == 'text' else '',
        "created_at": m.timestamp.isoformat() if getattr(m, "timestamp", None) else None,
    }
    
    # Si c'est un rêve partagé, ajouter les détails du rêve
    if message_type == 'dream' and hasattr(m, 'dream') and m.dream:
        base_data["dream"] = {
            "dream_id": m.dream.dream_id,
            "transcription": m.dream.transcription[:150] + '...' if len(m.dream.transcription) > 150 else m.dream.transcription,
            "reformed_prompt": m.dream.reformed_prompt,
            "img_b64": m.dream.img_b64,
            "date": m.dream.date.isoformat() if m.dream.date else None,
            "privacy": m.dream.privacy,
        }
    
    return base_data

# ----------------------
# Blocs métier "génériques" (utilisés par plusieurs routes)
# ----------------------
def _are_friends(a: User, b: User) -> bool:
    return FriendRequest.objects.filter(
        status="accepted"
    ).filter(
        (Q(from_user=a, to_user=b)) | (Q(from_user=b, to_user=a))
    ).exists()

# ----------------------
# Vues exigées par ton urls.py
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
    users = User.objects.filter(username__icontains=q).order_by("username")[:20]
    return Response({"results": [_serialize_user(u) for u in users]}, status=status.HTTP_200_OK)


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
    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Existe déjà (pending/accepted) dans un sens ou l'autre ?
    exists = FriendRequest.objects.filter(
        (Q(from_user=me, to_user=other) | Q(from_user=other, to_user=me))
    ).exclude(status="rejected").exists()
    if exists:
        return Response({"detail": "Demande déjà existante."}, status=status.HTTP_400_BAD_REQUEST)

    fr = FriendRequest.objects.create(from_user=me, to_user=other, status="pending")
    return Response({"id": fr.id, "detail": "Demande envoyée."}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friends(request):
    """
    GET /api/social/friends/
    Liste des amis (status=accepted dans un sens OU l'autre).
    """
    me = request.user
    accepted = FriendRequest.objects.filter(status="accepted").filter(Q(from_user=me) | Q(to_user=me))
    friend_ids = set(fr.to_user_id if fr.from_user_id == me.id else fr.from_user_id for fr in accepted)
    friends = User.objects.filter(id__in=friend_ids)
    return Response([_serialize_user(u) for u in friends], status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def view_requests(request):
    """
    GET /api/social/requests/
    Demandes reçues en attente (to_user=me, status=pending)
    """
    me = request.user
    pendings = FriendRequest.objects.filter(status="pending", to_user=me).order_by("-id")
    data = [{
        "id": fr.id,
        "from": _serialize_user(fr.from_user),
        "to": _serialize_user(fr.to_user),
        "status": fr.status,
    } for fr in pendings]
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_to_request(request, request_id: int, action: str):
    """
    POST /api/social/respond/<request_id>/<action>/
    action ∈ {'accept','reject'}
    """
    me = request.user
    try:
        fr = FriendRequest.objects.get(id=request_id, to_user=me, status="pending")
    except FriendRequest.DoesNotExist:
        return Response({"detail": "Demande introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if action not in {"accept", "reject"}:
        return Response({"detail": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)

    fr.status = "accepted" if action == "accept" else "rejected"
    fr.save(update_fields=["status"])
    return Response({"detail": f"Demande {action}ed."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_friend(request, username: str):
    """
    POST /api/social/remove-friend/<username>/
    Supprime le lien d'amitié (toutes les requêtes 'accepted' dans les deux sens).
    """
    me = request.user
    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    qs = FriendRequest.objects.filter(status="accepted").filter(
        (Q(from_user=me, to_user=other)) | (Q(from_user=other, to_user=me))
    )
    deleted, _ = qs.delete()
    return Response({"detail": f"Amitié supprimée ({deleted} enregistrement(s))."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request, username: str):
    """
    Récupère le thread avec 'username'.
    """
    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    me = request.user
    if not _are_friends(me, other):
        return Response({"detail": "Vous n'êtes pas amis."}, status=status.HTTP_403_FORBIDDEN)

    qs = Message.objects.filter(
        (Q(sender=me, receiver=other)) | (Q(sender=other, receiver=me))
    ).select_related('sender', 'receiver', 'dream').order_by("timestamp", "id")
    
    return Response([_serialize_message(m) for m in qs], status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, username: str):
    """
    Envoie un message à 'username' (payload: { "text": "...", "message_type": "text" }).
    """
    data = request.data or {}
    text = data.get("text", "").strip()
    message_type = data.get("message_type", "text")
    
    if message_type not in ['text', 'dream']:
        return Response({"detail": "Type de message invalide."}, status=status.HTTP_400_BAD_REQUEST)
    
    if message_type == "text" and not text:
        return Response({"detail": "Message vide."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    me = request.user
    if not _are_friends(me, other):
        return Response({"detail": "Vous n'êtes pas amis."}, status=status.HTTP_403_FORBIDDEN)

    msg = Message.objects.create(sender=me, receiver=other, content=text, message_type=message_type)
    return Response(_serialize_message(msg), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def share_dream(request, username: str):
    """
    Partage un rêve avec un ami (payload: { "dream_id": 123, "message": "Regarde ce rêve !" }).
    """
    data = request.data or {}
    dream_id = data.get("dream_id")
    message_text = data.get("message", "").strip()
    
    if not dream_id:
        return Response({"detail": "ID du rêve requis."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    me = request.user
    if not _are_friends(me, other):
        return Response({"detail": "Vous n'êtes pas amis."}, status=status.HTTP_403_FORBIDDEN)

    # Vérifier que le rêve existe et qu'on a le droit de le partager
    try:
        from dreams.models import Dream
        dream = Dream.objects.get(dream_id=dream_id)
        
        # Vérifier les permissions de partage
        if dream.privacy == 'private' and dream.user != me:
            return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
        elif dream.privacy == 'friends_only' and dream.user != me and not _are_friends(me, dream.user):
            return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)
        
    except Dream.DoesNotExist:
        return Response({"detail": "Rêve introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Créer le message avec le rêve attaché
    msg = Message.objects.create(
        sender=me, 
        receiver=other, 
        content=message_text or f"A partagé un rêve : {dream.transcription[:50]}...",
        message_type='dream',
        dream=dream
    )
    
    return Response(_serialize_message(msg), status=status.HTTP_201_CREATED)


# 🆕 NOUVELLES VUES POUR LIKES ET COMMENTAIRES

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_dream_like(request, dream_id: int):
    """
    Like/Unlike un rêve
    """
    try:
        from dreams.models import Dream
        dream = Dream.objects.get(dream_id=dream_id)
        
        # Vérifier que le rêve est visible par l'utilisateur
        if dream.privacy == 'private' and dream.user != request.user:
            return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
        elif dream.privacy == 'friends_only' and dream.user != request.user and not _are_friends(request.user, dream.user):
            return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)
        
    except Dream.DoesNotExist:
        return Response({"detail": "Rêve introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Toggle like
    like, created = DreamLike.objects.get_or_create(
        user=request.user,
        dream=dream
    )
    
    if created:
        # Like ajouté
        action = "liked"
    else:
        # Like supprimé
        like.delete()
        action = "unliked"
    
    # Compter les likes totaux
    total_likes = DreamLike.objects.filter(dream=dream).count()
    
    return Response({
        "action": action,
        "total_likes": total_likes,
        "user_liked": action == "liked"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_dream_comment(request, dream_id: int):
    """
    Ajouter un commentaire sur un rêve
    """
    content = request.data.get("content", "").strip()
    if not content:
        return Response({"detail": "Commentaire vide."}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(content) > 500:
        return Response({"detail": "Commentaire trop long (500 caractères max)."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from dreams.models import Dream
        dream = Dream.objects.get(dream_id=dream_id)
        
        # Vérifier que le rêve est visible par l'utilisateur
        if dream.privacy == 'private' and dream.user != request.user:
            return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
        elif dream.privacy == 'friends_only' and dream.user != request.user and not _are_friends(request.user, dream.user):
            return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)
        
    except Dream.DoesNotExist:
        return Response({"detail": "Rêve introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Créer le commentaire
    comment = DreamComment.objects.create(
        user=request.user,
        dream=dream,
        content=content
    )
    
    return Response({
        "id": comment.id,
        "content": comment.content,
        "user": {
            "id": comment.user.id,
            "username": comment.user.username
        },
        "created_at": comment.created_at.isoformat()
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dream_comments(request, dream_id: int):
    """
    Récupérer les commentaires d'un rêve
    """
    try:
        from dreams.models import Dream
        dream = Dream.objects.get(dream_id=dream_id)
        
        # Vérifier que le rêve est visible par l'utilisateur
        if dream.privacy == 'private' and dream.user != request.user:
            return Response({"detail": "Ce rêve est privé."}, status=status.HTTP_403_FORBIDDEN)
        elif dream.privacy == 'friends_only' and dream.user != request.user and not _are_friends(request.user, dream.user):
            return Response({"detail": "Ce rêve n'est visible que par les amis du créateur."}, status=status.HTTP_403_FORBIDDEN)
        
    except Dream.DoesNotExist:
        return Response({"detail": "Rêve introuvable."}, status=status.HTTP_404_NOT_FOUND)

    comments = DreamComment.objects.filter(dream=dream).select_related('user')
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            "id": comment.id,
            "content": comment.content,
            "user": {
                "id": comment.user.id,
                "username": comment.user.username
            },
            "created_at": comment.created_at.isoformat()
        })
    
    return Response({
        "comments": comments_data,
        "total": len(comments_data)
    })