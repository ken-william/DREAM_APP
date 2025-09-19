Feature: Direct messages
  As an authenticated user
  I want to send and read direct messages with my friends
  So that we can chat privately

  Background:
    Given a user "alice" exists with password "Password123!"
    And a user "bob" exists with password "Password123!"
    And a user "charlie" exists with password "Password123!"
    And I am authenticated as "alice" with password "Password123!"

  # -----------------------------
  # Sending messages
  # -----------------------------

  Scenario: Send a text message to a friend successfully
    Given an accepted friend request exists between "alice" and "bob"
    When I POST "/api/social/messages/send/bob/" with json:
      """
      {
        "message_type": "text",
        "content": "Hi Bob!"
      }
      """
    Then the response status should be 201
    And the message response should be valid
    And the message sender should be "alice"
    And the message receiver should be "bob"
    And the message content should be "Hi Bob!"
    And the message dream should be null

  Scenario: Cannot send a message to a non-friend
    When I POST "/api/social/messages/send/charlie/" with json:
      """
      {
        "message_type": "text",
        "content": "Hey!"
      }
      """
    Then the response status should be 403
    And the error should mention "Vous n'êtes pas amis."

  # -----------------------------
  # Reading a thread
  # -----------------------------

  Scenario: Read a thread between two friends
    Given an accepted friend request exists between "alice" and "bob"
    And "alice" has sent a message "Hello Bob" to "bob"
    And "bob" has sent a message "Hey Alice" to "alice"
    When I GET "/api/social/messages/bob/"
    Then the response status should be 200
    And the messages list should contain 2 items
    And the messages list should include a message from "alice" to "bob" with content "Hello Bob"
    And the messages list should include a message from "bob" to "alice" with content "Hey Alice"

  Scenario: Cannot read a thread with a non-friend
    When I GET "/api/social/messages/charlie/"
    Then the response status should be 403
    And the error should mention "Vous n'êtes pas amis."
