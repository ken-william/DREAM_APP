from django.urls import path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from . import views

urlpatterns = [
    path('csrf/', views.csrf_view, name='csrf'),  # ✅ Une seule version, propre
    path('search/', views.social_search, name='social_search'),
    path('friend-request/<str:username>/', views.send_friend_request, name='send_friend_request'),
    path('friends/', views.get_friends, name='get_friends'),
    path('requests/', views.view_requests, name='view_requests'),
    path('respond/<int:request_id>/<str:response>/', views.respond_to_request, name='respond_request'),
]

