from django.db.models import Sum
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from hotel.models import Room, CheckIn, CheckOut
from hotel.permissions import IsManager


@api_view(['GET'])
@permission_classes([IsManager])
def occupancy_report(request):
    total_rooms = Room.objects.count()
    occupied = Room.objects.filter(
        status='occupied'
    ).count()
    available = Room.objects.filter(
        status='available'
    ).count()
    return Response({
        "total_rooms": total_rooms,
        "occupied_rooms": occupied,
        "available_rooms": available,
    })


@api_view(['GET'])
@permission_classes([IsManager])
def revenue_report(request):
    revenue = CheckOut.objects.aggregate(
        total=Sum('total_bill')
    )
    return Response({
        "total_revenue": revenue["total"] or 0,
    })


@api_view(['GET'])
@permission_classes([IsManager])
def daily_activity(request):
    today = now().date()
    checkins = CheckIn.objects.filter(
        check_in_date__date=today
    ).count()
    checkouts = CheckOut.objects.filter(
        checkout_date__date=today
    ).count()
    return Response({
        "today": today,
        "check_ins": checkins,
        "check_outs": checkouts,
    })


@api_view(['GET'])
@permission_classes([IsManager])
def available_rooms(request):
    available = Room.objects.filter(
        status='available'
    ).count()
    return Response({
        "available_rooms": available,
    })


@api_view(['GET'])
@permission_classes([IsManager])
def cleaning_rooms(request):
    cleaning = Room.objects.filter(
        status='cleaning'
    ).count()
    return Response({
        "cleaning_rooms": cleaning,
    })


@api_view(['GET'])
@permission_classes([IsManager])
def maintenance_rooms(request):
    maintenance = Room.objects.filter(
        status='maintenance'
    ).count()
    return Response({
        "maintenance_rooms": maintenance,
    })


@api_view(['GET'])
def health(request):
    return Response({
        "status": "running",
        "application": "Hotel Guest Tracking System",
        "version": "1.0",
    })
