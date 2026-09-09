from rest_framework.permissions import BasePermission

from app.models import PostPermission


class _PostActionPermission(BasePermission):
    action = None
    message = "You do not have permission for this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return PostPermission.user_has(user, self.action)


class CanViewPostList(_PostActionPermission):
    action = PostPermission.VIEW
    message = "You do not have permission to view posts. Ask an admin to grant access."


class CanUpdateAnyPost(BasePermission):
    """Owner can update own post; granted users / staff can update any post."""

    message = "You do not have permission to update this post."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if obj.user_id == user.id:
            return True
        return PostPermission.user_has(user, PostPermission.UPDATE)


class CanDeleteAnyPost(BasePermission):
    """Owner can delete own post; granted users / staff can delete any post."""

    message = "You do not have permission to delete this post."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if obj.user_id == user.id:
            return True
        return PostPermission.user_has(user, PostPermission.DELETE)


# Keep old name so existing imports don't break
IsAllowedEmail = CanViewPostList
