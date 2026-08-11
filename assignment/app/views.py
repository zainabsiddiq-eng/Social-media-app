import rest_framework
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from smtplib import SMTPException
import random
from django.contrib.auth.hashers import check_password
from .serializer import (
    VerifyOTPSerializer,
    ResendOTPSerializer,
    LoginSerializer,
    EditUserSerializer,
    user_seralizer,
)
from .models import User, OTP
from .services import send_email_otp
from .whatsapp import send_whatsapp_otp
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import GenericAPIView
from rest_framework.generics import UpdateAPIView

def get_latest_otp(user):
    return OTP.objects.filter(user=user).order_by("-created_at").first()


def format_wait_time(seconds):
    seconds = max(seconds, 0)
    minutes = (seconds + 59) // 60
    if minutes <= 1:
        return "1 minute"
    return f"{minutes} minutes"


def create_and_send_otp(user, delivery_method):
    otp = str(random.randint(100000, 999999))

    OTP.objects.create(
        user=user,
        code=otp,
        delivery_method=delivery_method,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

    if delivery_method == "email":
        send_email_otp(user.email, otp)
    elif delivery_method == "whatsapp":
        send_whatsapp_otp(user.phone, otp)

    return otp


def otp_still_valid_response(latest_otp):
    remaining = int((latest_otp.expires_at - timezone.now()).total_seconds())
    return Response(
        {
            "error": (
                f"OTP already sent. Please wait {format_wait_time(remaining)}."
            )
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


class Register(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = user_seralizer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        phone = serializer.validated_data["phone"]
        delivery_method = serializer.validated_data["delivery_method"]

        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            if existing_user.is_verified:
                return Response(
                    {"error": "Email is already registered."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            latest_otp = get_latest_otp(existing_user)
            if latest_otp and latest_otp.expires_at > timezone.now():
                return otp_still_valid_response(latest_otp)

            try:
                with transaction.atomic():
                    create_and_send_otp(existing_user, delivery_method)
            except (SMTPException, OSError) as exc:
                return Response(
                    {"error": f"Failed to send OTP email: {exc}"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            return Response(
                {"message": "OTP sent successfully."},
                status=status.HTTP_200_OK,
            )

        if User.objects.filter(phone=phone).exists():
            return Response(
                {"error": "Phone number already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = serializer.save()
                create_and_send_otp(user, delivery_method)
        except (SMTPException, OSError) as exc:
            return Response(
                {"error": f"Failed to send OTP email: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"message": "Registration successful. OTP sent."},
            status=status.HTTP_201_CREATED,
        )


from django.db import transaction
from smtplib import SMTPException

class EditUser(GenericAPIView):
    serializer_class = EditUserSerializer
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        user = User.objects.filter(email=data["email"]).first()

        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_verified:
            return Response(
                {"error": "User is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "name" in data:
            user.name = data["name"]

        if "phone" in data:
            phone = data["phone"]

            if User.objects.filter(phone=phone).exclude(pk=user.pk).exists():
                return Response(
                    {"error": "Phone number already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.phone = phone

        if "password" in data:
            user.set_password(data["password"])

        delivery_method = data.get("delivery_method", "email")

        try:
            with transaction.atomic():

                user.save()

                # Delete old OTP
                OTP.objects.filter(user=user).delete()

                # Generate & Send new OTP
                create_and_send_otp(user, delivery_method)

        except (SMTPException, OSError) as exc:
            return Response(
                {
                    "error": f"Failed to send OTP: {exc}"
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "message": "Details updated successfully. OTP sent."
            },
            status=status.HTTP_200_OK,
        )

class ResendOTP(GenericAPIView):
    serializer_class = ResendOTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        delivery_method = serializer.validated_data.get(
            "delivery_method", "email"
        )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_verified:
            return Response(
                {"error": "User is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latest_otp = get_latest_otp(user)
        if latest_otp and latest_otp.expires_at > timezone.now():
            return otp_still_valid_response(latest_otp)

        try:
            with transaction.atomic():
                create_and_send_otp(user, delivery_method)
        except (SMTPException, OSError) as exc:
            return Response(
                {"error": f"Failed to send OTP email: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"message": "OTP sent successfully."},
            status=status.HTTP_200_OK,
        )
class Verify(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp_code = request.data.get("otp")

        if not email or not otp_code:
            return Response(
                {"error": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_verified:
            return Response(
                {"error": "User is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latest_otp = get_latest_otp(user)
        if not latest_otp or latest_otp.expires_at < timezone.now():
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if latest_otp.code != otp_code:
            latest_otp.attempts += 1
            latest_otp.save()
            return Response(
                {"error": "Invalid OTP. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_verified = True
        user.save()

        return Response(
            {"message": "User verified successfully."},
            status=status.HTTP_200_OK,
        )
class VerifyOTP(GenericAPIView):
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        if User.objects.filter(email=email, is_verified=True).exists():
            return Response(
                {"error": "User is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Verify OTP logic here
        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        otp_obj = OTP.objects.filter(user=user).order_by("-created_at").first()
        if not otp_obj:
            return Response(
                {"error": "No OTP found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if otp_obj.code != otp:
            otp_obj.attempts += 1
            otp_obj.save()

            return Response(
                {"error": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if timezone.now() > otp_obj.expires_at:
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if user:
            if otp_obj.code==otp:
                user.is_verified = True
                user.save()
                otp_obj.is_verified = True
                otp_obj.save()

        if user.is_verified:
            redirect_url = "http://localhost:3000/login"


        return Response(
            {"message": "Account verified successfully.", "redirect_url": redirect_url},
            status=status.HTTP_200_OK,
        )
class Login(GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(email=email).first()
        

        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_verified:
            return Response(
                {"error": "Account is not verified. Please verify OTP first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        check_password=user.check_password(password)
        if check_password != True:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
       

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "phone": user.phone,
                },
            },
            status=status.HTTP_200_OK,
        )

