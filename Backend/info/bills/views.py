from django.http import JsonResponse
from .models import TrsBills, Billitem
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
import json


@csrf_exempt
def bills(request):

    # =============================
    # CREATE BILL
    # =============================
    if request.method == "POST":

        try:
            data = json.loads(request.body)

            print("Received Data:", data)

            bill_no = data.get("bill_no")

            bill_date_str = data.get("bill_date")

            if bill_date_str:
                bill_date = datetime.strptime(bill_date_str, "%Y-%m-%d").date()
            else:
                bill_date = datetime.today().date()

            bill = TrsBills.objects.create(
                bill_no=bill_no,
                bill_date=bill_date,
                payment_type=data.get("payment_type"),
                client_name=data.get("client_name"),
                client_mobile=data.get("client_mobile"),
                client_email=data.get("client_email"),
                client_address=data.get("client_address"),
                gstnum=data.get("gstnum"),
                sub_total=data.get("sub_total"),
                grand_total=data.get("grand_total"),
                amount_words=data.get("amount_words"),
            )

            items = data.get("items", [])

            for item in items:
                Billitem.objects.create(
                    bill=bill,
                    description=item.get("description"),
                    hsn_sac=item.get("hsn_sac"),
                    unit=item.get("unit"),
                    qty=item.get("qty"),
                    rate=item.get("rate"),
                    amount=item.get("amount"),
                )

            return JsonResponse(
                {"status": "success", "message": "Bill Created"}, status=201
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # =============================
    # GET BILLS / FILTER
    # =============================
    if request.method == "GET":

        start = request.GET.get("start")
        end = request.GET.get("end")

        bills = TrsBills.objects.all()

        if start and end:
            bills = bills.filter(bill_date__range=[start, end])

        data = []

        for bill in bills:

            items = Billitem.objects.filter(bill=bill)

            items_data = []

            for item in items:
                items_data.append(
                    {
                        "description": item.description,
                        "hsn_sac": item.hsn_sac,
                        "unit": item.unit,
                        "qty": item.qty,
                        "rate": str(item.rate),
                        "amount": str(item.amount),
                    }
                )

            data.append(
                {
                    "bill_no": bill.bill_no,
                    "bill_date": bill.bill_date.strftime("%Y-%m-%d"),
                    "payment_type": bill.payment_type,
                    "client_name": bill.client_name,
                    "client_mobile": bill.client_mobile,
                    "client_email": bill.client_email,
                    "client_address": bill.client_address,
                    "gstnum": bill.gstnum,
                    "sub_total": str(bill.sub_total),
                    "grand_total": str(bill.grand_total),
                    "amount_words": bill.amount_words,
                    "items": items_data,
                }
            )

        return JsonResponse({"status": "success", "bills": data})


# =============================
# DELETE BILL
# =============================
@csrf_exempt
def delete_bill(request, bill_no):

    if request.method == "DELETE":

        bill = TrsBills.objects.get(bill_no=bill_no)

        Billitem.objects.filter(bill=bill).delete()

        bill.delete()

        return JsonResponse({"message": "Bill Deleted"})


# =============================
# UPDATE BILL
# =============================
@csrf_exempt
def update_bill(request, bill_no):

    if request.method == "PUT":

        data = json.loads(request.body)

        bill = TrsBills.objects.get(bill_no=bill_no)

        bill.client_name = data.get("client_name", bill.client_name)
        bill.client_mobile = data.get("client_mobile", bill.client_mobile)
        bill.client_email = data.get("client_email", bill.client_email)
        bill.client_address = data.get("client_address", bill.client_address)
        bill.payment_type = data.get("payment_type", bill.payment_type)
        bill.sub_total = data.get("sub_total", bill.sub_total)
        bill.grand_total = data.get("grand_total", bill.grand_total)

        bill.save()

        Billitem.objects.filter(bill=bill).delete()

        items = data.get("items", [])

        for item in items:
            Billitem.objects.create(
                bill=bill,
                description=item.get("description"),
                hsn_sac=item.get("hsn_sac"),
                unit=item.get("unit"),
                qty=item.get("qty"),
                rate=item.get("rate"),
                amount=item.get("amount"),
            )

        return JsonResponse({"message": "Bill Updated"})