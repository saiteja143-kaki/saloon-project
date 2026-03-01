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
