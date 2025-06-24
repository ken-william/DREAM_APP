from django.urls import path
from .views import (
    FriendRequestView, FriendRequestActionView, FriendsListView,
    LikeToggleView, DreamLikesListView,
    CommentListCreateView, CommentDetailView,
    NotificationListView, NotificationMarkAsReadView, NotificationMarkAllAsReadView,
    DreamFeedView
)

urlpatterns = [
    # Friendship Management
    path('friends/request/', FriendRequestView.as_view(), name='friend_request'),
    path('friends/request/action/', FriendRequestActionView.as_view(), name='friend_request_action'),
    path('friends/', FriendsListView.as_view(), name='friend_list'),

    # Likes
    path('dreams/<int:dream_id>/like/', LikeToggleView.as_view(), name='dream_like_toggle'),
    path('dreams/<int:dream_id>/likes/', DreamLikesListView.as_view(), name='dream_likes_list'),

    # Comments
    path('dreams/<int:dream_id>/comments/', CommentListCreateView.as_view(), name='dream_comments_list_create'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment_detail'),

    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', NotificationMarkAsReadView.as_view(), name='notification_mark_read'),
    path('notifications/read-all/', NotificationMarkAllAsReadView.as_view(), name='notification_mark_all_read'),

    # Dream Feed
    path('feed/', DreamFeedView.as_view(), name='dream_feed'),
]