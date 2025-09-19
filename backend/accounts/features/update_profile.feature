Feature: Update user profile
  In order to maintain my profile
  As an authenticated user
  I want to update my username and profile photo

  Background:
    Given an existing user wants to update his profile with email "kim@example.com" and username "kim"

  Scenario: Successfully update username
    When I update the profile for email "kim@example.com" setting username to "kimi"
    Then the profile update should be accepted
    And the persisted user "kim@example.com" should have username "kimi"

  Scenario: Reject update with duplicate username
    Given an existing user wants to update his profile with email "taken@example.com" and username "taken"
    When I update the profile for email "kim@example.com" setting username to "taken"
    Then the profile update should be rejected because of "username"

  Scenario: Clear profile photo
    When I clear the profile photo for email "kim@example.com"
    Then the profile update should be accepted
    And the persisted user "kim@example.com" should have null photo
