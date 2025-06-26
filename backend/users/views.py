from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.contrib import messages
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def get_csrf_token(request):
    token = get_token(request)
    return Response({'csrfToken': token})
@api_view(['POST'])
def register_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"detail": "Champs requis"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Nom d'utilisateur déjà pris."}, status=400)

    user = User.objects.create_user(username=username, password=password)
    login(request, user)
    return Response({"detail": "Compte créé avec succès."})


@csrf_exempt
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"detail": "Champs requis"}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({"detail": "Connecté avec succès."})
    else:
        return Response({"detail": "Identifiants invalides."}, status=400)


@api_view(['POST'])
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Déconnexion réussie."})

@api_view(['GET'])
def whoami(request):
    if request.user.is_authenticated:
        return Response({"username": request.user.username})
    return Response({"username": None})

