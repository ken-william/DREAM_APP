Feature: Change user password
  In order to secure my account
  As an authenticated user
  I want to change my password with a valid new one

  Background:
    Given a user exists with email "alice@example.com" and username "alice" and password "oldpass123"

  Scenario: Successfully change password
    When I change the password for "alice@example.com" providing old password "oldpass123" and new password "newpass456"
    Then the password change should be accepted
    And the user "alice@example.com" can authenticate with password "newpass456"

  Scenario: Reject change with wrong old password
    When I change the password for "alice@example.com" providing old password "WRONGPASS" and new password "newpass456"
    Then the password change should be rejected

  Scenario: Reject change with too short new password
    When I change the password for "alice@example.com" providing old password "oldpass123" and new password "short"
    Then the password change should be rejected
