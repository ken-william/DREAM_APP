import logging
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET

from .models import FriendRequest

logger = logging.getLogger(__name__)


@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({'message': 'CSRF cookie set'})
@csrf_protect
@login_required
def send_friend_request(request, username):
    logger.info(f"[DEBUG] Méthode: {request.method} | Utilisateur cible: {username}")
    
    if request.method == 'POST':
        logger.info(f"[DEBUG] Corps de la requête: {request.body}")
        to_user = get_object_or_404(User, username=username)

        if request.user == to_user:
            logger.warning("[DEBUG] L'utilisateur tente de s'ajouter lui-même.")
            return JsonResponse({'detail': "Tu ne peux pas t'ajouter toi-même."}, status=400)

        already_requested = FriendRequest.objects.filter(
            from_user=request.user,
            to_user=to_user
        ).exists()

        if already_requested:
            logger.warning("[DEBUG] Demande déjà existante.")
            return JsonResponse({'detail': "Demande déjà envoyée."}, status=400)

        FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        logger.info("[DEBUG] Demande créée avec succès.")
        return JsonResponse({'detail': "Demande envoyée."})

    logger.error(f"[DEBUG] Méthode non autorisée: {request.method}")
    return JsonResponse({'detail': "Méthode non autorisée."}, status=405)


@login_required
def view_requests(request):
    received = FriendRequest.objects.filter(to_user=request.user, status='pending')
    data = [{'id': r.id, 'from_user': r.from_user.username} for r in received]
    return JsonResponse(data, safe=False)


@login_required
def respond_to_request(request, request_id, response):
    if request.method == 'POST':
        fr = get_object_or_404(FriendRequest, id=request_id, to_user=request.user)
        if response == 'accept':
            fr.status = 'accepted'
            fr.save()
            return JsonResponse({'detail': "Demande acceptée."})
        elif response == 'reject':
            fr.delete()
            return JsonResponse({'detail': "Demande refusée."})
    return JsonResponse({'detail': "Méthode non autorisée."}, status=405)


@login_required
def social_search(request):
    search_query = request.GET.get('search', '')
    users = []

    if search_query:
        users = User.objects.filter(username__icontains=search_query).exclude(id=request.user.id)

    return JsonResponse([{'username': u.username} for u in users], safe=False)


@login_required
def get_friends(request):
    friends = User.objects.filter(
        Q(sent_requests__to_user=request.user, sent_requests__status='accepted') |
        Q(received_requests__from_user=request.user, received_requests__status='accepted')
    ).distinct()

    return JsonResponse([{'username': f.username} for f in friends], safe=False)
