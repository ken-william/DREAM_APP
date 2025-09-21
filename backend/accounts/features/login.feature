Feature: User login
  In order to access my account
  As a registered user
  I want to log in with my email and password

  Scenario: Successful login with valid credentials
    Given a user exists with email "john@example.com" and password "secret123"
    When I try to log in with email "john@example.com" and password "secret123"
    Then the login should be accepted

  Scenario: Failed login with wrong password
    Given a user exists with email "john@example.com" and password "secret123"
    When I try to log in with email "john@example.com" and password "wrongpass"
    Then the login should be rejected

  Scenario: Failed login with non-existent email
    When I try to log in with email "nobody@example.com" and password "secret123"
    Then the login should be rejected
