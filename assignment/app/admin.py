from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import OTP, User, UserPostPermission


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "name",
        "phone",
        "is_verified",
        "is_staff",
        "is_active",
    )
    list_filter = ("is_verified", "is_staff", "is_superuser", "is_active")
    search_fields = ("email", "name", "phone")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "phone", "bio", "profile_picture")}),
        (
            "Status",
            {"fields": ("is_verified", "is_active", "is_staff", "is_superuser")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "phone", "password1", "password2"),
            },
        ),
    )


@admin.register(UserPostPermission)
class UserPostPermissionAdmin(admin.ModelAdmin):
    ordering = ("email",)
    list_display = ("email", "name", "assigned_permissions")
    list_display_links = ("email",)
    search_fields = ("email", "name")
    filter_horizontal = ("post_permissions",)
    fields = ("email", "post_permissions")
    readonly_fields = ("email",)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Assigned permissions")
    def assigned_permissions(self, obj):
        names = list(obj.post_permissions.values_list("name", flat=True))
        return ", ".join(names) if names else "—"

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("post_permissions")


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("user", "code", "delivery_method", "is_verified", "expires_at")
    list_filter = ("delivery_method", "is_verified")
    search_fields = ("user__email", "code")
