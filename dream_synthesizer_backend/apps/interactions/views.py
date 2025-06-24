from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, CreateAPIView
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404

from django.contrib.auth.models import User
from apps.dreams.models import Dream # Pour accéder au modèle Dream
from apps.dreams.serializers import DreamSerializer # Pour sérialiser les rêves dans le feed
from .models import Friendship, Like, Comment, Notification
from .serializers import FriendshipSerializer, LikeSerializer, CommentSerializer, NotificationSerializer

from apps.users.serializers import UserSerializer
# --- Friendship Views ---

class FriendRequestView(APIView):
    """
    Vue API pour envoyer et gérer les demandes d'amitié.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Envoyer une demande d'ami."""
        user_to_add_id = request.data.get('user_id')
        if not user_to_add_id:
            return Response({"error": "User ID to add is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_to_add = User.objects.get(id=user_to_add_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user == user_to_add:
            return Response({"error": "You cannot send a friend request to yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si une demande est déjà en attente ou si déjà amis
        existing_friendship = Friendship.objects.filter(
            Q(user1=request.user, user2=user_to_add) | Q(user1=user_to_add, user2=request.user)
        ).first()

        if existing_friendship:
            if existing_friendship.status == 'pending':
                return Response({"message": "Friend request already pending."}, status=status.HTTP_200_OK)
            elif existing_friendship.status == 'accepted':
                return Response({"message": "Already friends."}, status=status.HTTP_200_OK)

        friendship = Friendship.objects.create(
            user1=request.user,
            user2=user_to_add,
            status='pending'
        )
        Notification.objects.create(
            recipient=user_to_add,
            sender=request.user,
            notification_type='friend_request',
            content=f"{request.user.username} vous a envoyé une demande d'ami."
        )
        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class FriendRequestActionView(APIView):
    """
    Vue API pour accepter ou rejeter une demande d'amitié.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        friendship_id = request.data.get('friendship_id')
        action = request.data.get('action') # 'accept' or 'reject'

        if not friendship_id or action not in ['accept', 'reject']:
            return Response({"error": "Friendship ID and action ('accept' or 'reject') are required."}, status=status.HTTP_400_BAD_REQUEST)

        friendship = get_object_or_404(Friendship, id=friendship_id)

        if friendship.user2 != request.user:
            return Response({"error": "You are not authorized to perform this action on this friendship request."}, status=status.HTTP_403_FORBIDDEN)

        if friendship.status != 'pending':
            return Response({"error": "Friend request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'accept':
            friendship.status = 'accepted'
            friendship.save()
            Notification.objects.create(
                recipient=friendship.user1,
                sender=request.user,
                notification_type='friend_accepted',
                content=f"{request.user.username} a accepté votre demande d'ami."
            )
            return Response({"message": "Friend request accepted."}, status=status.HTTP_200_OK)
        elif action == 'reject':
            friendship.status = 'rejected'
            friendship.save() # Ou Friendship.objects.delete(friendship) si vous voulez la supprimer
            return Response({"message": "Friend request rejected."}, status=status.HTTP_200_OK)

class FriendsListView(ListAPIView):
    """
    Vue API pour lister les amis acceptés de l'utilisateur authentifié.
    """
    serializer_class = UserSerializer # Utilisez le UserSerializer de l'app users pour afficher les détails des amis
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Récupérer les amitiés où l'utilisateur est user1 ou user2 et le statut est 'accepted'
        friends_id = Friendship.objects.filter(
            Q(user1=user, status='accepted') | Q(user2=user, status='accepted')
        ).values_list('user1_id', 'user2_id')

        # Extraire les IDs des amis
        friend_ids = []
        for u1_id, u2_id in friends_id:
            if u1_id == user.id:
                friend_ids.append(u2_id)
            else:
                friend_ids.append(u1_id)

        return User.objects.filter(id__in=friend_ids)


# --- Like Views ---

class LikeToggleView(APIView):
    """
    Vue API pour ajouter ou retirer un like sur un rêve.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, dream_id, *args, **kwargs):
        dream = get_object_or_404(Dream, id=dream_id)
        user = request.user

        like, created = Like.objects.get_or_create(user=user, dream=dream)

        if not created:
            # Si le like existait déjà, le supprimer (toggle off)
            like.delete()
            return Response({"message": "Like removed."}, status=status.HTTP_200_OK)
        else:
            # Si le like vient d'être créé (toggle on)
            # Optionnel: créer une notification pour l'auteur du rêve
            if dream.user != user:
                Notification.objects.create(
                    recipient=dream.user,
                    sender=user,
                    dream=dream,
                    notification_type='like',
                    content=f"{user.username} a aimé votre rêve '{dream.raw_prompt[:50]}...'"
                )
            return Response({"message": "Like added."}, status=status.HTTP_201_CREATED)

class DreamLikesListView(ListAPIView):
    """
    Vue API pour lister les likes d'un rêve spécifique.
    """
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        dream_id = self.kwargs['dream_id']
        dream = get_object_or_404(Dream, id=dream_id)
        # Assurez-vous que l'utilisateur a le droit de voir les likes du rêve (selon la visibilité du rêve)
        # Logique simplifiée ici: l'utilisateur doit être le propriétaire du rêve ou un ami ou le rêve est public
        if dream.visibility == 'public' or dream.user == self.request.user:
            return Like.objects.filter(dream=dream)
        elif dream.visibility == 'friends':
            # Vérifiez si l'utilisateur est ami avec le propriétaire du rêve
            is_friend = Friendship.objects.filter(
                Q(user1=self.request.user, user2=dream.user, status='accepted') |
                Q(user1=dream.user, user2=self.request.user, status='accepted')
            ).exists()
            if is_friend:
                return Like.objects.filter(dream=dream)
        raise ValidationError("You do not have permission to view likes for this dream.")


# --- Comment Views ---

class CommentListCreateView(ListAPIView, CreateAPIView):
    """
    Vue API pour lister les commentaires d'un rêve et en créer un nouveau.
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        dream_id = self.kwargs['dream_id']
        dream = get_object_or_404(Dream, id=dream_id)
        # Logique de permission pour voir les commentaires, similaire à DreamLikesListView
        if dream.visibility == 'public' or dream.user == self.request.user:
            return Comment.objects.filter(dream=dream, parent_comment__isnull=True) # Récupère seulement les commentaires de premier niveau
        elif dream.visibility == 'friends':
            is_friend = Friendship.objects.filter(
                Q(user1=self.request.user, user2=dream.user, status='accepted') |
                Q(user1=dream.user, user2=self.request.user, status='accepted')
            ).exists()
            if is_friend:
                return Comment.objects.filter(dream=dream, parent_comment__isnull=True)
        raise ValidationError("You do not have permission to view comments for this dream.")

    def perform_create(self, serializer):
        dream_id = self.kwargs['dream_id']
        dream = get_object_or_404(Dream, id=dream_id)
        user = self.request.user
        
        # Vérifiez la visibilité du rêve avant de permettre le commentaire
        if dream.visibility == 'private' and dream.user != user:
            raise ValidationError("You cannot comment on a private dream unless you are the owner.")
        if dream.visibility == 'friends':
            is_friend = Friendship.objects.filter(
                Q(user1=user, user2=dream.user, status='accepted') |
                Q(user1=dream.user, user2=user, status='accepted')
            ).exists()
            if not is_friend and dream.user != user:
                raise ValidationError("You can only comment on a friend's dream if you are friends.")

        comment = serializer.save(user=user, dream=dream)

        # Créer une notification pour l'auteur du rêve
        if dream.user != user:
            Notification.objects.create(
                recipient=dream.user,
                sender=user,
                dream=dream,
                notification_type='comment',
                content=f"{user.username} a commenté votre rêve '{dream.raw_prompt[:50]}...': \"{comment.content[:50]}...\""
            )
        # Si c'est une réponse à un autre commentaire, notifier l'auteur du commentaire parent
        if comment.parent_comment and comment.parent_comment.user != user:
             Notification.objects.create(
                recipient=comment.parent_comment.user,
                sender=user,
                dream=dream, # Le rêve est toujours lié au commentaire principal
                notification_type='comment',
                content=f"{user.username} a répondu à votre commentaire sur le rêve '{dream.raw_prompt[:50]}...': \"{comment.content[:50]}...\""
            )

class CommentDetailView(RetrieveUpdateDestroyAPIView):
    """
    Vue API pour récupérer, mettre à jour ou supprimer un commentaire spécifique.
    Seul l'auteur du commentaire peut le modifier/supprimer.
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Assure que l'utilisateur ne peut accéder qu'à ses propres commentaires ou aux commentaires qu'il a le droit de voir."""
        # Pour récupérer, on peut voir tous les commentaires d'un rêve visible
        # Pour update/destroy, l'utilisateur doit être l'auteur
        qs = super().get_queryset()
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return qs.filter(user=self.request.user)
        return qs # Pour GET, la permission sera gérée par Dream visiblity, mais ici on ne filtre pas par user

    def perform_update(self, serializer):
        # Assurez-vous que seul l'auteur peut modifier le commentaire
        if serializer.instance.user != self.request.user:
            raise ValidationError("You do not have permission to update this comment.")
        serializer.save()

    def perform_destroy(self, instance):
        # Assurez-vous que seul l'auteur peut supprimer le commentaire
        if instance.user != self.request.user:
            raise ValidationError("You do not have permission to delete this comment.")
        instance.delete()


# --- Notification Views ---

class NotificationListView(ListAPIView):
    """
    Vue API pour lister les notifications de l'utilisateur authentifié.
    Permet de filtrer par 'read' et de marquer comme lu.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)

        # Filtrer par statut lu/non lu
        is_read_param = self.request.query_params.get('is_read', None)
        if is_read_param is not None:
            if is_read_param.lower() == 'true':
                queryset = queryset.filter(is_read=True)
            elif is_read_param.lower() == 'false':
                queryset = queryset.filter(is_read=False)

        return queryset.order_by('-created_at')

class NotificationMarkAsReadView(APIView):
    """
    Vue API pour marquer une notification spécifique comme lue.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

class NotificationMarkAllAsReadView(APIView):
    """
    Vue API pour marquer toutes les notifications non lues de l'utilisateur comme lues.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"message": f"{count} notifications marquées comme lues."}, status=status.HTTP_200_OK)


# --- Feed View ---

class DreamFeedView(ListAPIView):
    """
    Vue API pour le fil d'actualité des rêves.
    Affiche les rêves publics, et les rêves des amis de l'utilisateur.
    """
    serializer_class = DreamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Rêves publics de tous les utilisateurs
        public_dreams = Dream.objects.filter(visibility='public')

        # Rêves des amis de l'utilisateur
        # Trouvez tous les IDs des amis de l'utilisateur actuel
        friend_ids = Friendship.objects.filter(
            Q(user1=user, status='accepted') | Q(user2=user, status='accepted')
        ).values_list('user1', 'user2')

        friends_of_user_ids = []
        for u1_id, u2_id in friend_ids:
            if u1_id == user.id:
                friends_of_user_ids.append(u2_id)
            else:
                friends_of_user_ids.append(u1_id)
        
        # Inclure les rêves de l'utilisateur lui-même (sauf s'ils sont privés)
        my_non_private_dreams = Dream.objects.filter(user=user).exclude(visibility='private')

        # Rêves partagés avec les amis (si l'utilisateur est ami avec le propriétaire du rêve)
        friends_dreams = Dream.objects.filter(
            user__id__in=friends_of_user_ids,
            visibility='friends'
        )

        # Rêves appartenant à l'utilisateur lui-même, s'ils ne sont pas privés
        user_own_dreams = Dream.objects.filter(user=user).exclude(visibility='private')

        # Combiner les querysets (distinct pour éviter les doublons)
        # Utiliser F() pour ordonner en fonction de l'utilisateur pour le fil d'actualité
        # Ou simplement ordonner par timestamp globalement
        combined_queryset = (
            public_dreams |
            friends_dreams |
            user_own_dreams
        ).distinct().order_by('-timestamp')

        return combined_queryset