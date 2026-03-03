import os
import django
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Membership

def get_unique_id():
    while True:
        new_id = f"{random.randint(0, 999):03d}"
        if not Membership.objects.filter(member_id=new_id).exists():
            return new_id

for m in Membership.objects.filter(member_id__isnull=True) | Membership.objects.filter(member_id=""):
    m.member_id = get_unique_id()
    m.save()
    print(f"Updated membership {m.id} to member_id {m.member_id}")
