from rest_framework import serializers
from .models import User, OTP
from django.contrib.auth.hashers import make_password

class user_seralizer(serializers.ModelSerializer):
    delivery_method = serializers.ChoiceField(choices=OTP.DELIVERY_CHOICES)

    class Meta:
        model = User
        fields = [
            "name",
            "email",
            "phone",
            "password",
            "delivery_method",
        ]
        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }

    def create(self, validated_data):

        if User.objects.filter(email=validated_data["email"]).exists():
            raise serializers.ValidationError(
                {"email": "Email is already registered."}
            )

        if User.objects.filter(phone=validated_data["phone"]).exists():
            raise serializers.ValidationError(
                {"phone": "Phone number already exists."}
            )

        delivery_method = validated_data.pop("delivery_method")
        validated_data["password"] = make_password(
            validated_data["password"]
        )

        return User.objects.create(**validated_data)
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    delivery_method = serializers.ChoiceField(
        choices=OTP.DELIVERY_CHOICES,
        default="email",
        required=False,
    )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class EditUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(required=False, max_length=100)
    phone = serializers.CharField(required=False, max_length=20)
    password = serializers.CharField(required=False, write_only=True)
    delivery_method = serializers.ChoiceField(
        choices=OTP.DELIVERY_CHOICES,
        required=False,
        default="email",
    )

