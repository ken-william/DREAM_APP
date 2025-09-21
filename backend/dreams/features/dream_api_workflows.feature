# dreams/features/dream_api_workflows.feature
Feature: Flux de travail des APIs de rêves
    En tant qu'utilisateur
    Je veux pouvoir créer et gérer mes rêves via l'API
    Afin de capturer mes expériences oniriques

    Background:
        Given un utilisateur authentifié "testuser"

    Scenario: Génération complète d'un rêve
        Given j'ai un fichier audio valide "test.mp3" de 2MB
        When je génère un rêve avec ce fichier audio via l'API
        Then je reçois une transcription
        And je reçois une interprétation IA en français
        And je reçois une image générée
        And je reçois une analyse émotionnelle
        And je peux sauvegarder le rêve en "private"

    Scenario: Sauvegarde d'un rêve généré
        Given j'ai généré un rêve en mode preview
        When je sauvegarde le rêve avec privacy "public"
        Then le rêve est persisté en base
        And je reçois l'ID du rêve
        And la privacy est correctement définie

    Scenario: Liste des rêves utilisateur
        Given j'ai plusieurs rêves sauvegardés
        When je demande la liste de mes rêves
        Then je reçois tous mes rêves
        And les statistiques sont correctes
        And les rêves sont triés par date

    Scenario: Échec de génération avec fichier invalide
        Given j'ai un fichier audio invalide
        When je tente de générer un rêve
        Then je reçois une erreur de validation
        And aucun rêve n'est créé
