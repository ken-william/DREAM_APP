from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

class CustomRegisterForm(UserCreationForm):
    class Meta:
        model = get_user_model()
        fields = ('username', 'email', 'password1', 'password2')
        labels = {
            'username': 'Nom d’utilisateur',
            'email': 'Adresse email',
            'password1': 'Mot de passe',
            'password2': 'Confirmez votre mot de passe',
        }