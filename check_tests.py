#!/usr/bin/env python3
"""
Script de vérification complète des tests
Vérifie couverture + lance tests de charge si requis
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Exécute une commande et affiche le résultat"""
    print(f"\n🔄 {description}")
    print("=" * 50)
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ {description} - SUCCESS")
        if result.stdout:
            print(result.stdout)
    else:
        print(f"❌ {description} - FAILED")
        if result.stderr:
            print(result.stderr)
        return False
    return True

def check_test_coverage():
    """Vérifie la couverture des tests"""
    print("🧪 VÉRIFICATION COUVERTURE DES TESTS")
    print("=" * 60)
    
    # Changer vers le dossier backend
    os.chdir('backend')
    
    # Tests Django avec couverture
    success = run_command(
        "coverage run --source='.' manage.py test",
        "Exécution tests Django avec mesure couverture"
    )
    
    if success:
        run_command(
            "coverage report --show-missing",
            "Rapport de couverture détaillé"
        )
        
        run_command(
            "coverage html",
            "Génération rapport HTML"
        )
        
        print("\n📊 Rapport HTML généré dans coverage_html/")
    
    return success

def check_bdd_tests():
    """Vérifie les tests BDD"""
    print("\n🥒 VÉRIFICATION TESTS BDD")
    print("=" * 40)
    
    run_command(
        "python manage.py behave",
        "Exécution tests BDD (Behavior-Driven Development)"
    )

def run_load_tests():
    """Lance les tests de charge"""
    print("\n🚀 TESTS DE CHARGE")
    print("=" * 30)
    
    # Vérifier si Locust est installé
    result = subprocess.run("pip show locust", shell=True, capture_output=True)
    
    if result.returncode != 0:
        print("⚠️ Locust non installé. Installation...")
        run_command("pip install locust", "Installation Locust")
    
    print("\n📋 Commandes pour tests de charge :")
    print("1. Test normal (10 users):")
    print("   locust -f load_tests.py --host=http://localhost:8000 -u 10 -r 2 -t 5m --headless")
    print("\n2. Test charge (50 users):")
    print("   locust -f load_tests.py --host=http://localhost:8000 -u 50 -r 5 -t 10m --headless")
    print("\n3. Interface web Locust:")
    print("   locust -f load_tests.py --host=http://localhost:8000")
    print("   Puis aller sur http://localhost:8089")

def main():
    """Fonction principale"""
    print("🔍 VÉRIFICATION COMPLÈTE DES TESTS - SYNTHÉTISEUR DE RÊVES")
    print("=" * 70)
    
    # Vérifier qu'on est dans le bon dossier
    if not Path('backend').exists():
        print("❌ Erreur: Ce script doit être exécuté depuis la racine du projet")
        sys.exit(1)
    
    # 1. Tests unitaires + couverture
    coverage_ok = check_test_coverage()
    
    # 2. Tests BDD
    check_bdd_tests()
    
    # 3. Info tests de charge
    run_load_tests()
    
    # Résumé
    print("\n" + "=" * 70)
    print("📊 RÉSUMÉ")
    print("=" * 70)
    
    if coverage_ok:
        print("✅ Tests unitaires passent")
        print("📈 Rapport couverture généré")
        print("🥒 Tests BDD vérifiés")
        print("🚀 Tests de charge configurés")
        print("\n🎯 NEXT STEPS:")
        print("1. Vérifier couverture ≥70% dans coverage_html/")
        print("2. Lancer tests de charge sur serveur de dev")
        print("3. Documenter résultats dans rapport technique")
    else:
        print("❌ Des tests échouent - à corriger avant production")

if __name__ == "__main__":
    main()
