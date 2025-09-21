# TESTS DE CHARGE - SYNTHÉTISEUR DE RÊVES
# Configuration Locust pour tester la montée en charge

from locust import HttpUser, task, between
import json
import base64
import random

class DreamUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Setup utilisateur : login et récupération token"""
        # Créer un utilisateur de test ou utiliser existant
        self.login()
    
    def login(self):
        """Authentification utilisateur"""
        response = self.client.post("/api/account/login/", json={
            "username": f"user_{random.randint(1, 100)}",
            "password": "testpass123"
        })
        if response.status_code == 200:
            self.token = response.json().get('token')
            self.client.headers.update({'Authorization': f'Token {self.token}'})
        else:
            # Créer utilisateur si n'existe pas
            self.register()
    
    def register(self):
        """Création utilisateur de test"""
        username = f"loadtest_{random.randint(1000, 9999)}"
        response = self.client.post("/api/account/register/", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "testpass123"
        })
        if response.status_code == 201:
            self.token = response.json().get('token')
            self.client.headers.update({'Authorization': f'Token {self.token}'})
    
    @task(3)
    def view_public_feed(self):
        """Test charge : consultation feed public"""
        self.client.get("/api/dreams/feed/public")
    
    @task(2)
    def view_profile(self):
        """Test charge : consultation profil"""
        self.client.get("/api/account/profile/")
    
    @task(1)
    def create_dream_text(self):
        """Test charge : création rêve (sans audio)"""
        dream_data = {
            "transcription": f"Rêve de test {random.randint(1, 1000)}",
            "reformed_prompt": "Test dream prompt",
            "privacy": random.choice(["public", "private", "friends_only"])
        }
        self.client.post("/api/dreams/save", json=dream_data)
    
    @task(1)
    def social_actions(self):
        """Test charge : actions sociales"""
        # Rechercher utilisateurs
        self.client.get("/api/social/search/?q=test")
        
        # Voir demandes d'amis
        self.client.get("/api/social/requests/")

class HighLoadDreamUser(HttpUser):
    """Test de charge intensive - génération d'images"""
    wait_time = between(5, 10)  # Plus long pour APIs IA
    
    def on_start(self):
        self.login()
    
    def login(self):
        # Même logique que DreamUser
        pass
    
    @task(1)
    def generate_dream_with_ai(self):
        """Test charge : génération complète avec IA"""
        # Simuler upload audio (fichier factice)
        fake_audio = self.create_fake_audio()
        
        response = self.client.post("/api/dreams/create", 
            files={'audio': fake_audio},
            headers={'Authorization': f'Token {self.token}'}
        )
        
        # Mesurer temps de réponse IA
        if response.status_code != 200:
            print(f"Erreur génération IA: {response.status_code}")
    
    def create_fake_audio(self):
        """Créer fichier audio factice pour test"""
        # Créer un fichier WAV minimal valide
        fake_wav_data = b'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        return ('test.wav', fake_wav_data, 'audio/wav')

# Configuration des scénarios de charge
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
    
    # Scénario 3: Test limite (nombre de rêves simultanés)
    STRESS_TEST = {
        'users': 100,
        'spawn_rate': 10,
        'duration': '15m'
    }

# Configuration pour lancement
if __name__ == "__main__":
    # Commandes pour lancer les tests :
    # 
    # Test normal :
    # locust -f load_tests.py --host=http://localhost:8000 -u 10 -r 2 -t 5m
    #
    # Test charge :
    # locust -f load_tests.py --host=http://localhost:8000 -u 50 -r 5 -t 10m
    #
    # Test stress :
    # locust -f load_tests.py --host=http://localhost:8000 -u 100 -r 10 -t 15m
    
    print("🚀 Tests de charge configurés")
    print("📊 Scénarios disponibles: normal, peak, stress")
    print("🎯 Objectif: Valider 'nombre de rêves simultanés'")
