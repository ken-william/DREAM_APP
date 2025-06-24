from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'inscription de nouveaux utilisateurs.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {'email': {'required': True}}

    def validate(self, data):
        """
        Vérifie que les deux mots de passe correspondent.
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Les deux mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        """
        Crée un nouvel utilisateur avec le mot de passe haché.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class ProfileSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Profile.
    """
    class Meta:
        model = Profile
        fields = ('bio', 'avatar') # Incluez les champs que vous voulez exposer/modifier via l'API
        read_only_fields = ['user'] # L'utilisateur est lié, non modifiable directement via le profil serializer

class UserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle User, incluant le profil imbriqué.
    Utilisé pour obtenir les détails de l'utilisateur et son profil.
    """
    profile = ProfileSerializer(read_only=True) # Imbrique le sérialiseur de profil

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined', 'profile')
        read_only_fields = ('id', 'username', 'email', 'date_joined')

class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la mise à jour du modèle User (email uniquement)
    et du Profile associé.
    """
    profile = ProfileSerializer() # Permet la mise à jour du profil imbriqué

    class Meta:
        model = User
        fields = ('email', 'profile')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        # Mettre à jour les champs de l'utilisateur (ici, juste l'email)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        # Mettre à jour les champs du profil
        profile_serializer = self.fields['profile']
        profile_instance = instance.profile
        # Update profile fields manually or pass to profile_serializer's update method
        for attr, value in profile_data.items():
            setattr(profile_instance, attr, value)
        profile_instance.save()

        return instance