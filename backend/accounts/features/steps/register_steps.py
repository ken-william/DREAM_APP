from behave import given, when, then
from django.contrib.auth import get_user_model
from accounts.serializers import RegisterSerializer

User = get_user_model()


@given('a user already exists with email "{email}" and username "{username}" and password "{password}"')
def step_existing_user(context, email, username, password):
    # Crée un utilisateur de test si pas déjà présent
    if not User.objects.filter(email=email).exists():
        user = User(email=email, username=username)
        user.set_password(password)  # hash correctement
        user.save()
        context.existing_user = user
    else:
        context.existing_user = User.objects.get(email=email)


@when('I register with email "{email}", username "{username}", and password "{password}"')
def step_register_user(context, email, username, password):
    data = {
        "email": email,
        "username": username,
        "password": password,
    }
    serializer = RegisterSerializer(data=data)
    context.is_valid = serializer.is_valid()
    context.errors = serializer.errors
    if context.is_valid:
        context.user = serializer.save()
    else:
        context.user = None


@then('the registration should be accepted')
def step_register_success(context):
    assert context.is_valid is True, f"Expected success, got errors: {context.errors}"
    assert context.user is not None, "User object was not created"
    print(f"User correctly created: {context.user.email}")


@then('the registration should be rejected because of "{field}"')
def step_register_rejected_field(context, field):
    assert context.is_valid is False, f"Expected invalid but got valid. Errors: {context.errors}"
    # vérifie bien la cause précise
    assert field in context.errors, f"Expected error on '{field}', got: {context.errors}"
    # affiche exactement les erreurs du champ demandé
    print(f"Correctly rejected due to {field}: {context.errors[field]}")
