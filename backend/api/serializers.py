from rest_framework import serializers
from .models import Worker, Transaction, Membership, MembershipRecord

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'workerId', 'type', 'desc', 'amount', 'mode', 'timestamp']
        
    workerId = serializers.IntegerField(source='worker.id')
    
    def create(self, validated_data):
        worker_id = validated_data.pop('worker')['id']
        worker = Worker.objects.get(id=worker_id)
        transaction = Transaction.objects.create(worker=worker, **validated_data)
        return transaction


class WorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = ['id', 'name', 'initials', 'phone', 'photo']


class MembershipRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipRecord
        fields = ['id', 'membershipId', 'service_desc', 'original_amount', 'discounted_amount', 'timestamp']
        
    membershipId = serializers.IntegerField(source='membership.id')
    
    def create(self, validated_data):
        membership_id = validated_data.pop('membership')['id']
        membership = Membership.objects.get(id=membership_id)
        record = MembershipRecord.objects.create(membership=membership, **validated_data)
        return record


class MembershipSerializer(serializers.ModelSerializer):
    records = MembershipRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Membership
        fields = ['id', 'name', 'issue_date', 'expire_date', 'village_name', 'phone_number', 'records']
