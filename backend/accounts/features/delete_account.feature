Feature: Delete account
  As a registered user
  I want to confirm my account deletion
  So that my account can be safely removed

  Scenario: Delete account is accepted when confirm is true
    When I request account deletion with confirm "true"
    Then the deletion request should be valid

  Scenario: Delete account is accepted when confirm is false
    When I request account deletion with confirm "false"
    Then the deletion request should be valid

  Scenario: Delete account is rejected when confirm is missing
    When I request account deletion without confirm
    Then the deletion request should be invalid because of "confirm"
