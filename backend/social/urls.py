from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.social_search, name='social_search'),
    path('add/<str:username>/', views.send_friend_request, name='send_friend_request'),  # Alias pour compatibilité
    path('friend-request/<str:username>/', views.send_friend_request, name='send_friend_request'),
    path('friends/', views.get_friends, name='get_friends'),
    path('requests/', views.view_requests, name='view_requests'),
    path('requests/sent/', views.view_sent_requests, name='view_sent_requests'),  # 🆕 Nouvelle route
    path('respond/<int:request_id>/<str:action>/', views.respond_to_request, name='respond_request'),
    path('remove-friend/<str:username>/', views.remove_friend, name='remove_friend'),
    path('messages/<str:username>/', views.get_messages, name='get_messages'),
    path('messages/send/<str:username>/', views.send_message, name='send_message'),
    
    # 🆕 Partage de rêves
    path('share-dream/<str:username>/', views.share_dream, name='share_dream'),
    
    # 🆕 Likes et commentaires
    path('dream/<int:dream_id>/like/', views.toggle_dream_like, name='toggle_dream_like'),
    path('dream/<int:dream_id>/comment/', views.add_dream_comment, name='add_dream_comment'),
    path('dream/<int:dream_id>/comments/', views.get_dream_comments, name='get_dream_comments'),
]

