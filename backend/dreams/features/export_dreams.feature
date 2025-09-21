# dreams/features/export_dreams.feature
Feature: Export des rêves en format HTML
    En tant qu'utilisateur
    Je veux exporter mes rêves en HTML
    Afin de les sauvegarder hors de l'application

    Background:
        Given un utilisateur authentifié "testuser"
        And j'ai un rêve complet sauvegardé avec ID 1

    Scenario: Export HTML basique
        When je demande l'export du rêve ID 1
        Then je reçois un fichier HTML
        And le fichier contient la transcription complète
        And le fichier contient l'image générée
        And le fichier contient l'interprétation IA

    Scenario: Contenu de l'export vérifié
        When j'exporte le rêve
        Then le HTML contient le titre "🌙 Mon Rêve"
        And le HTML contient la section "🎙️ Mon récit"
        And le HTML contient la section "✨ Interprétation IA"
        And le HTML contient la section "🎨 Visualisation"

    Scenario: Export avec données émotionnelles
        Given mon rêve a une analyse émotionnelle "heureux 😊"
        When j'exporte le rêve
        Then le HTML affiche l'émotion détectée
        And les couleurs correspondent à l'émotion

    Scenario: Export via API
        When je fais une requête GET sur "/api/dreams/1/export"
        Then je reçois un statut 200
        And le Content-Type est "text/html; charset=utf-8"
        And le fichier est proposé en téléchargement

    Scenario: Export rêve inexistant
        When je tente d'exporter le rêve ID 99999
        Then je reçois une erreur 404
        And le message indique "Rêve introuvable"

    Scenario: Export sans authentification
        Given je ne suis pas authentifié
        When je tente d'exporter un rêve
        Then je reçois une erreur 401 "Non autorisé"
