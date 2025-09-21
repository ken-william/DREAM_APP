# steps/messages_steps.py
from __future__ import annotations

import json
from behave import given, when, then
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

# =========================
# Helpers (internes au fichier)
# =========================
def _get_client(context) -> APIClient:
    if not hasattr(context, "client"):
        context.client = APIClient()
    return context.client

def _force_auth_as(context, username: str):
    """
    Authentifie le client en tant que `username` sans dépendre d'un endpoint /login.
    Utilise d'abord client.login(); si ça échoue, force_authenticate().
    """
    client = _get_client(context)
    user = User.objects.get(username=username)
    # Essai session
    if not client.login(username=username, password="Password123!"):
        client.force_authenticate(user=user)

def _post_json(context, url: str, payload: dict):
    client = _get_client(context)
    return client.post(url, data=payload, format="json")

# =========================
# When
# =========================
@when('I POST "{url}" with json:')
def step_post_with_json(context, url):
    payload = {}
    if context.text:
        payload = json.loads(context.text)
    client = _get_client(context)
    context.response = client.post(url, data=payload, format="json")

# Steps utilitaires pour préparer des messages dans la BDD via l’API
@given('"{sender}" has sent a message "{content}" to "{receiver}"')
def step_sender_sent_message_to_receiver(context, sender, content, receiver):
    # On s'auth en tant que sender puis on POST sur l'endpoint d'envoi
    _force_auth_as(context, sender)
    url = f"/api/social/messages/send/{receiver}/"
    resp = _post_json(context, url, {
        "message_type": "text",
        "content": content
    })
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}. Body: {getattr(resp, 'data', resp.content)}"

# =========================
# Then (validations)
# =========================
@then("the message response should be valid")
def step_message_response_valid(context):
    data = context.response.json()
    assert isinstance(data, dict), f"Expected dict, got: {type(data)}"
    # Champs attendus par MessageSerializer
    for key in ("id", "sender", "receiver", "content", "dream", "timestamp"):
        assert key in data, f"Missing '{key}' in message payload: {data}"
    # Sous-objets attendus
    assert isinstance(data["sender"], dict) and "username" in data["sender"], f"Invalid sender: {data.get('sender')}"
    assert isinstance(data["receiver"], dict) and "username" in data["receiver"], f"Invalid receiver: {data.get('receiver')}"

@then('the message sender should be "{username}"')
def step_message_sender_is(context, username):
    data = context.response.json()
    sender_name = data["sender"]["username"]
    assert sender_name == username, f"Expected sender '{username}', got '{sender_name}'"

@then('the message receiver should be "{username}"')
def step_message_receiver_is(context, username):
    data = context.response.json()
    receiver_name = data["receiver"]["username"]
    assert receiver_name == username, f"Expected receiver '{username}', got '{receiver_name}'"

@then('the message content should be "{text}"')
def step_message_content_is(context, text):
    data = context.response.json()
    assert data["content"] == text, f"Expected content '{text}', got '{data['content']}'"

@then("the message dream should be null")
def step_message_dream_null(context):
    data = context.response.json()
    assert data["dream"] in (None, "null"), f"Expected dream null, got {data['dream']}"

@then("the messages list should contain {n:d} items")
def step_messages_list_count(context, n):
    data = context.response.json()
    assert isinstance(data, list), f"Expected list, got: {type(data)}"
    assert len(data) == n, f"Expected {n} items, got {len(data)}"

@then('the messages list should include a message from "{sender}" to "{receiver}" with content "{content}"')
def step_messages_list_includes(context, sender, receiver, content):
    data = context.response.json()
    assert isinstance(data, list), f"Expected list, got: {type(data)}"
    found = any(
        (m.get("sender") or {}).get("username") == sender
        and (m.get("receiver") or {}).get("username") == receiver
        and m.get("content") == content
        for m in data
    )
    assert found, f"Message {sender}->{receiver} '{content}' not found in {data}"
