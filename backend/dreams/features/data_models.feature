# dreams/features/data_models.feature
Feature: Modèles de données et persistance
    En tant que développeur
    Je veux que les modèles Django fonctionnent correctement
    Afin de garantir l'intégrité des données

    Background:
        Given un utilisateur "testuser" existe

    Scenario: Création d'un rêve basique
        When je crée un rêve avec les données :
            | transcription    | Je rêvais d'un jardin magnifique |
            | reformed_prompt  | beautiful garden with flowers    |
            | img_b64         | data:image/png;base64,test       |
            | privacy         | private                          |
        Then le rêve est sauvegardé en base
        And le rêve a un ID unique (dream_id)
        And le rêve a une date de création
        And le rêve appartient à l'utilisateur "testuser"

    Scenario: Rêve avec données émotionnelles complètes
        When je crée un rêve avec émotions :
            | transcription       | Je rêvais d'un jardin avec des fleurs |
            | reformed_prompt     | beautiful garden                      |
            | img_b64            | data:image/png;base64,test           |
            | privacy            | private                               |
            | emotion            | heureux                               |
            | emotion_confidence | 0.85                                  |
            | emotion_emoji      | 😊                                    |
            | emotion_color      | #10b981                               |
        Then toutes les données émotionnelles sont correctement sauvegardées

    Scenario: Validation des choix de privacy
        When je vérifie les choix de privacy disponibles
        Then les options suivantes sont disponibles :
            | public       |
            | private      |
            | friends_only |

    Scenario: Représentation string du modèle
        Given j'ai un rêve créé par l'utilisateur "testuser"
        When j'affiche la représentation string du rêve
        Then elle contient l'ID du rêve et le nom d'utilisateur

    Scenario: Valeurs par défaut du modèle
        When je crée un rêve avec les données minimales :
            | transcription   | Test minimal                  |
            | reformed_prompt | test                          |
            | img_b64        | data:image/png;base64,test   |
        Then la privacy par défaut est "private"
        And l'émotion peut être null
        And la confiance émotionnelle peut être null

    Scenario: Contraintes d'intégrité
        When je tente de créer un rêve sans utilisateur
        Then une erreur d'intégrité est levée
        When je tente de créer un rêve sans transcription
        Then une erreur de validation est levée
