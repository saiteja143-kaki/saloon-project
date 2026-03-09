from django.db import models
from django.utils import timezone

class Worker(models.Model):
    name = models.CharField(max_length=255)
    initials = models.CharField(max_length=5)
    phone = models.CharField(max_length=20, blank=True, null=True)
    photo = models.TextField(blank=True, null=True)
    is_blocked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} (#{self.id})"


class Transaction(models.Model):
    TX_TYPES = [('income', 'Income'), ('expense', 'Expense')]
    MODES = [('cash', 'Cash'), ('online', 'Online')]
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    type = models.CharField(max_length=10, choices=TX_TYPES)
    desc = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mode = models.CharField(max_length=10, choices=MODES, default='cash')
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        worker_name = self.worker.name if self.worker else "General Shop"
        return f"{self.type.capitalize()} - {self.amount} ({worker_name})"


class Membership(models.Model):
    member_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    issue_date = models.DateField()
    expire_date = models.DateField()
    village_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} - {self.phone_number}"


class MembershipRecord(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name='records')
    worker = models.ForeignKey('Worker', on_delete=models.SET_NULL, null=True, blank=True, related_name='membership_records')
    transaction = models.OneToOneField('Transaction', on_delete=models.CASCADE, null=True, blank=True, related_name='membership_record')
    service_desc = models.CharField(max_length=255)
    original_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discounted_amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.service_desc} - {self.discounted_amount} ({self.membership.name})"


class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.name} - {self.stock_quantity} in stock"


class ProductSale(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    quantity_sold = models.IntegerField()
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=[('cash', 'Cash'), ('online', 'Online')], default='cash')
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Sold {self.quantity_sold}x {self.product.name}"


class ProductRestock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='restocks')
    quantity_added = models.IntegerField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Restocked {self.quantity_added}x {self.product.name}"


class Attendance(models.Model):
    worker    = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='attendances')
    date      = models.DateField(default=timezone.localdate)
    check_in  = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)

    class Meta:
        unique_together = ('worker', 'date')   # one record per worker per day
        ordering = ['-date']

    def __str__(self):
        return f"{self.worker.name} – {self.date} ({self.check_in} → {self.check_out})"

class Appointment(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed')]
    PAYMENT_MODES = [('cash', 'Cash'), ('online', 'Online')]

    client_name = models.CharField(max_length=255)
    client_phone = models.CharField(max_length=20, blank=True, null=True)
    description = models.CharField(max_length=255)
    appointment_date = models.DateTimeField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=10, choices=PAYMENT_MODES, default='cash')
    assigned_worker = models.ForeignKey(Worker, on_delete=models.SET_NULL, related_name='appointments', null=True, blank=True)
    transaction = models.OneToOneField('Transaction', on_delete=models.CASCADE, null=True, blank=True, related_name='appointment')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client_name} - {self.description} ({self.status})"
