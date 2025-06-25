# apps/interactions/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from .models import Friendship, Like, Comment, Notification
from .serializers import (
    FriendshipSerializer, FriendshipRequestSerializer, FriendshipActionSerializer,
    LikeSerializer, CommentSerializer, NotificationSerializer
)
from apps.dreams.models import Dream # Importez le modèle Dream

class FriendshipViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les amitiés.
    - list: Récupère les amitiés acceptées de l'utilisateur.
    - request: Envoie une demande d'ami.
    - request_action: Accepte ou rejette une demande d'ami.
    """
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retourne toutes les amitiés acceptées où l'utilisateur est user1 ou user2.
        """
        user = self.request.user
        return Friendship.objects.filter(
            Q(user1=user) | Q(user2=user),
            status='accepted'
        ).distinct()
    
    # Nous désactivons les méthodes par défaut (create, retrieve, update, destroy)
    # car nous utiliserons des actions personnalisées pour une logique plus fine.
    http_method_names = ['get'] # Autoriser seulement GET pour la liste des amis.

    @action(detail=False, methods=['post'], serializer_class=FriendshipRequestSerializer)
    def request(self, request):
        """
        Envoie une demande d'ami à un autre utilisateur.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user_id = serializer.validated_data['user_id']
        target_user = get_object_or_404(User, id=target_user_id)
        current_user = request.user

        if current_user == target_user:
            return Response({"error": "Vous ne pouvez pas vous envoyer une demande d'ami à vous-même."}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si une demande existe déjà dans n'importe quel sens ou si déjà amis
        existing_friendship = Friendship.objects.filter(
            (Q(user1=current_user, user2=target_user) | Q(user1=target_user, user2=current_user))
        ).first()

        if existing_friendship:
            if existing_friendship.status == 'pending':
                return Response({"message": "Une demande d'ami est déjà en attente."}, status=status.HTTP_200_OK)
            elif existing_friendship.status == 'accepted':
                return Response({"message": "Vous êtes déjà amis avec cet utilisateur."}, status=status.HTTP_200_OK)
            elif existing_friendship.status == 'rejected':
                # Si rejetée, on peut permettre de renvoyer ou ne rien faire
                # Ici, on va re-créer une demande si elle était rejetée (ou la passer en pending)
                existing_friendship.status = 'pending'
                existing_friendship.save()
                return Response({"message": "Demande d'ami renvoyée."}, status=status.HTTP_200_OK)
        
        # Créer la nouvelle demande d'ami
        friendship = Friendship.objects.create(user1=current_user, user2=target_user, status='pending')
        # Créer une notification pour le destinataire
        Notification.objects.create(
            recipient=target_user,
            sender=current_user,
            notification_type='friend_request',
            content=f"{current_user.username} vous a envoyé une demande d'ami.",
            related_friendship=friendship
        )
        return Response({"message": "Demande d'ami envoyée avec succès.", "id": friendship.id}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], serializer_class=FriendshipActionSerializer)
    def request_action(self, request):
        """
        Accepte ou rejette une demande d'ami.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        friendship_id = serializer.validated_data['friendship_id']
        action_type = serializer.validated_data['action']

        friendship = get_object_or_404(Friendship, id=friendship_id)

        # Seul le user2 (destinataire de la demande) peut accepter/rejeter
        if friendship.user2 != request.user:
            return Response({"error": "Vous n'êtes pas autorisé à effectuer cette action sur cette demande."}, status=status.HTTP_403_FORBIDDEN)
        
        if friendship.status != 'pending':
            return Response({"error": "Cette demande n'est plus en attente."}, status=status.HTTP_400_BAD_REQUEST)

        if action_type == 'accept':
            friendship.status = 'accepted'
            friendship.save()
            # Créer une notification pour l'expéditeur de la demande
            Notification.objects.create(
                recipient=friendship.user1,
                sender=request.user,
                notification_type='friend_accepted',
                content=f"{request.user.username} a accepté votre demande d'ami.",
                related_friendship=friendship
            )
            return Response({"message": "Demande d'ami acceptée."}, status=status.HTTP_200_OK)
        elif action_type == 'reject':
            friendship.status = 'rejected'
            friendship.save()
            # Optionnel: Créer une notification pour l'expéditeur si la demande est rejetée
            # Notification.objects.create(
            #     recipient=friendship.user1,
            #     sender=request.user,
            #     notification_type='friend_rejected',
            #     content=f"{request.user.username} a rejeté votre demande d'ami.",
            #     related_friendship=friendship
            # )
            return Response({"message": "Demande d'ami rejetée."}, status=status.HTTP_200_OK)
        
        return Response({"error": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)

class LikeViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les likes sur les rêves.
    """
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Limite les likes aux likes de l'utilisateur authentifié.
        """
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Associe le like à l'utilisateur authentifié et crée une notification.
        """
        dream = serializer.validated_data['dream']
        if Like.objects.filter(user=self.request.user, dream=dream).exists():
            raise serializers.ValidationError("Vous avez déjà aimé ce rêve.")
        
        like = serializer.save(user=self.request.user)
        # Créer une notification pour l'auteur du rêve
        if dream.user != self.request.user: # Ne pas notifier si l'utilisateur aime son propre rêve
            Notification.objects.create(
                recipient=dream.user,
                sender=self.request.user,
                notification_type='dream_liked',
                content=f"{self.request.user.username} a aimé votre rêve.",
                related_dream=dream
            )

    @action(detail=True, methods=['post'], url_path='unlike')
    def unlike(self, request, pk=None):
        """
        Permet de 'disliker' un rêve (supprimer le like).
        """
        try:
            like = Like.objects.get(pk=pk, user=request.user)
            like.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Like.DoesNotExist:
            return Response({"error": "Like non trouvé ou non autorisé."}, status=status.HTTP_404_NOT_FOUND)

class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les commentaires sur les rêves.
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Limite les commentaires aux commentaires de l'utilisateur authentifié,
        ou aux commentaires sur les rêves publics/amis.
        """
        # Pour récupérer les commentaires d'un rêve spécifique
        dream_id = self.request.query_params.get('dream_id')
        if dream_id:
            # Assurez-vous que l'utilisateur a le droit de voir le rêve avant de voir ses commentaires
            dream = get_object_or_404(Dream, id=dream_id)
            if dream.visibility == 'public':
                return Comment.objects.filter(dream=dream)
            elif dream.visibility == 'friends':
                # Logique pour vérifier si l'utilisateur est ami avec l'auteur du rêve
                from apps.interactions.models import Friendship # Local import
                if not (Friendship.objects.filter(
                    Q(user1=self.request.user, user2=dream.user, status='accepted') |
                    Q(user1=dream.user, user2=self.request.user, status='accepted')
                ).exists() or dream.user == self.request.user):
                    return Comment.objects.none() # Pas autorisé
                return Comment.objects.filter(dream=dream)
            elif dream.visibility == 'private' and dream.user != self.request.user:
                return Comment.objects.none() # Pas autorisé
            return Comment.objects.filter(dream=dream)
        
        # Si pas de dream_id, retourner les commentaires de l'utilisateur actuel
        return self.queryset.filter(user=self.request.user)


    def perform_create(self, serializer):
        """
        Associe le commentaire à l'utilisateur authentifié et crée une notification.
        """
        comment = serializer.save(user=self.request.user)
        # Créer une notification pour l'auteur du rêve
        if comment.dream.user != self.request.user: # Ne pas notifier si l'utilisateur commente son propre rêve
            Notification.objects.create(
                recipient=comment.dream.user,
                sender=self.request.user,
                notification_type='dream_commented',
                content=f"{self.request.user.username} a commenté votre rêve: '{comment.content[:50]}...'",
                related_dream=comment.dream
            )

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les notifications de l'utilisateur.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post'] # Autoriser GET (list/retrieve) et POST (actions comme marquer lu)

    def get_queryset(self):
        """
        Limite les notifications aux notifications du destinataire authentifié.
        """
        # Permettre de filtrer par type de notification ou par statut de lecture
        queryset = self.queryset.filter(recipient=self.request.user)
        is_read = self.request.query_params.get('is_read', None)
        notification_type = self.request.query_params.get('notification_type', None)

        if is_read is not None:
            is_read_bool = is_read.lower() in ['true', '1']
            queryset = queryset.filter(is_read=is_read_bool)
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """
        Marque une notification spécifique comme lue.
        """
        notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        """
        Marque toutes les notifications de l'utilisateur comme lues.
        """
        notifications = Notification.objects.filter(recipient=request.user, is_read=False)
        count = notifications.update(is_read=True)
        return Response({"message": f"{count} notifications marquées comme lues."}, status=status.HTTP_200_OK)