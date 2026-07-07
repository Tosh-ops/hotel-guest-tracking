from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet,
    GuestViewSet,
    CheckInViewSet,
    CheckOutViewSet,
    ServiceRequestViewSet,
)

router = DefaultRouter()

router.register("rooms", RoomViewSet)
router.register("guests", GuestViewSet)
router.register("checkins", CheckInViewSet)
router.register("checkouts", CheckOutViewSet)
router.register("service-requests", ServiceRequestViewSet)

urlpatterns = router.urls
