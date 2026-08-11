from django.conf import settings
from django.core.mail import send_mail


def send_email_otp(email, otp):
    send_mail(
        subject="Your OTP Verification Code",
        message=f"Your OTP code is: {otp}\n\nThis code will expire in 5 minutes.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=f"""
            <h2>Email Verification</h2>
            <p>Your OTP code is:</p>
            <h1>{otp}</h1>
            <p>This code will expire in 5 minutes.</p>
        """,
        fail_silently=False,
    )
