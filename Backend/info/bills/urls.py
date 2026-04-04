from django.urls import path
from . import views

urlpatterns = [
    path("bills/", views.bills),
    path("bills/<str:bill_no>/", views.delete_bill),
    path("bills/update/<str:bill_no>/", views.update_bill),
    path("auth/login/", views.login),
    path("auth/forgot-password/request-otp/", views.forgot_password_request_otp),
    path("auth/forgot-password/reset/", views.forgot_password_reset),
    path("auth/users/", views.users),
    path("auth/users/<str:username>/", views.users),
]
