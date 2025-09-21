# steps/reactions_steps.py
from __future__ import annotations

import json
from behave import given, then
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from dreams.models import Dream
from social.models import DreamLike

User = get_user_model()

# =========================
# Helpers (internes)
# =========================
def _get_client(context) -> APIClient:
    if not hasattr(context, "client"):
        context.client = APIClient()
    return context.client

def _force_auth_as(context, username: str, password: str = "Password123!"):
    """
    (Ré)authentifie le client en tant que `username`.
    Tente client.login(); fallback force_authenticate().
    """
    client = _get_client(context)
    user = User.objects.get(username=username)
    if not client.login(username=username, password=password):
        client.force_authenticate(user=user)

def _ensure_dream(owner_username: str, dream_id: int, privacy: str) -> Dream:
    """
    Crée ou met à jour un Dream minimal avec le privacy demandé.
    Suppositions sûres basées sur tes vues: champs existants = user, dream_id, privacy, transcription.
    """
    owner = User.objects.get(username=owner_username)
    defaults = {
        "user": owner,
        "privacy": privacy,                   # "public" | "friends_only" | "private"
        "transcription": f"Dream {dream_id}", # utile pour share_dream dans d'autres tests
    }
    dream, _ = Dream.objects.update_or_create(dream_id=dream_id, defaults=defaults)
    return dream


# =========================
# Given (setup des rêves et des états)
# =========================
@given('a public dream with dream_id {dream_id:d} exists by "{username}"')
def step_public_dream(context, dream_id, username):
    _ensure_dream(username, dream_id, "public")


@given('a friends-only dream with dream_id {dream_id:d} exists by "{username}"')
def step_friends_only_dream(context, dream_id, username):
    _ensure_dream(username, dream_id, "friends_only")


@given('a private dream with dream_id {dream_id:d} exists by "{username}"')
def step_private_dream(context, dream_id, username):
    _ensure_dream(username, dream_id, "private")


@given('"{username}" already likes dream "{dream_id}"')
def step_user_already_likes_dream(context, username, dream_id):
    dream = Dream.objects.get(dream_id=int(dream_id))
    user = User.objects.get(username=username)
    DreamLike.objects.get_or_create(user=user, dream=dream)


@given('"{username}" posted a comment "{content}" on dream "{dream_id}"')
def step_user_posted_comment(context, username, content, dream_id):
    """
    Crée un commentaire via l'API (auth -> POST), pour rester fidèle au flux réel.
    """
    _force_auth_as(context, username)
    client = _get_client(context)
    url = f"/api/social/dream/{int(dream_id)}/comment/"
    resp = client.post(url, data={"content": content}, format="json")
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}. Body: {getattr(resp, 'data', resp.content)}"


# =========================
# Then (assertions Likes)
# =========================
@then("the like response should be valid")
def step_like_response_valid(context):
    data = context.response.json()
    assert isinstance(data, dict), f"Expected dict, got: {type(data)}"
    assert "liked" in data and "total_likes" in data, f"Invalid like payload: {data}"
    assert isinstance(data["liked"], bool), f"'liked' should be boolean, got {type(data['liked'])}"
    assert isinstance(data["total_likes"], int), f"'total_likes' should be int, got {type(data['total_likes'])}"


@then('the like status should be {flag}')
def step_like_status_flag(context, flag):
    data = context.response.json()
    expected = flag.strip().lower()
    assert expected in ("true", "false"), f"flag must be true|false, got {flag}"
    actual = data.get("liked")
    assert isinstance(actual, bool), f"'liked' should be boolean, got {type(actual)}"
    assert (actual is True) == (expected == "true"), f"Expected liked={expected}, got {actual}"


@then("the total likes should be {n:d}")
def step_total_likes_is(context, n):
    data = context.response.json()
    assert data.get("total_likes") == n, f"Expected total_likes={n}, got {data.get('total_likes')}"


# =========================
# Then (assertions Comments)
# =========================
@then("the comment response should be valid")
def step_comment_response_valid(context):
    data = context.response.json()
    assert isinstance(data, dict), f"Expected dict, got: {type(data)}"
    for key in ("id", "user", "dream", "content", "created_at"):
        assert key in data, f"Missing '{key}' in comment payload: {data}"
    assert isinstance(data["user"], dict) and "username" in data["user"], f"Invalid user payload: {data['user']}"


@then('the comment content should be "{text}"')
def step_comment_content_is(context, text):
    data = context.response.json()
    assert data.get("content") == text, f"Expected content '{text}', got '{data.get('content')}'"


@then('the comment author should be "{username}"')
def step_comment_author_is(context, username):
    data = context.response.json()
    author = (data.get("user") or {}).get("username")
    assert author == username, f"Expected author '{username}', got '{author}'"


@then('the comments list should include a comment by "{username}" with content "{content}"')
def step_comments_list_includes(context, username, content):
    data = context.response.json()
    assert isinstance(data, list), f"Expected list, got: {type(data)}"
    found = any(
        (item.get("user") or {}).get("username") == username
        and item.get("content") == content
        for item in data
    )
    assert found, f"Comment by '{username}' with content '{content}' not found in: {data}"
