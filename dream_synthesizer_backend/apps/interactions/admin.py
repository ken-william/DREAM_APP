# apps/interactions/admin.py
from django.contrib import admin
from .models import Friendship, Like, Comment, Notification

@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('user1', 'user2', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('user1__username', 'user2__username')
    raw_id_fields = ('user1', 'user2')

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'dream', 'created_at')
    search_fields = ('user__username', 'dream__raw_prompt')
    raw_id_fields = ('user', 'dream')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'dream', 'content', 'created_at')
    search_fields = ('user__username', 'dream__raw_prompt', 'content')
    raw_id_fields = ('user', 'dream')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('recipient__username', 'sender__username', 'content')
    raw_id_fields = ('recipient', 'sender', 'related_dream', 'related_friendship')
