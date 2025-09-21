from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from dreams.models import Dream

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription d'un nouvel utilisateur"""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password']

    def validate_email(self, value):
        """Vérifier que l'email n'est pas déjà utilisé"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cette adresse email est déjà utilisée")
        return value
    
    def validate_username(self, value):
        """Vérifier que le username n'est pas déjà utilisé"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé")
        return value

    def create(self, validated_data):
        """Créer un nouvel utilisateur"""
        try:
            user = User.objects.create_user(
                email=validated_data['email'],
                username=validated_data['username'],
                password=validated_data['password']
            )
            print(f"✅ Utilisateur {user.username} créé avec succès")
            return user
            
        except Exception as e:
            print(f"❌ Erreur dans create_user: {e}")
            raise serializers.ValidationError(f"Erreur lors de la création: {str(e)}")


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Identifiants invalides")
        return {'user': user}


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer complet du profil utilisateur"""
    dream_favori = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 
            'photo_profil', 'bio', 'dream_favori',
            'dreams_count', 'friends_count',
            'notification_email', 'privacy_default',
            'date_joined', 'last_active'
        ]
        read_only_fields = ['id', 'email', 'dreams_count', 'friends_count', 'date_joined', 'last_active']
    
    def get_dream_favori(self, obj):
        """Retourner les infos basiques du rêve favori"""
        if obj.dream_favori:
            return {
                'dream_id': obj.dream_favori.dream_id,
                'transcription': obj.dream_favori.transcription[:100] + '...' if len(obj.dream_favori.transcription) > 100 else obj.dream_favori.transcription,
                'img_b64': obj.dream_favori.img_b64,
                'emotion': obj.dream_favori.emotion,
                'date': obj.dream_favori.date
            }
        return None


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil"""
    class Meta:
        model = User
        fields = ['username', 'photo_profil', 'bio', 'dream_favori', 
                  'notification_email', 'privacy_default']
        
    def validate_dream_favori(self, value):
        """Vérifier que le rêve appartient bien à l'utilisateur"""
        if value and value.user != self.instance:
            raise serializers.ValidationError("Vous ne pouvez choisir que vos propres rêves comme favoris")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour le changement de mot de passe"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, data):
        """Valider que les nouveaux mots de passe correspondent"""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas")
        return data


class DeleteAccountSerializer(serializers.Serializer):
    """Serializer pour la suppression de compte"""
    confirm = serializers.BooleanField()
    password = serializers.CharField(write_only=True, help_text="Confirmez votre mot de passe pour supprimer le compte")


class PublicUserSerializer(serializers.ModelSerializer):
    """Serializer public pour afficher les infos utilisateur (sans données sensibles)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'photo_profil', 'bio', 'dreams_count', 'friends_count']
        read_only_fields = fields
