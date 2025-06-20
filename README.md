# DREAM_APP
Plongez au cœur de votre subconscient. Laissez parlerz vos rêves


# 🌙 Synthétiseur de Rêves : Explorez Votre Monde Onirique avec l'IA

## Qu'est-ce que le Synthétiseur de Rêves ?

Le "Synthétiseur de Rêves" est une application web innovante conçue pour transformer votre expérience onirique en une aventure interactive et visuelle. Que vous soyez fasciné par vos rêves ou simplement curieux de ce qu'ils révèlent, cette application utilise la puissance de l'intelligence artificielle pour vous aider à capturer, analyser et visualiser les paysages de votre subconscient.

Grâce à une interface conviviale, vous pouvez facilement enregistrer ou transcrire vos rêves. L'IA prend ensuite le relais pour décoder les émotions, générer des images uniques inspirées de vos récits, et même vous permettre de dialoguer pour une exploration plus profonde de votre monde intérieur.

## ✨ Fonctionnalités Clés

* **Capture de Rêve Flexible :**
    * **Enregistrement Vocal :** Dictez vos rêves directement via le microphone.
    * **Téléchargement Audio :** Importez des fichiers audio existants (.wav, .mp3).
    * **Saisie Manuelle :** Écrivez votre rêve directement dans l'interface.
* **Transcription Audio Avancée :** Convertit vos enregistrements vocaux en texte précis grâce au modèle Whisper de Groq.
* **Visualisation Onirique Unique :** Génère une image numérique artistique et personnalisée basée sur la description textuelle de votre rêve, propulsée par l'IA de Mistral.
* **Analyse Émotionnelle Détaillée :** Décode les émotions dominantes de votre rêve (joie, stress, tristesse, colère, peur) et les présente sous forme de pourcentages clairs.
* **Exploration Interactive avec l'IA :** Dialogue en temps réel avec un agent intelligent pour poser des questions sur votre rêve, interpréter des symboles et obtenir des éclaircissements.
* **Historique des Rêves :** Accédez facilement à tous vos rêves passés pour une relecture et une exploration continues.

## Démarrage Rapide : Guide d'Installation

Suivez ces étapes pour configurer et lancer le Synthétiseur de Rêves sur votre machine locale.

### 1. Prérequis Indispensables

Avant de commencer, assurez-vous d'avoir :

* **Python :** Version 3.9 ou supérieure recommandée. Vous pouvez le télécharger depuis [python.org](https://www.python.org/downloads/).
* **Accès à Internet :** Nécessaire pour télécharger les dépendances et pour les communications avec les API de Mistral AI et Groq.
* **Clés API :**
    * Une clé API **Mistral AI** : Obtenez-la en vous inscrivant sur [Mistral AI Platform](https://console.mistral.ai/api-keys/).
    * Une clé API **Groq** : Obtenez-la en vous inscrivant sur [GroqCloud](https://console.groq.com/keys).

### 2. Téléchargement du Projet

* Si le projet est sur GitHub, clonez le dépôt :
    ```bash
    git clone <URL_DU_VOTRE_DEPOT_GITHUB>
    cd dream_synthesizer_app # Ou le nom de votre dossier de projet
    ```
    (Remplacez `<URL_DU_VOTRE_DEPOT_GITHUB>` par l'URL réelle de votre dépôt.)
* Si vous avez les fichiers localement, assurez-vous que tous les fichiers du projet (`app.py`, `backend.py`, etc.) se trouvent dans un même dossier. Naviguez dans ce dossier via votre terminal.

### 3. Configuration de l'Environnement Python

Il est fortement recommandé d'utiliser un environnement virtuel pour isoler les dépendances de votre projet.

1.  **Créez un environnement virtuel :**
    ```bash
    python -m venv venv
    ```

2.  **Activez l'environnement virtuel :**
    * **Sur macOS / Linux :**
        ```bash
        source venv/bin/activate
        ```
    * **Sur Windows (invite de commande) :**
        ```bash
        .\venv\Scripts\activate
        ```
    * **Sur Windows (PowerShell) :**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
    Votre invite de commande devrait maintenant afficher `(venv)` au début.

### 4. Installation des Dépendances

Une fois votre environnement virtuel activé, installez toutes les bibliothèques requises en utilisant `pip` et le fichier `requirements.txt` (que vous pouvez créer avec le contenu que je vous ai donné précédemment) :

```bash
pip install -r requirements.txt
```
Si vous n'avez pas créé le fichier `requirements.txt`, vous pouvez installer les paquets un par un :
```bash
pip install streamlit python-dotenv mistralai groq streamlit-mic-recorder matplotlib bcrypt passlib
```

### 5. Configuration des Clés API (Très Important !)

Pour que l'application puisse communiquer avec les services d'IA, vous devez fournir vos clés API :

1.  À la **racine de votre dossier de projet** (au même niveau que `app.py` et `backend.py`), créez un nouveau fichier nommé : `.env`
2.  Ouvrez ce fichier `.env` avec un éditeur de texte et ajoutez-y les lignes suivantes, en remplaçant les valeurs par vos vraies clés API :
    ```
    GROQ_API_KEY="votre_cle_api_groq_ici"
    MISTRAL_API_KEY="votre_cle_api_mistral_ici"
    ```
    **Attention :** Ne partagez jamais votre fichier `.env` ni vos clés API !

## ▶️ Lancement de l'Application

Une fois que toutes les étapes d'installation et de configuration sont complétées, et que les corrections de code sont appliquées, vous pouvez lancer l'application Streamlit :

1.  Assurez-vous que votre environnement virtuel est toujours activé.
2.  Dans votre terminal, naviguez vers le dossier où se trouve `app.py`.
3.  Exécutez la commande suivante :
    ```bash
    streamlit run app.py
    ```

L'application s'ouvrira automatiquement dans votre navigateur web, généralement à l'adresse `http://localhost:8501`.

## Comment Utiliser l'Application ?

1.  **Capturez Votre Rêve :** Sur la page d'accueil, utilisez la section "Enregistrement vocal" ou "Télécharger un fichier audio" pour capturer votre rêve. Si vous préférez, vous pouvez aussi le taper directement.
2.  **Analysez Votre Rêve :** Cliquez sur le bouton "Analyser mon Rêve". L'application transcrira votre audio (si applicable), générera une image et affichera une analyse émotionnelle.
3.  **Discutez de Votre Rêve :** Utilisez la section de chat pour poser des questions à l'IA sur votre rêve, interpréter des éléments ou explorer des thèmes plus en profondeur.
4.  **Explorez l'Historique :** Accédez à la section "Historique des Rêves" pour revoir et revisiter vos rêves précédents.

## Dépannage (Troubleshooting)

Si vous rencontrez des problèmes, voici quelques pistes pour les résoudre :

* **`NameError: name 'Mistral' is not defined` :**
    * Assurez-vous d'avoir exécuté `pip install mistralai` dans votre environnement virtuel activé.
    * Vérifiez que votre environnement virtuel est bien activé avant de lancer `streamlit run app.py`.
* **Erreurs de communication avec Mistral (Statut 429, Erreurs de validation de rôle) :**
    * **Statut 429 ("Too Many Requests" / "Capacity Exceeded") :** Cela signifie que vous avez atteint les limites de débit de l'API. Attendez quelques minutes et réessayez. Si cela persiste, vérifiez votre consommation sur la console Mistral AI.
    * **Erreur de validation de rôle (`Input tag 'ai' found...`):** C'est une erreur de code. Assurez-vous que tous les champs `role` dans les messages envoyés à l'API Mistral sont bien `'system'`, `'user'`, `'assistant'` ou `'tool'`, et non `'ai'`.
* **`NameError: name 'json' is not defined` :**
    * Comme indiqué dans la section "Corrections de Code Essentielles", assurez-vous d'avoir ajouté `import json` en haut de votre fichier `backend.py`.
* **Problèmes Généraux :**
    * Vérifiez que vos clés API dans le fichier `.env` sont correctes et ne contiennent pas d'espaces superflus.
    * Assurez-vous d'être connecté à Internet.
    * Redémarrez l'application Streamlit.

---
N'hésitez pas à poser d'autres questions si vous rencontrez des difficultés !
```