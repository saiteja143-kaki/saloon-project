from rest_framework import viewsets
from .models import Worker, Transaction, Membership, MembershipRecord
from .serializers import WorkerSerializer, TransactionSerializer, MembershipSerializer, MembershipRecordSerializer

class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all().order_by('id')
    serializer_class = WorkerSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-timestamp')
    serializer_class = TransactionSerializer


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.all().order_by('-issue_date')
    serializer_class = MembershipSerializer


class MembershipRecordViewSet(viewsets.ModelViewSet):
    queryset = MembershipRecord.objects.all().order_by('-timestamp')
    serializer_class = MembershipRecordSerializer

    def get_queryset(self):
        queryset = self.queryset
        membership_id = self.request.query_params.get('membership_id')
        if membership_id is not None:
            queryset = queryset.filter(membership_id=membership_id)
        return queryset

from .models import Product, ProductSale, ProductRestock
from .serializers import ProductSerializer, ProductSaleSerializer, ProductRestockSerializer
from rest_framework import status
from rest_framework.response import Response

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer

class ProductSaleViewSet(viewsets.ModelViewSet):
    queryset = ProductSale.objects.all().order_by('-timestamp')
    serializer_class = ProductSaleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Custom logic to deduct stock
        product_data = serializer.validated_data.get('product')
        # product_data is a dictionary because of how we handled it in the serializer's create method
        # or it is an object, we need to handle it safely
        try:
            product = Product.objects.get(id=request.data.get('product', {}).get('id', request.data.get('productId')))
        except Exception:
            try:
                # Fallback if product_data is a dict or object
                product_id = product_data.get('id') if isinstance(product_data, dict) else product_data.id
                product = Product.objects.get(id=product_id)
            except Exception:
                return Response({"error": "Invalid Product"}, status=status.HTTP_400_BAD_REQUEST)
        
        quantity_sold = serializer.validated_data.get('quantity_sold', 0)
        
        if product.stock_quantity < quantity_sold:
            return Response({"error": "Not enough stock"}, status=status.HTTP_400_BAD_REQUEST)
            
        product.stock_quantity -= quantity_sold
        product.save()

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class ProductRestockViewSet(viewsets.ModelViewSet):
    queryset = ProductRestock.objects.all().order_by('-timestamp')
    serializer_class = ProductRestockSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Custom logic to increment stock
        product_data = serializer.validated_data.get('product')
        try:
            product_id = product_data.get('id') if isinstance(product_data, dict) else product_data.id
            product = Product.objects.get(id=product_id)
        except Exception:
            return Response({"error": "Invalid Product"}, status=status.HTTP_400_BAD_REQUEST)
        
        quantity_added = serializer.validated_data.get('quantity_added', 0)
        
        if quantity_added <= 0:
            return Response({"error": "Must add at least 1 unit"}, status=status.HTTP_400_BAD_REQUEST)
            
        product.stock_quantity += quantity_added
        product.save()

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


from django.utils import timezone as tz
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer

    def create(self, request, *args, **kwargs):
        """Check in: create or update today's attendance record."""
        worker_id = request.data.get('workerId')
        if not worker_id:
            return Response({"error": "workerId required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            worker = Worker.objects.get(id=worker_id)
        except Worker.DoesNotExist:
            return Response({"error": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)

        today = tz.localdate()
        now_time = tz.localtime(tz.now()).time().replace(second=0, microsecond=0)

        attendance, created = Attendance.objects.get_or_create(
            worker=worker, date=today,
            defaults={'check_in': now_time}
        )
        if not created and attendance.check_in is None:
            attendance.check_in = now_time
            attendance.save()

        serializer = AttendanceSerializer(attendance)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    def partial_update(self, request, *args, **kwargs):
        """Check out: update check_out on an existing attendance record."""
        attendance = self.get_object()
        now_time = tz.localtime(tz.now()).time().replace(second=0, microsecond=0)
        attendance.check_out = now_time
        attendance.save()
        return Response(AttendanceSerializer(attendance).data)

from rest_framework.decorators import action
from .models import Appointment
from .serializers import AppointmentSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('appointment_date')
    serializer_class = AppointmentSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        
        if appointment.status == 'completed':
            return Response({"error": "Appointment is already completed"}, status=status.HTTP_400_BAD_REQUEST)
            
        appointment.status = 'completed'
        appointment.save()
        
        # Automatically create income transaction if worker assigned
        if appointment.assigned_worker:
            Transaction.objects.create(
                worker=appointment.assigned_worker,
                type='income',
                desc=f"Appointment: {appointment.description} ({appointment.client_name})",
                amount=appointment.amount,
                mode=appointment.payment_mode,
                timestamp=tz.now()
            )
            
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
