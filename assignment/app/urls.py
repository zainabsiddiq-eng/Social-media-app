from django.urls import path
from .views import Register, ResendOTP, VerifyOTP, Login, EditUser

urlpatterns = [
    path("register/", Register.as_view(), name="register"),
    path("resend-otp/", ResendOTP.as_view(), name="resend-otp"),
    path("verify-otp/", VerifyOTP.as_view(), name="verify-otp"),
    path("login/", Login.as_view(), name="login"),
    path("edit-user/", EditUser.as_view(), name="edit-user"),
]
