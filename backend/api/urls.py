from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkerViewSet, TransactionViewSet, MembershipViewSet, MembershipRecordViewSet, ProductViewSet, ProductSaleViewSet, ProductRestockViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'workers', WorkerViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'memberships', MembershipViewSet)
router.register(r'membership-records', MembershipRecordViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-sales', ProductSaleViewSet)
router.register(r'product-restocks', ProductRestockViewSet)
router.register(r'attendance', AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
