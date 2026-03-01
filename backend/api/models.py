from django.db import models
from django.utils import timezone

class Worker(models.Model):
    name = models.CharField(max_length=255)
    initials = models.CharField(max_length=5)
    phone = models.CharField(max_length=20, blank=True, null=True)
    photo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} (#{self.id})"


class Transaction(models.Model):
    TX_TYPES = [('income', 'Income'), ('expense', 'Expense')]
    MODES = [('cash', 'Cash'), ('online', 'Online')]

    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=10, choices=TX_TYPES)
    desc = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mode = models.CharField(max_length=10, choices=MODES, default='cash')
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.type.capitalize()} - {self.amount} ({self.worker.name})"


class Membership(models.Model):
    name = models.CharField(max_length=255)
    issue_date = models.DateField()
    expire_date = models.DateField()
    village_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} - {self.phone_number}"


class MembershipRecord(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name='records')
    service_desc = models.CharField(max_length=255)
    original_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.service_desc} - {self.discounted_amount} ({self.membership.name})"
