from django.urls import path
from .views import (
    occupancy_report,
    revenue_report,
    daily_activity,
    available_rooms,
    cleaning_rooms,
    maintenance_rooms,
    health,
)

urlpatterns = [
    path("occupancy/", occupancy_report),
    path("revenue/", revenue_report),
    path("daily-activity/", daily_activity),
    path("available/", available_rooms),
    path("cleaning/", cleaning_rooms),
    path("maintenance/", maintenance_rooms),
    path("health/", health),
]
