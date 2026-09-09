from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings


class UserManager(BaseUserManager):

    def create_user(self, email, phone, name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            phone=phone,
            name=name,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone, name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(
            email=email,
            phone=phone,
            name=name,
            password=password,
            **extra_fields,
        )


class PostPermission(models.Model):
    VIEW = "view"
    UPDATE = "update"
    DELETE = "delete"

    CODE_CHOICES = [
        (VIEW, "Can view post list"),
        (UPDATE, "Can update any post"),
        (DELETE, "Can delete any post"),
    ]

    code = models.CharField(max_length=20, unique=True, choices=CODE_CHOICES)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["id"]
        verbose_name = "Post permission"
        verbose_name_plural = "Post permissions"

    def __str__(self):
        return self.name

    @classmethod
    def user_has(cls, user, action: str) -> bool:
        if not user or not getattr(user, "is_authenticated", False):
            return False
        if user.is_staff or user.is_superuser:
            return True
        return user.post_permissions.filter(code=action).exists()


class User(AbstractUser):
    # Email-based auth — no username column
    username = None

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True,
    )

    is_verified = models.BooleanField(default=False)
    post_permissions = models.ManyToManyField(
        PostPermission,
        blank=True,
        related_name="users",
        verbose_name="Permissions",
        help_text="Select permissions for this user with the arrows.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone", "name"]
    objects = UserManager()

    def __str__(self):
        return self.email


class UserPostPermission(User):
    """Proxy so admin lists user emails for assigning permissions."""

    class Meta:
        proxy = True
        verbose_name = "User permission"
        verbose_name_plural = "User permissions"


class OTP(models.Model):
    DELIVERY_CHOICES = [
        ("email", "Email"),
        ("whatsapp", "WhatsApp"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="otps",
    )

    code = models.CharField(max_length=6)

    delivery_method = models.CharField(
        max_length=10,
        choices=DELIVERY_CHOICES,
    )

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    attempts = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} - {self.code}"
