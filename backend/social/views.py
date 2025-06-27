import logging
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from .models import FriendRequest, Message

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({'message': 'CSRF cookie set'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request, username):
    logger.info(f"[DEBUG] Méthode: {request.method} | Utilisateur cible: {username}")
    to_user = get_object_or_404(User, username=username)

    if request.user == to_user:
        logger.warning("[DEBUG] L'utilisateur tente de s'ajouter lui-même.")
        return Response({'detail': "Tu ne peux pas t'ajouter toi-même."}, status=status.HTTP_400_BAD_REQUEST)

    already_requested = FriendRequest.objects.filter(
        from_user=request.user,
        to_user=to_user
    ).exists()

    if already_requested:
        logger.warning("[DEBUG] Demande déjà existante.")
        return Response({'detail': "Demande déjà envoyée."}, status=status.HTTP_400_BAD_REQUEST)

    FriendRequest.objects.create(from_user=request.user, to_user=to_user)
    logger.info("[DEBUG] Demande créée avec succès.")
    return Response({'detail': "Demande envoyée."}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_requests(request):
    received = FriendRequest.objects.filter(to_user=request.user, status='pending')
    data = [{'id': r.id, 'from_user': r.from_user.username} for r in received]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_request(request, request_id, response):
    try:
        fr = FriendRequest.objects.get(id=request_id, to_user=request.user)
    except FriendRequest.DoesNotExist:
        return Response({'detail': "Demande introuvable ou accès non autorisé."}, status=status.HTTP_404_NOT_FOUND)

    if response == 'accept':
        fr.status = 'accepted'
        fr.save()
        return Response({'detail': "Demande acceptée."})

    elif response == 'reject':
        fr.delete()
        return Response({'detail': "Demande refusée."})

    return Response({'detail': "Réponse invalide."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def social_search(request):
    search_query = request.GET.get('search', '')
    users = []

    if search_query:
        users = User.objects.filter(username__icontains=search_query).exclude(id=request.user.id)

    return Response([{'username': u.username} for u in users])

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request, username):
    other_user = get_object_or_404(User, username=username)

    FriendRequest.objects.filter(
        (Q(from_user=request.user, to_user=other_user) |
         Q(from_user=other_user, to_user=request.user)),
        status='accepted'
    ).delete()

    return Response({'detail': 'Ami supprimé.'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    friends = User.objects.filter(
        Q(sent_requests__to_user=request.user, sent_requests__status='accepted') |
        Q(received_requests__from_user=request.user, received_requests__status='accepted')
    ).distinct()

    return Response([{'username': f.username} for f in friends])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@login_required
def get_messages(request, username):
    other_user = get_object_or_404(User, username=username)

    # Vérifie qu’ils sont amis
    are_friends = FriendRequest.objects.filter(
        (Q(from_user=request.user, to_user=other_user) |
         Q(from_user=other_user, to_user=request.user)),
        status='accepted'
    ).exists()

    if not are_friends:
        return JsonResponse({'detail': "Vous n'êtes pas amis."}, status=403)

    messages = Message.objects.filter(
        Q(sender=request.user, receiver=other_user) |
        Q(sender=other_user, receiver=request.user)
    ).order_by('timestamp')

    data = [{
        'sender': msg.sender.username,
        'receiver': msg.receiver.username,
        'content': msg.content,
        'timestamp': msg.timestamp.isoformat()
    } for msg in messages]

    return JsonResponse(data, safe=False)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, username):
    data = request.data
    content = data.get('content', '').strip()

    if not content:
        return JsonResponse({'detail': "Le message est vide."}, status=400)

    receiver = get_object_or_404(User, username=username)

    are_friends = FriendRequest.objects.filter(
        (Q(from_user=request.user, to_user=receiver) |
         Q(from_user=receiver, to_user=request.user)),
        status='accepted'
    ).exists()

    if not are_friends:
        return JsonResponse({'detail': "Vous n'êtes pas amis."}, status=403)

    Message.objects.create(sender=request.user, receiver=receiver, content=content)
    return JsonResponse({'detail': "Message envoyé."})
