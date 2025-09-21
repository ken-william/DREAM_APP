# dreams/features/file_validation.feature
Feature: Validation et sécurité des fichiers audio
    En tant qu'administrateur système
    Je veux m'assurer que seuls les fichiers audio valides sont traités
    Afin de protéger l'application contre les attaques

    Background:
        Given un utilisateur authentifié "testuser"

    Scenario: Fichier audio trop volumineux
        Given j'ai un fichier audio trop volumineux "large.mp3" de 15MB
        When je tente de générer un rêve avec ce fichier
        Then je reçois une erreur "Fichier trop volumineux"
        And le fichier n'est pas traité

    Scenario: Format audio non supporté
        Given j'ai un fichier "document.txt"
        When je tente de générer un rêve avec ce fichier
        Then je reçois une erreur "Format audio non supporté"
        And la liste des formats autorisés est fournie

    Scenario: Fichier corrompu ou malformé
        Given j'ai un fichier audio corrompu "corrupted.mp3"
        When je tente de générer un rêve avec ce fichier
        Then je reçois une erreur "Fichier audio invalide"

    Scenario: Upload sans fichier
        When je tente de générer un rêve sans fichier audio
        Then je reçois une erreur "Fichier audio requis"

    Scenario Outline: Test de différentes tailles limites
        Given j'ai un fichier audio de <taille>MB
        When je tente de générer un rêve avec ce fichier
        Then <resultat>

        Examples:
        | taille | resultat                                    |
        | 5      | le fichier est accepté                     |
        | 9      | le fichier est accepté                     |
        | 10     | le fichier est accepté (limite exacte)    |
        | 11     | je reçois une erreur "Fichier trop volumineux" |
        | 20     | je reçois une erreur "Fichier trop volumineux" |

    Scenario: Tentative d'injection via nom de fichier
        Given j'ai un fichier audio avec le nom "../../../etc/passwd.mp3"
        When je tente de générer un rêve avec ce fichier
        Then le nom de fichier est assaini
        And le fichier est traité normalement
        And aucun accès système n'est tenté

    Scenario Outline: Formats audio supportés
        Given j'ai un fichier audio au format "<extension>"
        When je tente de générer un rêve avec ce fichier
        Then le fichier est accepté

        Examples:
        | extension |
        | .mp3     |
        | .wav     |
        | .m4a     |
        | .ogg     |
        | .webm    |
        | .flac    |
