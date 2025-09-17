from behave import given, when, then
from django.contrib.auth import get_user_model
from accounts.serializers import LoginSerializer

User = get_user_model()

@given('a user exists with email "{email}" and password "{password}"')
def step_create_user(context, email, password):
    # Support both default User (USERNAME_FIELD="username") and custom (USERNAME_FIELD="email")
    username_field = getattr(User, "USERNAME_FIELD", "username")
    if username_field == "email":
        # Custom user model with email as login field
        User.objects.update_or_create(email=email, defaults={})
        u = User.objects.get(email=email)
        u.set_password(password)
        u.save()
    else:
        # Default Django user model: username required
        # Use email as username (or strip local-part if tu préfères)
        User.objects.update_or_create(
            username=email,
            defaults={"email": email}
        )
        u = User.objects.get(username=email)
        u.set_password(password)
        u.save()

@when('I try to log in with email "{email}" and password "{password}"')
def step_attempt_login(context, email, password):
    serializer = LoginSerializer(data={"email": email, "password": password})
    context.is_valid = serializer.is_valid()
    context.errors = serializer.errors

@then('the login should be accepted')
def step_login_success(context):
    assert context.is_valid is True, f"Expected success, got errors: {context.errors}"
    print("Login correctly accepted")

@then('the login should be rejected')
def step_login_failed(context):
    assert context.is_valid is False, "Expected rejection, but serializer is valid"
    print("Login correctly rejected:", context.errors)

