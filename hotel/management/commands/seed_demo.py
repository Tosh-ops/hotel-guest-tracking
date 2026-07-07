from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from hotel.models import Room

User = get_user_model()


class Command(BaseCommand):
    help = "Creates demo users (one per role) and a handful of rooms for the class demo."

    def handle(self, *args, **options):
        demo_users = [
            ("reception1", "receptionist", "Asha", "Mwangi"),
            ("housekeeping1", "housekeeping", "Brian", "Otieno"),
            ("manager1", "manager", "Grace", "Wanjiru"),
        ]

        for username, role, first, last in demo_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "role": role,
                    "first_name": first,
                    "last_name": last,
                },
            )
            if created:
                user.set_password("demo1234")
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user '{username}' ({role})"))
            else:
                self.stdout.write(f"User '{username}' already exists, skipping")

        demo_rooms = [
            ("101", "Single", 2500, "available"),
            ("102", "Single", 2500, "occupied"),
            ("103", "Double", 4000, "cleaning"),
            ("104", "Double", 4000, "available"),
            ("201", "Suite", 8000, "maintenance"),
            ("202", "Suite", 8000, "available"),
        ]

        for number, rtype, price, status in demo_rooms:
            room, created = Room.objects.get_or_create(
                room_number=number,
                defaults={
                    "room_type": rtype,
                    "price_per_night": price,
                    "status": status,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created room {number}"))
            else:
                self.stdout.write(f"Room {number} already exists, skipping")

        self.stdout.write(self.style.SUCCESS(
            "\nDemo login credentials (password for all: demo1234):\n"
            "  reception1     -> Receptionist\n"
            "  housekeeping1  -> Housekeeping\n"
            "  manager1       -> Manager\n"
        ))
