from behave import given, when, then
from django.contrib.auth import get_user_model, authenticate
from accounts.serializers import ChangePasswordSerializer

User = get_user_model()


@given('a user exists with email "{email}" and username "{username}" and password "{password}"')
def step_given_user_exists(context, email, username, password):
    user, created = User.objects.get_or_create(email=email, defaults={"username": username})
    user.set_password(password)
    user.save()
    context.user = user
    print(f"User ready: {email} / password={password}")


@when('I change the password for "{email}" providing old password "{old_password}" and new password "{new_password}"')
def step_when_change_password(context, email, old_password, new_password):
    user = User.objects.get(email=email)
    data = {"old_password": old_password, "new_password": new_password}
    serializer = ChangePasswordSerializer(data=data)

    context.is_valid = serializer.is_valid()
    context.errors = serializer.errors

    if context.is_valid and user.check_password(old_password):
        user.set_password(new_password)
        user.save()
        context.password_changed = True
        print(f"Password updated for {email}")
    else:
        context.password_changed = False
        print(f"Password change rejected for {email} → errors={context.errors}")


@then('the password change should be accepted')
def step_then_password_change_ok(context):
    assert context.is_valid is True, f"Expected serializer valid. Errors: {context.errors}"
    assert context.password_changed is True, "Expected password change but it was rejected."
    print("Password change accepted")


@then('the password change should be rejected')
def step_then_password_change_rejected(context):
    assert context.password_changed is False, "Expected password change rejection but it succeeded."
    print("Password change correctly rejected")


@then('the user "{email}" can authenticate with password "{password}"')
def step_then_authenticate_user(context, email, password):
    user = authenticate(email=email, password=password)
    assert user is not None, f"Authentication failed with {email}/{password}"
    print(f"Authentication works for {email} with new password")
