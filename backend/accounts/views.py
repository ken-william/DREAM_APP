from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from django.contrib.auth import logout
from .serializers import *
from rest_framework.permissions import AllowAny
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_csrf_token(request):
    token = get_token(request)
    return Response({'csrfToken': token})


User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        print(f"👤 Tentative d'inscription avec les données: {request.data}")
        
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                token, _ = Token.objects.get_or_create(user=user)
                print(f"✅ Utilisateur créé avec succès: {user.username}")
                return Response({'token': token.key}, status=201)
            except Exception as e:
                print(f"❌ Erreur lors de la création: {e}")
                return Response({'error': f'Erreur lors de la création: {str(e)}'}, status=500)
        else:
            print(f"❌ Erreurs de validation: {serializer.errors}")
            return Response(serializer.errors, status=400)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        return Response(serializer.errors, status=400)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'error': 'Ancien mot de passe incorrect'}, status=400)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Mot de passe mis à jour'})
        return Response(serializer.errors, status=400)

class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        if serializer.is_valid() and serializer.validated_data['confirm']:
            user = request.user
            logout(request)
            user.delete()
            return Response({'message': 'Compte supprimé'}, status=204)
        return Response({'error': 'Confirmation manquante'}, status=400)
