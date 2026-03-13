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
    id = models.AutoField(primary_key=True)

    class Meta:
        managed = False
        db_table = 'trs_bills'

class Billitem(models.Model):
    bill = models.ForeignKey('bills.TrsBills', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    hsn_sac = models.CharField(max_length=20)
    unit = models.CharField(max_length=10, blank=True, null=True)
    qty = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    id = models.AutoField(primary_key=True)

    class Meta:
        managed = False
        db_table = 'trs_billitem'
