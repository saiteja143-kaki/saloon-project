import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Worker, Transaction, Membership, MembershipRecord, ProductSale, Attendance, Appointment, Product, ProductRestock

def clear_db():
    print("Deleting all Appointments...")
    Appointment.objects.all().delete()
    
    print("Deleting all Attendance records...")
    Attendance.objects.all().delete()

    print("Deleting all Product Sales...")
    ProductSale.objects.all().delete()

    print("Deleting all Product Restocks...")
    ProductRestock.objects.all().delete()

    print("Deleting all Products...")
    Product.objects.all().delete()
    
    print("Deleting all Membership Records...")
    MembershipRecord.objects.all().delete()
    
    print("Deleting all Memberships...")
    Membership.objects.all().delete()
    
    print("Deleting all Transactions...")
    Transaction.objects.all().delete()
    
    print("Deleting all Workers...")
    Worker.objects.all().delete()

    print("\n✅ Success! All temporary test data has been cleared from the database.")
    print("The system is completely fresh for the client.")

if __name__ == '__main__':
    clear_db()
