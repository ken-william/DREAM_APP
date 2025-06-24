from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from .serializers import UserRegistrationSerializer, UserSerializer, UserUpdateSerializer, ProfileSerializer

class UserRegistrationView(APIView):
    """
    Vue API pour l'inscription de nouveaux utilisateurs.
    """
    permission_classes = [AllowAny] # Permet l'accès sans authentification

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Générer les tokens JWT pour l'utilisateur nouvellement inscrit
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Inscription réussie.",
                "user_id": user.id,
                "username": user.username,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(RetrieveUpdateAPIView):
    """
    Vue API pour récupérer et mettre à jour le profil de l'utilisateur authentifié.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer # Pour GET (affichage du profil complet)
    permission_classes = [IsAuthenticated] # Nécessite une authentification

    def get_object(self):
        """
        Retourne l'objet User pour l'utilisateur actuellement authentifié.
        """
        return self.request.user

    def get_serializer_class(self):
        """
        Utilise un sérialiseur différent pour la mise à jour (PATCH/PUT) afin de gérer le profil imbriqué.
        """
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get(self, request, *args, **kwargs):
        """
        Récupère les détails de l'utilisateur et de son profil.
        """
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        """
        Met à jour les détails de l'utilisateur et de son profil.
        """
        return self.update(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        """
        Met à jour partiellement les détails de l'utilisateur et de son profil.
        """
        return self.partial_update(request, *args, **kwargs)