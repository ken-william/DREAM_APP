# dreams/features/emotion_analysis.feature
Feature: Analyse émotionnelle des rêves
    En tant qu'utilisateur
    Je veux comprendre l'émotion de mes rêves
    Afin de suivre mon état psychologique

    Background:
        Given un utilisateur authentifié "testuser"

    Scenario Outline: Détection des différentes émotions
        Given j'ai une transcription "<transcription>"
        When l'analyse émotionnelle est effectuée
        Then l'émotion détectée est "<emotion>"
        And l'emoji associé est "<emoji>"
        And la couleur associée est "<couleur>"
        And la confiance est supérieure à 0

        Examples:
        | transcription                                              | emotion     | emoji | couleur  |
        | Je rêvais d'un jardin magnifique plein de joie et bonheur | heureux     | 😊    | #10b981  |
        | Un rêve terrible plein de tristesse et de mélancolie      | triste      | 😢    | #6366f1  |
        | Cauchemar terrifiant avec stress et angoisse              | stressant   | 😰    | #f59e0b  |
        | Une aventure incroyable pleine d'action et d'énergie      | excitant    | 🤩    | #ef4444  |
        | Rêve étrange et mystérieux avec des événements bizarres   | mystérieux  | 🔮    | #8b5cf6  |
        | Un rêve normal et ordinaire, très calme                   | neutre      | 😐    | #6b7280  |

    Scenario: Analyse avec transcription vide
        Given j'ai une transcription vide ""
        When l'analyse émotionnelle est effectuée
        Then l'émotion détectée est "neutre"
        And la confiance est 0.5
        And la méthode utilisée est "default"

    Scenario: Détection d'émotions mixtes
        Given j'ai une transcription "Un rêve avec de la joie et du bonheur, mais aussi un peu de tristesse"
        When l'analyse émotionnelle est effectuée
        Then l'émotion dominante "heureux" est détectée
        And la liste des mots-clés trouvés contient "joie" et "bonheur"
        And la confiance reflète la proportion de mots-clés positifs

    Scenario: Validation de la structure des émotions
        When je vérifie la configuration des émotions
        Then chaque émotion a des "keywords" non vides
        And chaque émotion a un "emoji" valide
        And chaque émotion a une "color" au format hexadécimal
        And toutes les émotions requises sont présentes : heureux, triste, stressant, neutre, excitant, mystérieux

    Scenario: Détection par mots-clés avec variations
        Given j'ai une transcription "Je pleurais de joie dans ce rêve merveilleux"
        When l'analyse émotionnelle est effectuée
        Then l'émotion "heureux" est détectée malgré la présence de "pleurais"
        And la méthode utilisée est "keywords"
        And les mots-clés trouvés incluent "joie" et "merveilleux"

    Scenario: Gestion des mots-clés avec accents et casse
        Given j'ai une transcription "RÊVE PLEIN DE JOIE ET D'ÉMOTION"
        When l'analyse émotionnelle est effectuée
        Then l'analyse fonctionne correctement malgré les majuscules
        And l'émotion "heureux" est détectée
