# dreams/features/privacy_settings.feature
Feature: Gestion de la confidentialité des rêves
    En tant qu'utilisateur
    Je veux contrôler qui peut voir mes rêves
    Afin de protéger ma vie privée

    Background:
        Given un utilisateur authentifié "testuser"
        And j'ai un rêve privé avec ID 1

    Scenario: Mise à jour privacy vers public
        When je change sa confidentialité en "public"
        Then le rêve devient public
        And la modification est persistée en base
        And je reçois une confirmation

    Scenario: Mise à jour privacy vers friends_only
        When je change sa confidentialité en "friends_only"
        Then le rêve devient visible aux amis seulement
        And la modification est persistée

    Scenario Outline: Validation des valeurs de privacy
        When je tente de changer la privacy en "<privacy>"
        Then <resultat>

        Examples:
        | privacy      | resultat                                    |
        | public       | la modification réussit                     |
        | private      | la modification réussit                     |
        | friends_only | la modification réussit                     |
        | invalid      | je reçois une erreur "Privacy invalide"    |

    Scenario: Modification privacy rêve inexistant
        When je tente de modifier la privacy du rêve ID 99999
        Then je reçois une erreur 404 "Rêve introuvable"

    Scenario: Sauvegarde initiale avec privacy
        Given je génère un nouveau rêve
        When je le sauvegarde avec privacy "friends_only"
        Then le rêve est créé avec la bonne privacy
        And la privacy par défaut n'est pas appliquée
