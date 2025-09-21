#!/usr/bin/env python
"""
Script pour générer une SECRET_KEY Django sécurisée
Évite les caractères problématiques dans .env
"""

import secrets
import string

def generate_safe_secret_key(length=50):
    """Génère une clé sécurisée sans caractères problématiques pour .env"""
    # Caractères sûrs (pas de # @ ! etc.)
    safe_chars = string.ascii_letters + string.digits + '-_+='
    return ''.join(secrets.choice(safe_chars) for _ in range(length))

def generate_secret_key():
    """Génère une nouvelle SECRET_KEY sécurisée"""
    # Générer avec caractères sûrs
    safe_key = generate_safe_secret_key()
    
    print("=" * 60)
    print("🔐 NOUVELLE SECRET_KEY GÉNÉRÉE (SANS CARACTÈRES PROBLÉMATIQUES)")
    print("=" * 60)
    print("\n⚠️  IMPORTANT: Copiez cette clé dans votre fichier .env")
    print("    Ne la partagez JAMAIS et ne la commitez JAMAIS sur Git!\n")
    print("✅ Clé sans # @ ! pour éviter les problèmes .env")
    print(f"DJANGO_SECRET_KEY=\"{safe_key}\"")
    print("\n💡 Alternative avec la méthode Django standard :")
    
    # Aussi générer avec la méthode Django (avec guillemets)
    from django.core.management.utils import get_random_secret_key
    django_key = get_random_secret_key()
    print(f"DJANGO_SECRET_KEY=\"{django_key}\"")
    print("\n" + "=" * 60)
    
    # Optionnel : écrire dans un fichier
    response = input("\n💾 Voulez-vous sauvegarder dans .env.generated ? (o/n): ")
    if response.lower() == 'o':
        with open('.env.generated', 'w') as f:
            f.write(f"# Généré automatiquement - À copier dans .env\n")
            f.write(f"DJANGO_SECRET_KEY={key}\n")
        print("✅ Clé sauvegardée dans .env.generated")
        print("   Copiez-la dans votre .env et supprimez .env.generated")

if __name__ == '__main__':
    generate_secret_key()
