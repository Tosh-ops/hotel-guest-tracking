from django.contrib import admin
from .models import Room, Guest, CheckIn, CheckOut, ServiceRequest

admin.site.register(Room)
admin.site.register(Guest)
admin.site.register(CheckIn)
admin.site.register(CheckOut)
admin.site.register(ServiceRequest)