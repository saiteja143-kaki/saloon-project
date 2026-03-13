from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkerViewSet, TransactionViewSet, MembershipViewSet, MembershipRecordViewSet, ProductViewSet, ProductSaleViewSet, ProductRestockViewSet, AttendanceViewSet, AppointmentViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'workers', WorkerViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'memberships', MembershipViewSet)
router.register(r'membership-records', MembershipRecordViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-sales', ProductSaleViewSet)
router.register(r'product-restocks', ProductRestockViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'notes', NoteViewSet)

from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('', include(router.urls)),
]
