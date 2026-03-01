from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkerViewSet, TransactionViewSet, MembershipViewSet, MembershipRecordViewSet

router = DefaultRouter()
router.register(r'workers', WorkerViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'memberships', MembershipViewSet)
router.register(r'membership-records', MembershipRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
