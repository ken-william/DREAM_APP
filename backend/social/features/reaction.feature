Feature: Reactions on dreams (likes & comments)
  As an authenticated user
  I want to like and comment on dreams
  So that I can react to my own and my friends' dreams

  Background:
    Given a user "alice" exists with password "Password123!"
    And a user "bob" exists with password "Password123!"
    And a user "charlie" exists with password "Password123!"
    And I am authenticated as "alice" with password "Password123!"

  Scenario: Like a public dream from another user
    Given a public dream with dream_id 200 exists by "bob"
    When I POST "/api/social/dream/200/like/" with json:
      """
      {}
      """
    Then the response status should be 200
    And the like response should be valid
    And the like status should be true
    And the total likes should be 1

  Scenario: Toggle unlike removes my like
    Given a public dream with dream_id 201 exists by "bob"
    And "alice" already likes dream "201"
    When I POST "/api/social/dream/201/like/" with json:
      """
      {}
      """
    Then the response status should be 200
    And the like status should be false
    And the total likes should be 0

  Scenario: Like my own public dream
    Given a public dream with dream_id 202 exists by "alice"
    When I POST "/api/social/dream/202/like/" with json:
      """
      {}
      """
    Then the response status should be 200
    And the like status should be true
    And the total likes should be 1

  Scenario: Cannot like a private dream that is not mine
    Given a private dream with dream_id 300 exists by "bob"
    When I POST "/api/social/dream/300/like/" with json:
      """
      {}
      """
    Then the response status should be 403
    And the error should mention "Ce rêve est privé."

  Scenario: Cannot like a friends-only dream if we are not friends
    Given a friends-only dream with dream_id 400 exists by "bob"
    When I POST "/api/social/dream/400/like/" with json:
      """
      {}
      """
    Then the response status should be 403
    And the error should mention "Ce rêve n'est visible que par les amis du créateur."

  Scenario: Can like a friends-only dream if we are friends
    Given an accepted friend request exists between "alice" and "bob"
    And a friends-only dream with dream_id 401 exists by "bob"
    When I POST "/api/social/dream/401/like/" with json:
      """
      {}
      """
    Then the response status should be 200
    And the like status should be true
    And the total likes should be 1

  Scenario: Add a comment on a public dream
    Given a public dream with dream_id 500 exists by "bob"
    When I POST "/api/social/dream/500/comment/" with json:
      """
      {
        "content": "Nice dream!"
      }
      """
    Then the response status should be 201
    And the comment response should be valid
    And the comment content should be "Nice dream!"
    And the comment author should be "alice"

  Scenario: List comments of a dream
    Given a public dream with dream_id 501 exists by "bob"
    And "alice" posted a comment "Cool!" on dream "501"
    When I GET "/api/social/dream/501/comments/"
    Then the response status should be 200
    And the comments list should include a comment by "alice" with content "Cool!"

  Scenario: Cannot comment on a private dream that is not mine
    Given a private dream with dream_id 600 exists by "bob"
    When I POST "/api/social/dream/600/comment/" with json:
      """
      {
        "content": "Hey!"
      }
      """
    Then the response status should be 403
    And the error should mention "Ce rêve est privé."

  Scenario: Cannot comment on a friends-only dream if we are not friends
    Given a friends-only dream with dream_id 700 exists by "bob"
    When I POST "/api/social/dream/700/comment/" with json:
      """
      {
        "content": "👀"
      }
      """
    Then the response status should be 403
    And the error should mention "Ce rêve n'est visible que par les amis du créateur."

  Scenario: Can comment on a friends-only dream if we are friends
    Given an accepted friend request exists between "alice" and "bob"
    And a friends-only dream with dream_id 701 exists by "bob"
    When I POST "/api/social/dream/701/comment/" with json:
      """
      {
        "content": "So vivid!"
      }
      """
    Then the response status should be 201
    And the comment response should be valid
    And the comment content should be "So vivid!"
    And the comment author should be "alice"
