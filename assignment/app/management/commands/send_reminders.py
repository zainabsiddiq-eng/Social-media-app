from django.core.management.base import BaseCommand
from django.utils import timezone

from app.models import OTP


class Command(BaseCommand):

    help = "Delete expired OTPs"

    def handle(self, *args, **kwargs):

        expired_otps = OTP.objects.filter(
            expires_at__lt=timezone.now()
        )

        count = expired_otps.count()

        expired_otps.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"{count} expired OTPs deleted successfully."
            )
        )