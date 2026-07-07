from django.utils.timezone import now
from rest_framework import serializers
from .models import Room, Guest, CheckIn, CheckOut, ServiceRequest


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = "__all__"


class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = "__all__"

    def validate_phone(self, value):
        if len(value) < 10:
            raise serializers.ValidationError(
                "Phone number is too short."
            )
        return value


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = "__all__"

    def validate(self, data):
        room = data["room"]
        if room.status != "available":
            raise serializers.ValidationError(
                "This room is not available."
            )
        return data

    def validate_expected_checkout(self, value):
        if value < now().date():
            raise serializers.ValidationError(
                "Expected checkout cannot be in the past."
            )
        return value

    def create(self, validated_data):
        room = validated_data["room"]
        room.status = "occupied"
        room.save()
        return CheckIn.objects.create(**validated_data)


class CheckOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckOut
        fields = "__all__"

    def validate(self, data):
        checkin = data["checkin"]
        if not checkin.active:
            raise serializers.ValidationError(
                "Guest has already checked out."
            )
        return data

    def validate_total_bill(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Bill cannot be negative."
            )
        return value

    def create(self, validated_data):
        checkin = validated_data["checkin"]
        room = checkin.room
        room.status = "cleaning"
        room.save()
        checkin.active = False
        checkin.save()
        return CheckOut.objects.create(**validated_data)


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = "__all__"

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        if instance.status == "completed":
            room = instance.room
            room.status = "available"
            room.save()
        return instance