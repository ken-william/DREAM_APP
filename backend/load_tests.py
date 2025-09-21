# TESTS DE CHARGE - SYNTHÉTISEUR DE RÊVES
# Configuration Locust pour tester la montée en charge

from locust import HttpUser, task, between
import json
import base64
import random

class DreamUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Setup utilisateur : création et authentification"""
        self.token = None
        self.register_and_login()
    
    def register_and_login(self):
        """Création et authentification utilisateur"""
        username = f"loadtest_{random.randint(1000, 9999)}"
        email = f"{username}@test.com"
        password = "testpass123"
        
        # Créer utilisateur
        register_data = {
            "username": username,
            "email": email,
            "password": password
        }
        
        response = self.client.post("/api/account/register/", json=register_data)
        
        if response.status_code in [200, 201]:
            # Registration réussie, essayer de récupérer le token
            data = response.json()
            if 'token' in data:
                self.token = data['token']
                self.client.headers.update({'Authorization': f'Token {self.token}'})
                return
        
        # Si pas de token dans register, essayer login
        login_data = {
            "username": username,
            "password": password
        }
        
        response = self.client.post("/api/account/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if 'token' in data:
                self.token = data['token']
                self.client.headers.update({'Authorization': f'Token {self.token}'})
    
    @task(3)
    def view_public_feed(self):
        """Test charge : consultation feed public"""
        self.client.get("/api/dreams/feed/public")
    
    @task(2)
    def view_profile(self):
        """Test charge : consultation profil"""
        if self.token:
            self.client.get("/api/account/profile/")
    
    @task(1)
    def create_dream_text(self):
        """Test charge : création rêve (sans audio)"""
        if self.token:
            # Créer une image base64 factice minimale (pixel transparent)
            fake_img_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
            dream_data = {
                "transcription": f"Rêve de test {random.randint(1, 1000)}",
                "reformed_prompt": "Test dream prompt",
                "img_b64": fake_img_b64,  # CHAMP REQUIS
                "privacy": random.choice(["public", "private", "friends_only"])
            }
            self.client.post("/api/dreams/save", json=dream_data)
    
    @task(1)
    def social_actions(self):
        """Test charge : actions sociales"""
        if self.token:
            # Rechercher utilisateurs
            self.client.get("/api/social/search/?q=test")
            
            # Voir demandes d'amis
            self.client.get("/api/social/requests/")

# Simplification : Une seule classe pour les tests
class LoadTestScenarios:
    """Scénarios de test selon cahier des charges"""
    
    # Scénario 1: Usage normal
    NORMAL_LOAD = {
        'users': 10,
        'spawn_rate': 2,
        'duration': '5m'
    }
    
    # Scénario 2: Pic d'utilisation 
    PEAK_LOAD = {
        'users': 50,
        'spawn_rate': 5, 
        'duration': '10m'
    }
    
    # Scénario 3: Test limite
    STRESS_TEST = {
        'users': 100,
        'spawn_rate': 10,
        'duration': '15m'
    }

# Configuration pour lancement
if __name__ == "__main__":
    print("🚀 Tests de charge configurés")
    print("📊 Scénarios disponibles: normal, peak, stress")
    print("🎯 Objectif: Valider performance application")
