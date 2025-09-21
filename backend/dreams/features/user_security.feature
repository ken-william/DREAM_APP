# dreams/features/user_security.feature
Feature: Sécurité et isolation des utilisateurs
    En tant qu'utilisateur
    Je veux que mes rêves soient protégés des autres utilisateurs
    Afin de garantir ma confidentialité

    Background:
        Given un utilisateur authentifié "alice"
        And un autre utilisateur "bob" avec un rêve privé

    Scenario: Export interdit des rêves d'autrui
        When je tente d'exporter le rêve de bob
        Then je reçois une erreur 404 "Non trouvé"
        And bob ne peut pas voir que j'ai tenté d'accéder à son rêve

    Scenario: Modification interdite des rêves d'autrui
        When je tente de modifier la privacy du rêve de bob
        Then je reçois une erreur 404 "Non trouvé"
        And le rêve de bob n'est pas modifié

    Scenario: Isolation des listes de rêves
        Given bob a 3 rêves et alice a 2 rêves
        When alice demande sa liste de rêves
        Then alice voit seulement ses 2 rêves
        And bob voit seulement ses 3 rêves

    Scenario: Authentification requise
        Given je ne suis pas authentifié
        When je tente d'accéder aux APIs protégées
        Then je reçois une erreur 401 "Non autorisé"

    Scenario: Token invalide
        Given j'utilise un token d'authentification invalide
        When je tente d'accéder aux APIs
        Then je reçois une erreur 401 "Non autorisé"
