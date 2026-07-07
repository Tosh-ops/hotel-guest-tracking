from django.db import models
from django.conf import settings


class Room(models.Model):

    ROOM_STATUS = (
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('cleaning', 'Cleaning'),
        ('maintenance', 'Maintenance'),
    )

    room_number = models.CharField(max_length=10, unique=True)

    room_type = models.CharField(max_length=50)

    price_per_night = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=ROOM_STATUS,
        default='available'
    )

    def __str__(self):
        return self.room_number
    
class Guest(models.Model):

    first_name = models.CharField(max_length=50)

    last_name = models.CharField(max_length=50)

    phone = models.CharField(max_length=20)

    email = models.EmailField(blank=True)

    id_number = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    

class CheckIn(models.Model):

    guest = models.ForeignKey(
        Guest,
        on_delete=models.CASCADE
    )

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE
    )

    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    check_in_date = models.DateTimeField(auto_now_add=True)

    expected_checkout = models.DateField()

    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.guest} - {self.room}"
    

class CheckOut(models.Model):

    checkin = models.OneToOneField(
        CheckIn,
        on_delete=models.CASCADE
    )

    checkout_date = models.DateTimeField(auto_now_add=True)

    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    total_bill = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

class ServiceRequest(models.Model):

    STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    )

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE
    )

    description = models.TextField()

    requested_at = models.DateTimeField(auto_now_add=True)

    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default='pending'
    )

