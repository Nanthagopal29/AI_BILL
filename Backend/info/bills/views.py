import hashlib
import json
import random
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils import timezone as django_timezone
from django.views.decorators.csrf import csrf_exempt

from .models import Billitem, TrsBills, UserLogin


JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12
FORGOT_PASSWORD_OTP_TTL = 300


def parse_json_body(request):
    try:
        return json.loads(request.body or "{}"), None
    except json.JSONDecodeError:
        return None, JsonResponse({"status": "error", "message": "Invalid JSON body"}, status=400)


def user_to_dict(user, include_token=False):
    data = {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
    return data


def generate_jwt(user):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.username,
        "username": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXPIRY_HOURS)).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_session_cache_key(username):
    return f"auth-session:{username.lower()}"


def get_token_from_request(request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def authenticate_request(request):
    token = get_token_from_request(request)
    if not token:
        return None, JsonResponse({"status": "error", "message": "Authorization token missing"}, status=401)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user = UserLogin.objects.get(username=payload.get("sub"), is_active=1)
    except jwt.ExpiredSignatureError:
        return None, JsonResponse({"status": "error", "message": "Token expired"}, status=401)
    except jwt.InvalidTokenError:
        return None, JsonResponse({"status": "error", "message": "Invalid token"}, status=401)
    except UserLogin.DoesNotExist:
        return None, JsonResponse({"status": "error", "message": "User not found or inactive"}, status=401)

    session_hash = cache.get(get_session_cache_key(user.username))
    if not session_hash or session_hash != hash_token(token):
        return None, JsonResponse({"status": "error", "message": "Session expired. Please login again."}, status=401)

    request.auth_user = user
    return user, None


def jwt_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        user, error_response = authenticate_request(request)
        if error_response:
            return error_response
        request.auth_user = user
        return view_func(request, *args, **kwargs)

    return wrapped


def verify_user_password(user, raw_password):
    stored_password = user.password or ""
    if not raw_password:
        return False

    try:
        if check_password(raw_password, stored_password):
            return True
    except ValueError:
        pass

    return stored_password == raw_password


def build_bill_response(bill):
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

    return {
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


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    data, error_response = parse_json_body(request)
    if error_response:
        return error_response

    username = (data.get("username") or "").strip()
    password = data.get("password") or data.get("pin")

    if not username or not password:
        return JsonResponse({"status": "error", "message": "Username and password are required"}, status=400)

    try:
        user = UserLogin.objects.get(username=username)
    except UserLogin.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Invalid credentials"}, status=401)

    if user.is_active == 0:
        return JsonResponse({"status": "error", "message": "User account is inactive"}, status=403)

    if not verify_user_password(user, password):
        return JsonResponse({"status": "error", "message": "Invalid credentials"}, status=401)

    if user.password == password:
        user.password = make_password(password)

    token = generate_jwt(user)
    cache.set(get_session_cache_key(user.username), hash_token(token), timeout=JWT_EXPIRY_HOURS * 3600)
    user.save(update_fields=["password"])

    return JsonResponse(
        {
            "status": "success",
            "message": "Login successful",
            "token": token,
            "user": user_to_dict(user),
        }
    )


@csrf_exempt
def forgot_password_request_otp(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    data, error_response = parse_json_body(request)
    if error_response:
        return error_response

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    if not username or not email:
        return JsonResponse({"status": "error", "message": "Username and email are required"}, status=400)

    try:
        user = UserLogin.objects.get(username=username)
    except UserLogin.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User not found"}, status=404)

    if not user.email or user.email.strip().lower() != email.lower():
        return JsonResponse({"status": "error", "message": "Username and email do not match"}, status=400)

    otp = f"{random.randint(100000, 999999)}"
    cache_key = f"forgot-password:{username.lower()}:{email.lower()}"
    cache.set(cache_key, hash_token(otp), timeout=FORGOT_PASSWORD_OTP_TTL)

    try:
        send_mail(
            subject="Your Anand InfoTech password reset OTP",
            message=(
                f"Hello {username},\n\n"
                f"Your OTP for password reset is: {otp}\n"
                f"This OTP is valid for 5 minutes.\n\n"
                "If you did not request this, please ignore this email."
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        cache.delete(cache_key)
        return JsonResponse(
            {"status": "error", "message": f"Unable to send OTP email: {str(exc)}"},
            status=500,
        )

    return JsonResponse({"status": "success", "message": "OTP sent to your registered email"})


@csrf_exempt
def forgot_password_reset(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    data, error_response = parse_json_body(request)
    if error_response:
        return error_response

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    otp = (data.get("otp") or "").strip()
    new_password = data.get("new_password")

    if not username or not email or not otp or not new_password:
        return JsonResponse(
            {"status": "error", "message": "Username, email, OTP, and new password are required"},
            status=400,
        )

    try:
        user = UserLogin.objects.get(username=username)
    except UserLogin.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User not found"}, status=404)

    if not user.email or user.email.strip().lower() != email.lower():
        return JsonResponse({"status": "error", "message": "Username and email do not match"}, status=400)

    cache_key = f"forgot-password:{username.lower()}:{email.lower()}"
    stored_otp_hash = cache.get(cache_key)

    if not stored_otp_hash:
        return JsonResponse({"status": "error", "message": "OTP expired or not requested"}, status=400)

    if stored_otp_hash != hash_token(otp):
        return JsonResponse({"status": "error", "message": "Invalid OTP"}, status=400)

    user.password = make_password(new_password)
    cache.delete(get_session_cache_key(user.username))
    user.save(update_fields=["password"])
    cache.delete(cache_key)

    return JsonResponse({"status": "success", "message": "Password reset successful"})


@csrf_exempt
def users(request, username=None):
    if request.method != "POST":
        _, error_response = authenticate_request(request)
        if error_response:
            return error_response

    if request.method == "GET":
        if username:
            try:
                user = UserLogin.objects.get(username=username)
            except UserLogin.DoesNotExist:
                return JsonResponse({"status": "error", "message": "User not found"}, status=404)
            return JsonResponse({"status": "success", "user": user_to_dict(user)})

        user_list = [user_to_dict(user) for user in UserLogin.objects.all().order_by("username")]
        return JsonResponse({"status": "success", "users": user_list})

    if request.method == "POST":
        data, error_response = parse_json_body(request)
        if error_response:
            return error_response

        new_username = (data.get("username") or "").strip()
        raw_password = data.get("password")

        if not new_username or not raw_password:
            return JsonResponse({"status": "error", "message": "Username and password are required"}, status=400)

        if UserLogin.objects.filter(username=new_username).exists():
            return JsonResponse({"status": "error", "message": "Username already exists"}, status=409)

        user = UserLogin.objects.create(
            username=new_username,
            password=make_password(raw_password),
            email=data.get("email"),
            role=data.get("role"),
            is_active=data.get("is_active", 1),
            created_at=django_timezone.now(),
        )

        return JsonResponse(
            {
                "status": "success",
                "message": "User created successfully",
                "user": user_to_dict(user),
            },
            status=201,
        )

    if request.method == "PUT":
        if not username:
            return JsonResponse({"status": "error", "message": "Username is required in the URL"}, status=400)

        data, error_response = parse_json_body(request)
        if error_response:
            return error_response

        try:
            user = UserLogin.objects.get(username=username)
        except UserLogin.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)

        if "password" in data and data["password"]:
            user.password = make_password(data["password"])
            cache.delete(get_session_cache_key(user.username))
        if "email" in data:
            user.email = data.get("email")
        if "role" in data:
            user.role = data.get("role")
        if "is_active" in data:
            user.is_active = data.get("is_active")

        user.save()
        return JsonResponse(
            {
                "status": "success",
                "message": "User updated successfully",
                "user": user_to_dict(user),
            }
        )

    if request.method == "DELETE":
        if not username:
            return JsonResponse({"status": "error", "message": "Username is required in the URL"}, status=400)

        try:
            user = UserLogin.objects.get(username=username)
        except UserLogin.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)

        user.delete()
        return JsonResponse({"status": "success", "message": "User deleted successfully"})

    return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)


@csrf_exempt
@jwt_required
def bills(request):
    if request.method == "POST":
        data, error_response = parse_json_body(request)
        if error_response:
            return error_response

        try:
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

            for item in data.get("items", []):
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
                {
                    "status": "success",
                    "message": "Bill created",
                    "bill": build_bill_response(bill),
                },
                status=201,
            )

        except Exception as exc:
            return JsonResponse({"status": "error", "message": str(exc)}, status=500)

    if request.method == "GET":
        start = request.GET.get("start")
        end = request.GET.get("end")

        bill_queryset = TrsBills.objects.all()
        if start and end:
            bill_queryset = bill_queryset.filter(bill_date__range=[start, end])

        data = [build_bill_response(bill) for bill in bill_queryset]
        return JsonResponse({"status": "success", "bills": data})

    return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)


@csrf_exempt
@jwt_required
def delete_bill(request, bill_no):
    if request.method != "DELETE":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    try:
        bill = TrsBills.objects.get(bill_no=bill_no)
    except TrsBills.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Bill not found"}, status=404)

    Billitem.objects.filter(bill=bill).delete()
    bill.delete()

    return JsonResponse({"status": "success", "message": "Bill deleted"})


@csrf_exempt
@jwt_required
def update_bill(request, bill_no):
    if request.method != "PUT":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    data, error_response = parse_json_body(request)
    if error_response:
        return error_response

    try:
        bill = TrsBills.objects.get(bill_no=bill_no)
    except TrsBills.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Bill not found"}, status=404)

    bill.client_name = data.get("client_name", bill.client_name)
    bill.client_mobile = data.get("client_mobile", bill.client_mobile)
    bill.client_email = data.get("client_email", bill.client_email)
    bill.client_address = data.get("client_address", bill.client_address)
    bill.payment_type = data.get("payment_type", bill.payment_type)
    bill.sub_total = data.get("sub_total", bill.sub_total)
    bill.grand_total = data.get("grand_total", bill.grand_total)
    bill.gstnum = data.get("gstnum", bill.gstnum)
    bill.amount_words = data.get("amount_words", bill.amount_words)

    bill_date_str = data.get("bill_date")
    if bill_date_str:
        bill.bill_date = datetime.strptime(bill_date_str, "%Y-%m-%d").date()

    bill.save()

    Billitem.objects.filter(bill=bill).delete()
    for item in data.get("items", []):
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
        {
            "status": "success",
            "message": "Bill updated",
            "bill": build_bill_response(bill),
        }
    )
