from behave import given, when, then
from django.contrib.auth import get_user_model
from accounts.serializers import UpdateProfileSerializer

User = get_user_model()


@given('an existing user wants to update his profile with email "{email}" and username "{username}"')
def step_given_update_user_exists(context, email, username):
    user, created = User.objects.get_or_create(email=email, defaults={"username": username})
    if not created and user.username != username:
        user.username = username
        user.save()
    context.user = user
    print(f"User ready for update: email={user.email}, username={user.username}")


@when('I update the profile for email "{email}" setting username to "{username}"')
def step_update_username(context, email, username):
    instance = User.objects.get(email=email)
    serializer = UpdateProfileSerializer(instance=instance, data={"username": username}, partial=True)
    context.update_is_valid = serializer.is_valid()
    context.update_errors = serializer.errors
    context.updated_user = serializer.save() if context.update_is_valid else None


@when('I clear the profile photo for email "{email}"')
def step_clear_photo(context, email):
    instance = User.objects.get(email=email)
    serializer = UpdateProfileSerializer(instance=instance, data={"photo_profil": None}, partial=True)
    context.update_is_valid = serializer.is_valid()
    context.update_errors = serializer.errors
    context.updated_user = serializer.save() if context.update_is_valid else None

    if context.update_is_valid:
        print(f"Profile photo cleared for user={email}")
    else:
        print(f"Clear photo rejected → errors={context.update_errors}")


@then('the profile update should be accepted')
def step_update_ok(context):
    assert context.update_is_valid is True, f"Expected valid update. Errors: {context.update_errors}"
    assert context.updated_user is not None, "Serializer valid but no user returned from save()."
    print(f"Profile update accepted for {context.updated_user.email}")


@then('the profile update should be rejected because of "{field_name}"')
def step_update_rejected_field(context, field_name):
    assert context.update_is_valid is False, "Expected invalid update but serializer was valid."
    assert field_name in context.update_errors, f"Expected error on '{field_name}', got {context.update_errors}"
    print(f"Profile update rejected (field={field_name}) → errors={context.update_errors}")


@then('the persisted user "{email}" should have username "{username}"')
def step_persisted_user_username(context, email, username):
    user = User.objects.get(email=email)
    assert user.username == username, f"Expected username={username}, got {user.username}"
    print(f"Username persisted correctly: {user.username}")


@then('the persisted user "{email}" should have null photo')
def step_persisted_user_photo_null(context, email):
    user = User.objects.get(email=email)
    assert getattr(user, "photo_profil") is None, f"Expected photo_profil=None, got {user.photo_profil}"
    print(f"Photo profile is null for {user.email}")
