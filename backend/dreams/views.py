# dreams/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Dream
from .serializers import DreamSerializer
from django.shortcuts import render

from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from .utils import transcribe_audio, rephrase_text, generate_image_base64, save_in_db

class DreamCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Ajout des parsers
    
    def get(self, request):
        return Response({"message": "Utilise POST pour créer un rêve."})
    
    def post(self, request):
        try:
            audio_file = request.FILES.get("audio")

            print(f"Format du fichier : {audio_file.content_type}")

            if not audio_file:
                return Response({"error": "Fichier audio requis."}, status=400)
            
            # Étape 1: Transcription
            transcription = transcribe_audio(audio_file)
            print(f"Transcription: {transcription}")
            
            # Étape 2: Reformulation
            prompt = rephrase_text(transcription)
            print(f"Prompt reformulé: {prompt}")
            
            # Étape 3: Génération d'image
            img_b64 = generate_image_base64(prompt)
            print("Image générée avec succès")
            
            # Étape 4: Sauvegarde
            dream = save_in_db(
                user=request.user, 
                transcription=transcription, 
                reformed_prompt=prompt, 
                img_b64=img_b64, 
                privacy="private"
            )
            
            return Response({
                "message": "Success",
                "dream_id": dream.dream_id,
                "transcription": transcription,
                "prompt": prompt,
                "image": img_b64  # Ajouter l'image base64 dans la réponse
            })
            
        except Exception as e:
            print(f"Erreur dans DreamCreateAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors du traitement: {str(e)}"
            }, status=500)


class DreamGenerateAPIView(APIView):
    """
    API pour générer un rêve SANS le sauvegarder (preview)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        try:
            audio_file = request.FILES.get("audio")

            print(f"Format du fichier : {audio_file.content_type}")

            if not audio_file:
                return Response({"error": "Fichier audio requis."}, status=400)
            
            # Étape 1: Transcription
            transcription = transcribe_audio(audio_file)
            print(f"Transcription: {transcription}")
            
            # Étape 2: Reformulation
            prompt = rephrase_text(transcription)
            print(f"Prompt reformulé: {prompt}")
            
            # Étape 3: Génération d'image (SANS sauvegarde)
            img_b64 = generate_image_base64(prompt)
            print("Image générée avec succès (pas encore sauvée)")
            
            # ❌ PAS DE SAUVEGARDE ICI
            # Retourner les données pour preview
            
            return Response({
                "message": "Rêve généré (preview)",
                "transcription": transcription,
                "prompt": prompt,
                "image": img_b64,
                # Données nécessaires pour la sauvegarde ultérieure
                "preview_data": {
                    "transcription": transcription,
                    "reformed_prompt": prompt,
                    "img_b64": img_b64
                }
            })
            
        except Exception as e:
            print(f"Erreur dans DreamGenerateAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors de la génération: {str(e)}"
            }, status=500)


class DreamSaveAPIView(APIView):
    """
    API pour sauvegarder un rêve préalablement généré
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Récupérer les données du rêve à sauvegarder
            transcription = request.data.get('transcription')
            reformed_prompt = request.data.get('reformed_prompt') 
            img_b64 = request.data.get('img_b64')
            privacy = request.data.get('privacy', 'private')  # Par défaut privé
            
            if not all([transcription, reformed_prompt, img_b64]):
                return Response({
                    "error": "Données manquantes pour la sauvegarde"
                }, status=400)
            
            # Valider le privacy
            if privacy not in ['public', 'private', 'friends_only']:
                privacy = 'private'
            
            # Sauvegarder en base
            dream = save_in_db(
                user=request.user,
                transcription=transcription,
                reformed_prompt=reformed_prompt, 
                img_b64=img_b64,
                privacy=privacy
            )
            
            return Response({
                "message": "Rêve sauvegardé avec succès",
                "dream_id": dream.dream_id,
                "privacy": dream.privacy
            })
            
        except Exception as e:
            print(f"Erreur dans DreamSaveAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors de la sauvegarde: {str(e)}"
            }, status=500)


class DreamListAPIView(APIView):
    """
    API pour récupérer tous les rêves de l'utilisateur connecté
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Récupérer tous les rêves de l'utilisateur, triés par date (plus récent en premier)
            dreams = Dream.objects.filter(user=request.user).order_by('-date')
            
            # Sérialiser les données
            serializer = DreamSerializer(dreams, many=True)
            
            # Ajouter quelques stats
            stats = {
                'total_dreams': dreams.count(),
                'public_dreams': dreams.filter(privacy='public').count(),
                'private_dreams': dreams.filter(privacy='private').count(),
                'friends_only_dreams': dreams.filter(privacy='friends_only').count(),
            }
            
            return Response({
                'dreams': serializer.data,
                'stats': stats
            })
            
        except Exception as e:
            print(f"Erreur dans DreamListAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors de la récupération des rêves: {str(e)}"
            }, status=500)


class PublicDreamsFeedAPIView(APIView):
    """
    API pour récupérer les rêves publics de tous les utilisateurs (feed principal)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from django.core.paginator import Paginator
            from django.db.models import Q
            
            # Paramètres de pagination
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
            
            # Récupérer tous les rêves publics, triés par date (plus récent en premier)
            # Exclure les rêves de l'utilisateur actuel pour éviter de voir ses propres rêves
            sort_by = request.GET.get('sort', 'recent')  # 'recent' ou 'popular'
            
            dreams_queryset = Dream.objects.filter(
                privacy='public'
            ).exclude(
                user=request.user
            ).select_related('user').prefetch_related('likes', 'comments')
            
            # Tri selon le paramètre
            if sort_by == 'popular':
                # Trier par nombre de likes (plus populaire en premier)
                from django.db.models import Count
                dreams = dreams_queryset.annotate(
                    likes_count=Count('likes')
                ).order_by('-likes_count', '-date')
            else:
                # Tri par date (par défaut)
                dreams = dreams_queryset.order_by('-date')
            
            # Pagination
            paginator = Paginator(dreams, per_page)
            current_page = paginator.get_page(page)
            
            # Sérialiser avec infos utilisateur + likes/commentaires
            dreams_data = []
            for dream in current_page:
                # Compter likes et commentaires
                likes_count = dream.likes.count()
                comments_count = dream.comments.count()
                user_liked = dream.likes.filter(user=request.user).exists()
                
                dream_data = {
                    'dream_id': dream.dream_id,
                    'transcription': dream.transcription[:200] + '...' if len(dream.transcription) > 200 else dream.transcription,
                    'reformed_prompt': dream.reformed_prompt,
                    'img_b64': dream.img_b64,
                    'date': dream.date,
                    'privacy': dream.privacy,
                    'user': {
                        'id': dream.user.id,
                        'username': dream.user.username,
                        'email': dream.user.email
                    },
                    # 🆕 Nouvelles données sociales
                    'likes_count': likes_count,
                    'comments_count': comments_count,
                    'user_liked': user_liked
                }
                dreams_data.append(dream_data)
            
            return Response({
                'dreams': dreams_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_items': paginator.count,
                    'has_next': current_page.has_next(),
                    'has_previous': current_page.has_previous(),
                    'per_page': per_page
                }
            })
            
        except Exception as e:
            print(f"Erreur dans PublicDreamsFeedAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors de la récupération du feed: {str(e)}"
            }, status=500)


class FriendsDreamsFeedAPIView(APIView):
    """
    API pour récupérer les rêves des amis de l'utilisateur
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from django.core.paginator import Paginator
            from social.models import FriendRequest
            
            # Paramètres de pagination
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
            sort_by = request.GET.get('sort', 'recent')  # 'recent' ou 'popular'
            
            # Récupérer les IDs des amis acceptés
            friend_requests_sent = FriendRequest.objects.filter(
                from_user=request.user, 
                status='accepted'
            ).values_list('to_user', flat=True)
            
            friend_requests_received = FriendRequest.objects.filter(
                to_user=request.user, 
                status='accepted'
            ).values_list('from_user', flat=True)
            
            # Combiner les listes d'amis
            friends_ids = list(friend_requests_sent) + list(friend_requests_received)
            
            if not friends_ids:
                return Response({
                    'dreams': [],
                    'pagination': {
                        'current_page': 1,
                        'total_pages': 0,
                        'total_items': 0,
                        'has_next': False,
                        'has_previous': False,
                        'per_page': per_page
                    },
                    'message': 'Aucun ami trouvé. Ajoutez des amis pour voir leurs rêves !'
                })
            
            # Récupérer les rêves des amis (public + friends_only)
            dreams_queryset = Dream.objects.filter(
                user__id__in=friends_ids,
                privacy__in=['public', 'friends_only']
            ).select_related('user').prefetch_related('likes', 'comments')
            
            # Tri selon le paramètre
            if sort_by == 'popular':
                # Trier par nombre de likes (plus populaire en premier)
                from django.db.models import Count
                dreams = dreams_queryset.annotate(
                    likes_count=Count('likes')
                ).order_by('-likes_count', '-date')
            else:
                # Tri par date (par défaut)
                dreams = dreams_queryset.order_by('-date')
            
            # Pagination
            paginator = Paginator(dreams, per_page)
            current_page = paginator.get_page(page)
            
            # Sérialiser avec infos utilisateur + likes/commentaires
            dreams_data = []
            for dream in current_page:
                # Compter likes et commentaires
                likes_count = dream.likes.count()
                comments_count = dream.comments.count()
                user_liked = dream.likes.filter(user=request.user).exists()
                
                dream_data = {
                    'dream_id': dream.dream_id,
                    'transcription': dream.transcription[:200] + '...' if len(dream.transcription) > 200 else dream.transcription,
                    'reformed_prompt': dream.reformed_prompt,
                    'img_b64': dream.img_b64,
                    'date': dream.date,
                    'privacy': dream.privacy,
                    'user': {
                        'id': dream.user.id,
                        'username': dream.user.username,
                        'email': dream.user.email
                    },
                    # 🆕 Nouvelles données sociales
                    'likes_count': likes_count,
                    'comments_count': comments_count,
                    'user_liked': user_liked
                }
                dreams_data.append(dream_data)
            
            return Response({
                'dreams': dreams_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_items': paginator.count,
                    'has_next': current_page.has_next(),
                    'has_previous': current_page.has_previous(),
                    'per_page': per_page
                },
                'friends_count': len(friends_ids)
            })
            
        except Exception as e:
            print(f"Erreur dans FriendsDreamsFeedAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors de la récupération des rêves d'amis: {str(e)}"
            }, status=500)


def home_page(request):
    return HttpResponse("Dream App is up")


class DreamUpdatePrivacyAPIView(APIView):
    """
    API pour modifier la privacy d'un rêve
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, dream_id):
        try:
            # Vérifier que le rêve existe et appartient à l'utilisateur
            dream = Dream.objects.get(dream_id=dream_id, user=request.user)
            
            # Récupérer la nouvelle privacy
            new_privacy = request.data.get('privacy')
            
            # Valider la privacy
            if new_privacy not in ['public', 'private', 'friends_only']:
                return Response({
                    "error": "Privacy invalide. Utilisez: public, private, ou friends_only"
                }, status=400)
            
            # Mettre à jour la privacy
            dream.privacy = new_privacy
            dream.save()
            
            return Response({
                "message": "Privacy mise à jour avec succès",
                "dream_id": dream.dream_id,
                "privacy": dream.privacy
            })
            
        except Dream.DoesNotExist:
            return Response({
                "error": "Rêve introuvable ou vous n'en êtes pas le propriétaire"
            }, status=404)
        except Exception as e:
            print(f"Erreur dans DreamUpdatePrivacyAPIView: {str(e)}")
            return Response({
                "error": f"Erreur lors de la mise à jour: {str(e)}"
            }, status=500)