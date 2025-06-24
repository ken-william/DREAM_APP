from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile

# Define an inline admin descriptor for Profile model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    """
    Permet d'afficher et de modifier le profil directement depuis l'interface d'administration de l'utilisateur.
    """
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    """
    Personnalise l'interface d'administration du modèle User pour inclure le profil.
    """
    inlines = (ProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_profile_bio')

    def get_profile_bio(self, obj):
        """
        Affiche la biographie du profil dans la liste des utilisateurs.
        """
        return obj.profile.bio
    get_profile_bio.short_description = 'Bio du Profil'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Profile) # Register Profile separately for direct access if needed