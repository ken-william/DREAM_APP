# dreams/features/api_serializers.feature
Feature: Sérialisation des données API
    En tant que développeur API
    Je veux que les serializers formatent correctement les données
    Afin d'assurer une API cohérente

    Background:
        Given un utilisateur "testuser" avec un rêve complet

    Scenario: UserSerializer avec champs essentiels
        When je sérialise l'utilisateur
        Then les champs suivants sont présents :
            | id       |
            | username |
            | email    |
        And le username est "testuser"
        And l'email est correct

    Scenario: DreamSerializer complet
        Given un rêve avec toutes les données (transcription, émotion, image)
        When je sérialise le rêve avec DreamSerializer
        Then tous les champs suivants sont présents :
            | dream_id           |
            | user               |
            | transcription      |
            | reformed_prompt    |
            | img_b64           |
            | date              |
            | privacy           |
            | emotion           |
            | emotion_confidence |
            | emotion_emoji     |
            | emotion_color     |
        And le champ "user" contient les données utilisateur imbriquées

    Scenario: DreamListSerializer optimisé
        Given un rêve avec une image volumineuse
        When je sérialise le rêve avec DreamListSerializer
        Then le champ "img_b64" n'est pas inclus (optimisation)
        And le champ "has_image" est présent et vrai
        And les autres champs essentiels sont présents

    Scenario: Serialization avec données manquantes
        Given un rêve sans émotion définie
        When je sérialise le rêve avec DreamSerializer
        Then les champs émotion sont null :
            | emotion           | null |
            | emotion_confidence | null |
            | emotion_emoji     | null |
        And les autres champs sont correctement sérialisés

    Scenario: DreamListSerializer pour rêve sans image
        Given un rêve sans image (img_b64 vide)
        When je sérialise le rêve avec DreamListSerializer
        Then le champ "has_image" est faux
        And la transcription est correctement incluse

    Scenario: Sérialisation des relations utilisateur
        Given un rêve lié à un utilisateur
        When je sérialise le rêve
        Then le champ "user" contient :
            | id       | ID numérique de l'utilisateur |
            | username | Nom d'utilisateur            |
            | email    | Email de l'utilisateur        |
        And aucune donnée sensible n'est exposée (mot de passe, etc.)
