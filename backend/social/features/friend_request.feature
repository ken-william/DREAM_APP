Feature: Friend requests management
  As an authenticated user
  I want to manage friend requests
  So that I can add, accept, reject, and remove friends

  Background:
    Given a user "alice" exists with password "Password123!"
    And a user "bob" exists with password "Password123!"
    And a user "charlie" exists with password "Password123!"
    And I am authenticated as "alice" with password "Password123!"

  # Sending friend requests

  Scenario: Send a friend request successfully
    When I send a friend request to "bob"
    Then the response status should be 201
    And the friend request response should be valid
    And the friend request "alice" -> "bob" should exist with status "pending"

  Scenario: Cannot send a friend request to myself
    When I send a friend request to "alice"
    Then the response status should be 400
    And the error should mention "Impossible de s'ajouter soi-même"

  Scenario: Cannot send a duplicate friend request if a pending one already exists in same direction
    Given a pending friend request exists from "alice" to "bob"
    When I send a friend request to "bob"
    Then the response status should be 400
    And the error should mention "Demande déjà existante."

  Scenario: Cannot send a duplicate friend request if a pending one exists in reverse direction
    Given I am authenticated as "bob" with password "Password123!"
    And a pending friend request exists from "alice" to "bob"
    When I send a friend request to "alice"
    Then the response status should be 400
    And the error should mention "Demande déjà existante."

  Scenario: Cannot send a friend request if an accepted link already exists
    Given an accepted friend request exists between "alice" and "bob"
    When I send a friend request to "bob"
    Then the response status should be 400
    And the error should mention "Demande déjà existante."

  Scenario: Can send a new request after a previous rejection
    Given a rejected friend request exists from "alice" to "bob"
    When I send a friend request to "bob"
    Then the response status should be 201
    And the friend request "alice" -> "bob" should exist with status "pending"

  # Viewing requests

  Scenario: Recipient can view pending friend requests
    Given I am authenticated as "bob" with password "Password123!"
    And a pending friend request exists from "alice" to "bob"
    When I GET "/api/social/requests/"
    Then the response status should be 200
    And the response should list a pending request from "alice" to "bob"

  # Responding to requests (accept/reject)

  Scenario: Recipient accepts a pending friend request
    Given a pending friend request exists from "alice" to "bob"
    And I am authenticated as "bob" with password "Password123!"
    When I respond "accept" to the pending friend request from "alice" to "bob"
    Then the response status should be 200
    And the friend request "alice" -> "bob" should exist with status "accepted"

  Scenario: Recipient rejects a pending friend request
    Given a pending friend request exists from "alice" to "bob"
    And I am authenticated as "bob" with password "Password123!"
    When I respond "reject" to the pending friend request from "alice" to "bob"
    Then the response status should be 200
    And the friend request "alice" -> "bob" should exist with status "rejected"

  Scenario: Only the recipient can respond to a pending friend request
    Given a pending friend request exists from "alice" to "bob"
    And I am authenticated as "alice" with password "Password123!"
    When I try to respond "accept" to the pending friend request from "alice" to "bob"
    Then the response status should be 404

  Scenario: Reject invalid action value
    Given a pending friend request exists from "alice" to "bob"
    And I am authenticated as "bob" with password "Password123!"
    When I respond "foobar" to the pending friend request from "alice" to "bob"
    Then the response status should be 400
    And the error should mention "Action invalide."

  Scenario: Cannot respond to a non-pending request (accepted)
    Given an accepted friend request exists between "alice" and "bob"
    And I am authenticated as "bob" with password "Password123!"
    When I try to respond "accept" to the accepted friend request from "alice" to "bob"
    Then the response status should be 404

  # Friends list and removal

  Scenario: Get friends after acceptance
    Given I am authenticated as "alice" with password "Password123!"
    And an accepted friend request exists between "alice" and "bob"
    When I GET "/api/social/friends/"
    Then the response status should be 200
    And the friends list should include "bob"
    And the friends list should not include "charlie"

  Scenario: Remove a friend deletes the accepted link
    Given an accepted friend request exists between "alice" and "bob"
    When I remove "bob" from my friends
    Then the response status should be 200
    And there should be no accepted friend request between "alice" and "bob"
