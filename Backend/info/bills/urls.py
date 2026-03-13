from django.urls import path
from . import views

urlpatterns = [

    path("bills/", views.bills),

    path("bills/<str:bill_no>/", views.delete_bill),

    path("bills/update/<str:bill_no>/", views.update_bill),

]