import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

# Check if admin exists
if User.objects.filter(username='admin').exists():
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print("Admin password reset to: admin123")
else:
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Admin user created with username: admin, password: admin123")
