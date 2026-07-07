from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from .models import Room, Guest, CheckIn, CheckOut, ServiceRequest
from .permissions import (
    IsReceptionistOrManager,
    IsHousekeepingOrManager,
    IsManager,
)
from .serializers import (
    RoomSerializer,
    GuestSerializer,
    CheckInSerializer,
    CheckOutSerializer,
    ServiceRequestSerializer,
)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    filterset_fields = [
        'status',
        'room_type',
    ]
    search_fields = [
        'room_number',
    ]
    ordering_fields = [
        'room_number',
        'price_per_night',
    ]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsHousekeepingOrManager]
        else:
            permission_classes = [IsReceptionistOrManager]
        return [permission() for permission in permission_classes]


class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [IsReceptionistOrManager]
    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]
    search_fields = [
        'first_name',
        'last_name',
        'phone',
    ]
    ordering_fields = [
        'first_name',
        'last_name',
    ]


class CheckInViewSet(viewsets.ModelViewSet):
    queryset = CheckIn.objects.all()
    serializer_class = CheckInSerializer
    permission_classes = [IsReceptionistOrManager]


class CheckOutViewSet(viewsets.ModelViewSet):
    queryset = CheckOut.objects.all()
    serializer_class = CheckOutSerializer
    permission_classes = [IsReceptionistOrManager]


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsHousekeepingOrManager]