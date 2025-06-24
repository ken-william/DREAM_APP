from django.contrib import admin
from .models import Friendship, Like, Comment, Notification

@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('user1', 'user2', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user1__username', 'user2__username')
    raw_id_fields = ('user1', 'user2') # Pour faciliter la sélection des utilisateurs

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'dream', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'dream__raw_prompt')
    raw_id_fields = ('user', 'dream')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'dream', 'content', 'created_at', 'parent_comment')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'dream__raw_prompt', 'content')
    raw_id_fields = ('user', 'dream', 'parent_comment')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'sender__username', 'content', 'dream__raw_prompt')
    raw_id_fields = ('recipient', 'sender', 'dream')
    actions = ['mark_as_read', 'mark_as_unread']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f"{queryset.count()} notifications marquées comme lues.")
    mark_as_read.short_description = "Marquer les notifications sélectionnées comme lues"

    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
        self.message_user(request, f"{queryset.count()} notifications marquées comme non lues.")
    mark_as_unread.short_description = "Marquer les notifications sélectionnées comme non lues"