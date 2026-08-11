import requests
from django.conf import settings

def send_whatsapp_otp(phone, otp):
    headers = {
        "X-App-Key": settings.MESSAGE_SERVICE_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "phone_number": phone,
        "message": f"Your verification code is {otp}",
    }
    print(payload)

    response = requests.post(
        settings.MESSAGE_SERVICE_URL,
        headers=headers,
        json=payload,
    )

    print(response.status_code)
    print(response.text)

    return response