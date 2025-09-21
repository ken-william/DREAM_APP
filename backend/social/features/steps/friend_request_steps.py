# steps/friend_request_steps.py
from __future__ import annotations

import json
from typing import Optional

from behave import given, when, then
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework.test import APIClient

from social.models import FriendRequest

User = get_user_model()

# =========================
# Helpers
# =========================
def get_client(context) -> APIClient:
    if not hasattr(context, "client"):
        context.client = APIClient()
    return context.client


def _unique_email_for(username: str, suffix: Optional[str] = None) -> str:
    if suffix:
        return f"{username}+{suffix}@test.local"
    return f"{username}@test.local"


def _ensure_user(username: str, password: str, email: Optional[str] = None) -> User:
    """
    Create or reset a user with a unique email (for CustomUser with unique email).
    If the user already exists, reset password and ensure a unique email.
    """
    if not email:
        email = _unique_email_for(username)

    try:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_active": True},
        )
        # ensure unique email if necessary
        if not user.email or user.email != email:
            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                email = _unique_email_for(username, str(user.pk or "1"))
            user.email = email

        user.is_active = True
        user.set_password(password)
        user.save()
        return user
    except IntegrityError:
        user, _ = User.objects.update_or_create(
            username=username,
            defaults={"email": _unique_email_for(username, "fix"), "is_active": True},
        )
        user.set_password(password)
        user.save()
        return user


def authenticate(context, username: str, password: str):
    """
    Authenticate using Django session login; if that fails, force-authenticate (DRF).
    Avoids relying on a /login API route.
    """
    client = get_client(context)
    user = User.objects.get(username=username)

    # Try session login first
    ok = client.login(username=username, password=password)
    if not ok:
        # Fall back to DRF force_authenticate (bypasses auth backends)
        client.force_authenticate(user=user)


# =========================
# Given
# =========================
@given('a user "{username}" exists with password "{password}"')
def step_create_user(context, username, password):
    _ensure_user(username, password)


@given('I am authenticated as "{username}" with password "{password}"')
def step_auth_as(context, username, password):
    _ensure_user(username, password)
    authenticate(context, username, password)


@given('a pending friend request exists from "{from_user}" to "{to_user}"')
def step_pending_fr(context, from_user, to_user):
    f = User.objects.get(username=from_user)
    t = User.objects.get(username=to_user)
    FriendRequest.objects.create(from_user=f, to_user=t, status="pending")


@given('an accepted friend request exists between "{u1}" and "{u2}"')
def step_accepted_fr(context, u1, u2):
    f = User.objects.get(username=u1)
    t = User.objects.get(username=u2)
    FriendRequest.objects.create(from_user=f, to_user=t, status="accepted")


@given('a rejected friend request exists from "{from_user}" to "{to_user}"')
def step_rejected_fr(context, from_user, to_user):
    f = User.objects.get(username=from_user)
    t = User.objects.get(username=to_user)
    FriendRequest.objects.create(from_user=f, to_user=t, status="rejected")


# =========================
# When
# =========================
@when('I send a friend request to "{username}"')
def step_send_fr(context, username):
    client = get_client(context)
    context.response = client.post(f"/api/social/friend-request/{username}/")


@when('I GET "{url}"')
def step_get(context, url):
    client = get_client(context)
    context.response = client.get(url)


@when('I respond "{action}" to the pending friend request from "{from_user}" to "{to_user}"')
def step_respond_pending(context, action, from_user, to_user):
    fr = FriendRequest.objects.get(
        from_user__username=from_user,
        to_user__username=to_user,
        status="pending",
    )
    client = get_client(context)
    context.response = client.post(f"/api/social/respond/{fr.id}/{action}/")


@when('I try to respond "{action}" to the pending friend request from "{from_user}" to "{to_user}"')
def step_try_respond_pending(context, action, from_user, to_user):
    fr = FriendRequest.objects.filter(
        from_user__username=from_user, to_user__username=to_user
    ).first()
    client = get_client(context)
    if fr:
        context.response = client.post(f"/api/social/respond/{fr.id}/{action}/")
    else:
        # bogus id to trigger 404 consistently
        context.response = client.post(f"/api/social/respond/999999/{action}/")


@when('I try to respond "{action}" to the accepted friend request from "{from_user}" to "{to_user}"')
def step_try_respond_accepted(context, action, from_user, to_user):
    fr = FriendRequest.objects.get(
        from_user__username=from_user,
        to_user__username=to_user,
        status="accepted",
    )
    client = get_client(context)
    context.response = client.post(f"/api/social/respond/{fr.id}/{action}/")


@when('I remove "{username}" from my friends')
def step_remove_friend(context, username):
    client = get_client(context)
    context.response = client.post(f"/api/social/remove-friend/{username}/")


# =========================
# Then
# =========================
@then('the response status should be {status:d}')
def step_response_status(context, status):
    assert context.response is not None, "No response captured"
    actual = context.response.status_code
    body = getattr(context.response, "data", None)
    if body is None:
        try:
            body = context.response.json()
        except Exception:
            body = context.response.content
    assert actual == status, f"Expected {status}, got {actual}. Body: {body}"


@then("the friend request response should be valid")
def step_fr_response_valid(context):
    data = context.response.json()
    assert isinstance(data, dict), f"Expected dict, got: {type(data)}"
    for key in ("id", "status", "from_user", "to_user"):
        assert key in data, f"Missing '{key}' in payload: {data}"


@then('the friend request "{from_user}" -> "{to_user}" should exist with status "{status}"')
def step_fr_exists_with_status(context, from_user, to_user, status):
    f = User.objects.get(username=from_user)
    t = User.objects.get(username=to_user)
    fr = FriendRequest.objects.filter(from_user=f, to_user=t).first()
    assert fr is not None, f"FriendRequest {from_user}->{to_user} not found"
    assert fr.status == status, f"Expected {status}, got {fr.status}"


@then('the response should list a pending request from "{from_user}" to "{to_user}"')
def step_list_contains_pending(context, from_user, to_user):
    data = context.response.json()
    assert isinstance(data, list), f"Expected list, got {type(data)}: {data}"

    found = any(
        (item.get("from_user") or {}).get("username") == from_user
        and (item.get("to_user") or {}).get("username") == to_user
        and item.get("status") == "pending"
        for item in data
    )
    assert found, f"Pending request {from_user}->{to_user} not in response: {data}"


@then('the error should mention "{msg}"')
def step_error_mentions(context, msg):
    # Try JSON first
    try:
        payload = context.response.json()
    except Exception:
        payload = context.response.content.decode("utf-8", errors="ignore")

    def flatten(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                yield from flatten(v)
        elif isinstance(obj, list):
            for x in obj:
                yield from flatten(x)
        else:
            yield str(obj)

    if isinstance(payload, (dict, list)):
        # Keep real Unicode (avoid \uXXXX escapes)
        haystack = " ".join(list(flatten(payload)))
    else:
        haystack = str(payload)

    assert msg in haystack, f"Expected error containing '{msg}', got: {haystack}"


@then('the friends list should include "{username}"')
def step_friends_include(context, username):
    data = context.response.json()
    assert isinstance(data, list), f"Expected list for friends, got: {type(data)}"
    usernames = [u.get("username") for u in data]
    assert username in usernames, f"{username} not in friends list {usernames}"


@then('the friends list should not include "{username}"')
def step_friends_not_include(context, username):
    data = context.response.json()
    assert isinstance(data, list), f"Expected list for friends, got: {type(data)}"
    usernames = [u.get("username") for u in data]
    assert username not in usernames, f"{username} unexpectedly in friends list {usernames}"


@then('there should be no accepted friend request between "{u1}" and "{u2}"')
def step_no_accepted_link(context, u1, u2):
    f = User.objects.get(username=u1)
    t = User.objects.get(username=u2)
    exists = (
        FriendRequest.objects.filter(from_user=f, to_user=t, status="accepted").exists()
        or FriendRequest.objects.filter(from_user=t, to_user=f, status="accepted").exists()
    )
    assert not exists, f"Accepted friend request still exists between {u1} and {u2}"
