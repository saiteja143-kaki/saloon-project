from rest_framework import serializers
from .models import Worker, Transaction, Membership, MembershipRecord

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'workerId', 'type', 'desc', 'amount', 'mode', 'timestamp']
        
    workerId = serializers.IntegerField(source='worker.id', required=False, allow_null=True)
    
    def create(self, validated_data):
        worker_data = validated_data.pop('worker', None)
        worker = None
        if worker_data and worker_data.get('id'):
            worker = Worker.objects.get(id=worker_data['id'])
        transaction = Transaction.objects.create(worker=worker, **validated_data)
        return transaction


class WorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = ['id', 'name', 'initials', 'phone', 'photo', 'is_blocked']


class MembershipRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipRecord
        fields = ['id', 'membershipId', 'workerId', 'service_desc', 'original_amount', 'discounted_amount', 'timestamp', 'mode']
        
    membershipId = serializers.IntegerField(source='membership.id')
    workerId = serializers.IntegerField(source='worker.id', required=False, allow_null=True)
    mode = serializers.CharField(write_only=True, required=False)
    
    def create(self, validated_data):
        membership_id = validated_data.pop('membership')['id']
        membership = Membership.objects.get(id=membership_id)
        
        worker_data = validated_data.pop('worker', None)
        worker = None
        if worker_data and worker_data.get('id'):
            worker = Worker.objects.get(id=worker_data['id'])
            
        mode = validated_data.pop('mode', 'cash')
            
        record = MembershipRecord.objects.create(membership=membership, worker=worker, **validated_data)
        
        if worker:
            from django.utils import timezone as tz
            Transaction.objects.create(
                worker=worker,
                type='income',
                desc=f"Membership Service: {record.service_desc} ({membership.name})",
                amount=record.discounted_amount,
                mode=mode,
                timestamp=tz.now()
            )
            
        return record


class MembershipSerializer(serializers.ModelSerializer):
    records = MembershipRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Membership
        fields = ['id', 'member_id', 'name', 'issue_date', 'expire_date', 'village_name', 'phone_number', 'records']


from .models import Product, ProductSale, ProductRestock

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock_quantity', 'created_at']


class ProductSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSale
        fields = ['id', 'productId', 'quantity_sold', 'sale_price', 'payment_method', 'timestamp']
        
    productId = serializers.IntegerField(source='product.id')
    
    def create(self, validated_data):
        product_id = validated_data.pop('product')['id']
        product = Product.objects.get(id=product_id)
        sale = ProductSale.objects.create(product=product, **validated_data)
        return sale

class ProductRestockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRestock
        fields = ['id', 'productId', 'quantity_added', 'timestamp']
        
    productId = serializers.IntegerField(source='product.id')
    
    def create(self, validated_data):
        product_id = validated_data.pop('product')['id']
        product = Product.objects.get(id=product_id)
        restock = ProductRestock.objects.create(product=product, **validated_data)
        return restock


from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    workerId = serializers.IntegerField(source='worker.id')

    class Meta:
        model = Attendance
        fields = ['id', 'workerId', 'date', 'check_in', 'check_out']

    def create(self, validated_data):
        worker_id = validated_data.pop('worker')['id']
        worker = Worker.objects.get(id=worker_id)
        attendance, _ = Attendance.objects.get_or_create(
            worker=worker,
            date=validated_data.get('date') or __import__('django.utils.timezone', fromlist=['localdate']).localdate(),
            defaults=validated_data
        )
        # If already exists, update check_in if not set
        if attendance.check_in is None and validated_data.get('check_in'):
            attendance.check_in = validated_data['check_in']
            attendance.save()
        return attendance

from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'client_name', 'client_phone', 'description', 'appointment_date', 'amount', 'payment_mode', 'assigned_worker', 'assignedWorkerId', 'status', 'created_at']
        
    assignedWorkerId = serializers.IntegerField(source='assigned_worker.id', required=False, allow_null=True)

    def create(self, validated_data):
        worker_data = validated_data.pop('assigned_worker', None)
        worker = None
        if worker_data and worker_data.get('id'):
            worker = Worker.objects.get(id=worker_data['id'])
        appointment = Appointment.objects.create(assigned_worker=worker, **validated_data)
        return appointment
