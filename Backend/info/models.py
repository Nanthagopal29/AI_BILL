# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class TrsBills(models.Model):
    bill_no = models.CharField(unique=True, max_length=20)
    bill_date = models.DateField()
    payment_type = models.CharField(max_length=20)
    client_name = models.CharField(max_length=100)
    client_mobile = models.CharField(max_length=15)
    client_email = models.CharField(max_length=254, blank=True, null=True)
    client_address = models.TextField()
    gstnum = models.CharField(max_length=15, blank=True, null=True)
    sub_total = models.DecimalField(max_digits=10, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    amount_words = models.CharField(max_length=255)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'trs_bills'
