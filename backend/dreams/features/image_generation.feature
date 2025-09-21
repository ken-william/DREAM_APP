# dreams/features/image_generation.feature
Feature: Génération d'images pour les rêves
    En tant qu'utilisateur
    Je veux que mes rêves soient transformés en images
    Afin de visualiser mes expériences oniriques

    Background:
        Given un utilisateur authentifié "testuser"

    Scenario: Génération d'image réussie avec Pollinations
        Given j'ai un prompt "jardin magnifique avec des fleurs colorées"
        When je génère une image avec l'API Pollinations
        Then je reçois une image en base64
        And l'image commence par "data:image/png;base64,"
        And la taille de l'image est supérieure à 1000 bytes

    Scenario: Fallback vers placeholder artistique
        Given j'ai un prompt "océan bleu mystérieux"
        And l'API Pollinations est indisponible
        When je génère une image
        Then je reçois un placeholder SVG artistique
        And l'image commence par "data:image/svg+xml;base64,"
        And le placeholder contient les couleurs océan (bleu)

    Scenario Outline: Sélection de couleurs par mots-clés
        Given j'ai un prompt contenant "<mot_cle>"
        When je génère un placeholder artistique
        Then le SVG contient la couleur "<couleur_attendue>"

        Examples:
        | mot_cle  | couleur_attendue |
        | forêt    | #56ab2f         |
        | océan    | #2196F3         |
        | feu      | #ff6b6b         |
        | nuit     | #2c3e50         |

    Scenario: Génération d'éléments spéciaux dans le placeholder
        Given j'ai un prompt "nuit étoilée avec la lune"
        When je génère un placeholder artistique
        Then le SVG contient un élément lune (circle)
        And le SVG contient un élément étoile (polygon)

    Scenario: Troncature des prompts longs
        Given j'ai un prompt très long de plus de 60 caractères
        When je génère un placeholder artistique
        Then le texte dans le SVG est tronqué
        And le SVG contient "..." pour indiquer la troncature

    Scenario: Gestion d'erreur API Pollinations
        Given j'ai un prompt valide
        And l'API Pollinations retourne une erreur 500
        When je génère une image
        Then le système utilise automatiquement le placeholder
        And aucune erreur n'est retournée à l'utilisateur
