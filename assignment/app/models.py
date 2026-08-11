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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone", "name"]
    objects = UserManager()

    def __str__(self):
        return self.email


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
