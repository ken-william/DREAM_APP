Feature: User registration
  In order to use the platform
  As a new user
  I want to register with email, username and password

  Scenario: Successful registration with valid data
    When I register with email "alice@example.com", username "alice", and password "supersecret"
    Then the registration should be accepted

  Scenario: Failed registration with short password
    When I register with email "bob@example.com", username "bobby", and password "short"
    Then the registration should be rejected because of "password"

  Scenario: Failed registration with duplicate email
    Given a user already exists with email "charlie@example.com" and username "charlie" and password "supersecret"
    When I register with email "charlie@example.com", username "othercharlie", and password "supersecret"
    Then the registration should be rejected because of "email"

  Scenario: Failed registration with duplicate username
    Given a user already exists with email "dave@example.com" and username "dave" and password "supersecret"
    When I register with email "otherdave@example.com", username "dave", and password "supersecret"
    Then the registration should be rejected because of "username"
