from behave import when, then
from accounts.serializers import DeleteAccountSerializer


@when('I request account deletion with confirm "{value}"')
def step_request_deletion_with_confirm(context, value):
    # Convert string "true"/"false" en bool
    confirm_value = value.lower() == "true"
    serializer = DeleteAccountSerializer(data={"confirm": confirm_value})
    context.is_valid = serializer.is_valid()
    context.errors = serializer.errors

    if context.is_valid:
        print(f"Deletion request accepted with confirm={confirm_value}")
    else:
        print(f"Deletion request rejected with errors: {context.errors}")


@when('I request account deletion without confirm')
def step_request_deletion_without_confirm(context):
    serializer = DeleteAccountSerializer(data={})
    context.is_valid = serializer.is_valid()
    context.errors = serializer.errors

    if context.is_valid:
        print("Unexpectedly accepted deletion request without confirm")
    else:
        print(f"Correctly rejected deletion request without confirm. Errors: {context.errors}")


@then('the deletion request should be valid')
def step_assert_deletion_valid(context):
    assert context.is_valid is True, f"Expected valid, but got errors: {context.errors}"
    print("Assertion passed: deletion request is valid")


@then('the deletion request should be invalid because of "{field}"')
def step_assert_deletion_invalid_field(context, field):
    assert context.is_valid is False, f"Expected invalid, but got valid."
    assert field in context.errors, f"Expected error on '{field}', got: {context.errors}"
    print(f"Correctly rejected due to {field}: {context.errors[field]}")
