import hashlib
import json
import random
from io import BytesIO
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import EmailMessage
from django.core.mail import send_mail
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone as django_timezone
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas

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


def build_invoice_attachment_html(bill):
    bill_data = build_bill_response(bill)
    grand_total_value = float(bill.grand_total or 0)
    gst_amount = f"{grand_total_value * 0.12:,.2f}"
    subtotal_amount = f"{float(bill.sub_total or 0):,.2f}"
    grand_total_amount = f"{grand_total_value:,.2f}"
    item_rows = "".join(
        f"""
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">{item['qty']}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;">{item['description']}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs. {float(item['rate'] or 0):,.2f}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">Rs. {float(item['amount'] or 0):,.2f}</td>
        </tr>
        """
        for item in bill_data["items"]
    )

    return f"""
    <html>
      <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="background:#ffffff;max-width:900px;margin:0 auto;padding:48px;min-height:1122px;position:relative;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
            <div>
              <h1 style="margin:0;color:#dc2626;font-size:42px;font-weight:900;letter-spacing:1px;">ANAND INFOTECH</h1>
              <p style="margin:8px 0 0;font-size:15px;font-weight:600;color:#374151;">All Sales &amp; Services</p>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
                19/3, Jayalakshmi Nagar, 2nd Street,<br/>
                Mannarai Post, Tirupur - 641 607.
              </p>
              <div style="margin-top:12px;font-size:14px;line-height:1.8;color:#4b5563;">
                <div><strong style="color:#111827;">Phone:</strong> 89037 97913 / 63837 88930</div>
                <div><strong style="color:#111827;">Email:</strong> anandinfo6383@gmail.com</div>
              </div>
            </div>

            <div style="width:96px;height:96px;background:#2b2b2b;border-radius:9999px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid #fef2f2;">
              <div style="display:flex;gap:4px;">
                <span style="width:8px;height:8px;border-radius:9999px;background:#dc2626;display:block;"></span>
                <span style="width:8px;height:8px;border-radius:9999px;background:#dc2626;display:block;"></span>
                <span style="width:8px;height:8px;border-radius:9999px;background:#dc2626;display:block;"></span>
              </div>
              <div style="display:flex;gap:4px;margin-top:4px;">
                <span style="width:8px;height:8px;border-radius:9999px;background:#dc2626;display:block;"></span>
                <span style="width:8px;height:8px;border-radius:9999px;background:#dc2626;display:block;"></span>
              </div>
            </div>
          </div>

          <div style="display:table;width:100%;margin-bottom:40px;font-size:14px;table-layout:fixed;">
            <div style="display:table-cell;vertical-align:top;padding-right:16px;">
              <h3 style="margin:0 0 8px;color:#dc2626;border-bottom:1px solid #fee2e2;padding-bottom:6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Bill To</h3>
              <p style="margin:0;font-weight:600;">{bill.client_name}</p>
              <p style="margin:8px 0 0;color:#6b7280;line-height:1.6;">{bill.client_address or "Client Address Here"}</p>
            </div>
            <div style="display:table-cell;vertical-align:top;padding:0 16px;">
              <h3 style="margin:0 0 8px;color:#dc2626;border-bottom:1px solid #fee2e2;padding-bottom:6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ship To</h3>
              <p style="margin:0;font-weight:600;">{bill.client_name}</p>
              <p style="margin:8px 0 0;color:#6b7280;line-height:1.6;">{bill.client_address or "Shipping Address Here"}</p>
            </div>
            <div style="display:table-cell;vertical-align:top;text-align:right;line-height:1.8;padding-left:16px;">
              <div><strong style="color:#111827;">Invoice #</strong> <span style="color:#dc2626;font-weight:600;">{bill.bill_no}</span></div>
              <div><strong style="color:#111827;">Invoice Date</strong> {bill_data['bill_date']}</div>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:40px;">
            <thead>
              <tr style="background:#2b2b2b;color:#ffffff;">
                <th style="padding:14px;text-align:left;">Qty</th>
                <th style="padding:14px;text-align:left;">Description</th>
                <th style="padding:14px;text-align:right;">Unit Price</th>
                <th style="padding:14px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              {item_rows}
            </tbody>
          </table>

          <div style="display:table;width:100%;margin-top:40px;">
            <div style="display:table-cell;vertical-align:bottom;font-size:14px;padding-right:24px;">
              <h4 style="margin:0 0 8px;color:#dc2626;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Terms &amp; Conditions</h4>
              <p style="margin:0;color:#6b7280;">Payment is due within 15 days of invoice date.</p>
              <div style="margin-top:24px;font-size:12px;color:#4b5563;background:#f9fafb;padding:16px;border-radius:12px;border:1px solid #f3f4f6;">
                <p style="margin:0 0 8px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Bank Details</p>
                <p style="margin:4px 0;">Bank Name: State Bank of India</p>
                <p style="margin:4px 0;">Account Number: 12345678</p>
                <p style="margin:4px 0;">IFSC Code: SBIN0000000</p>
              </div>
            </div>

            <div style="display:table-cell;vertical-align:bottom;width:34%;text-align:right;">
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding-bottom:8px;font-size:14px;">
                <span style="color:#4b5563;font-weight:500;">Subtotal</span>
                <span>Rs. {subtotal_amount}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;color:#6b7280;">
                <span>GST 12.0%</span>
                <span>Rs. {gst_amount}</span>
              </div>
              <div style="display:flex;justify-content:space-between;border-top:2px solid #dc2626;padding-top:12px;color:#dc2626;font-weight:900;font-size:24px;">
                <span>Total</span>
                <span>Rs. {grand_total_amount}</span>
              </div>
              <div style="padding-top:64px;">
                <p style="margin:0;font-weight:700;font-size:18px;text-transform:uppercase;letter-spacing:0.04em;color:#1f2937;">Ananthan.V</p>
                <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Sales &amp; Service</p>
                <div style="height:2px;background:#2b2b2b;width:160px;margin:8px 0 0 auto;"></div>
                <p style="margin:6px 0 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#9ca3af;">Authorized Signatory</p>
              </div>
            </div>
          </div>

          <div style="position:absolute;right:-64px;bottom:-64px;width:320px;height:320px;background:#ef4444;border-radius:9999px;opacity:0.1;filter:blur(48px);"></div>
          <div style="position:absolute;left:0;bottom:0;width:100%;height:64px;background:#2b2b2b;clip-path:polygon(0 40%, 100% 0, 100% 100%, 0 100%);">
            <div style="position:absolute;left:0;bottom:0;width:100%;height:32px;background:#dc2626;clip-path:polygon(0 60%, 100% 0, 100% 100%, 0 100%);"></div>
          </div>
        </div>
      </body>
    </html>
    """


def draw_wrapped_text(pdf, text, x, y, max_width, font_name="Helvetica", font_size=10, line_gap=4, fill_color=None):
    lines = simpleSplit(str(text or ""), font_name, font_size, max_width)
    pdf.setFont(font_name, font_size)
    if fill_color is not None:
        pdf.setFillColor(fill_color)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= font_size + line_gap
    return y


def build_invoice_pdf_bytes(bill):
    bill_data = build_bill_response(bill)
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    red = colors.HexColor("#dc2626")
    dark = colors.HexColor("#2b2b2b")
    gray = colors.HexColor("#6b7280")
    light_gray = colors.HexColor("#e5e7eb")
    soft_red = colors.HexColor("#fee2e2")
    page_bg = colors.HexColor("#f8fafc")

    pdf.setTitle(f"Invoice {bill.bill_no}")

    pdf.setFillColor(page_bg)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    card_margin = 26
    pdf.setFillColor(colors.white)
    pdf.rect(card_margin, card_margin, width - (card_margin * 2), height - (card_margin * 2), fill=1, stroke=0)

    left = 62
    right = width - 62
    y = height - 78

    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 25)
    pdf.drawString(left, y, "ANAND INFOTECH")
    pdf.setFillColor(dark)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(left, y - 18, "All Sales & Services")
    pdf.setFont("Helvetica", 8.5)
    pdf.setFillColor(gray)
    pdf.drawString(left, y - 33, "19/3, Jayalakshmi Nagar, 2nd Street,")
    pdf.drawString(left, y - 45, "Mannarai Post, Tirupur - 641 607.")
    pdf.drawString(left, y - 58, "Phone: 89037 97913 | 63837 88930")
    pdf.drawString(left, y - 70, "Email: anandinfo6383@gmail.com")

    logo_x = right - 58
    logo_y = y + 6
    pdf.setFillColor(dark)
    pdf.circle(logo_x, logo_y - 22, 22, fill=1, stroke=0)
    pdf.setFillColor(red)
    for dot_x, dot_y in [
        (logo_x - 8, logo_y - 18),
        (logo_x, logo_y - 18),
        (logo_x + 8, logo_y - 18),
        (logo_x - 4, logo_y - 26),
        (logo_x + 4, logo_y - 26),
    ]:
        pdf.circle(dot_x, dot_y, 2.2, fill=1, stroke=0)

    y -= 105
    col_gap = 18
    info_width = 118
    section_width = ((right - left) - info_width - (col_gap * 2)) / 2
    bill_to_x = left
    ship_to_x = bill_to_x + section_width + col_gap
    info_x = ship_to_x + section_width + col_gap

    for section_x, title in [(bill_to_x, "Bill To"), (ship_to_x, "Ship To")]:
        pdf.setFillColor(red)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(section_x, y, title.upper())
        pdf.setStrokeColor(soft_red)
        pdf.setLineWidth(1)
        pdf.line(section_x, y - 4, section_x + section_width - 8, y - 4)
        pdf.setFillColor(dark)
        pdf.setFont("Helvetica-Bold", 9.5)
        pdf.drawString(section_x, y - 18, bill.client_name or "")
        draw_wrapped_text(
            pdf,
            bill.client_address or ("Shipping Address Here" if title == "Ship To" else "Client Address Here"),
            section_x,
            y - 30,
            section_width - 8,
            font_name="Helvetica",
            font_size=8,
            fill_color=gray,
        )

    pdf.setFillColor(dark)
    pdf.setFont("Helvetica-Bold", 8.5)
    pdf.drawRightString(right, y - 2, f"Invoice # {bill.bill_no}")
    pdf.drawRightString(right, y - 16, f"Invoice Date {bill_data['bill_date']}")
    pdf.drawRightString(right, y - 30, f"Payment Type {bill.payment_type or '-'}")

    y -= 72
    table_top = y
    qty_col = left + 34
    desc_col = left + 255
    rate_col = right - 98
    amount_col = right

    pdf.setFillColor(dark)
    pdf.rect(left, table_top - 20, right - left, 20, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(left + 8, table_top - 13, "Qty")
    pdf.drawString(qty_col + 8, table_top - 13, "Description")
    pdf.drawRightString(rate_col - 8, table_top - 13, "Unit Price")
    pdf.drawRightString(amount_col - 8, table_top - 13, "Amount")

    y = table_top - 30
    items = bill_data["items"] or []
    if not items:
        items = [{"qty": "-", "description": "No items", "rate": "0", "amount": "0"}]

    for item in items:
        description_lines = simpleSplit(str(item["description"] or ""), "Helvetica", 8.5, desc_col - qty_col - 16)
        row_height = max(22, 14 + (len(description_lines) - 1) * 10)

        if y - row_height < 130:
            pdf.showPage()
            pdf.setFillColor(page_bg)
            pdf.rect(0, 0, width, height, fill=1, stroke=0)
            pdf.setFillColor(colors.white)
            pdf.rect(card_margin, card_margin, width - (card_margin * 2), height - (card_margin * 2), fill=1, stroke=0)
            y = height - 80

        pdf.setStrokeColor(light_gray)
        pdf.line(left, y - row_height + 4, right, y - row_height + 4)
        pdf.setFillColor(dark)
        pdf.setFont("Helvetica", 8.5)
        pdf.drawString(left + 8, y - 10, str(item["qty"]))
        current_y = y - 10
        for line in description_lines:
            pdf.drawString(qty_col + 8, current_y, line)
            current_y -= 10
        pdf.drawRightString(rate_col - 8, y - 10, f"Rs. {float(item['rate'] or 0):,.2f}")
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawRightString(amount_col - 8, y - 10, f"Rs. {float(item['amount'] or 0):,.2f}")
        y -= row_height

    terms_y = y - 26
    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(left, terms_y, "TERMS & CONDITIONS")
    pdf.setFillColor(gray)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(left, terms_y - 14, "Payment is due within 15 days of invoice date.")

    box_y = terms_y - 62
    pdf.setFillColor(colors.HexColor("#f9fafb"))
    pdf.roundRect(left, box_y, 170, 48, 6, fill=1, stroke=0)
    pdf.setFillColor(dark)
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawString(left + 10, box_y + 35, "Bank Details")
    pdf.setFont("Helvetica", 6.7)
    pdf.drawString(left + 10, box_y + 24, "Bank Name: State Bank of India")
    pdf.drawString(left + 10, box_y + 14, "Account Number: 12345678")
    pdf.drawString(left + 10, box_y + 4, "IFSC Code: SBIN0000000")

    summary_x = right - 162
    subtotal_amount = float(bill.sub_total or 0)
    grand_total_amount = float(bill.grand_total or 0)
    gst_amount = grand_total_amount * 0.12

    pdf.setFillColor(gray)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(summary_x, terms_y, "Subtotal")
    pdf.setFillColor(dark)
    pdf.drawRightString(right, terms_y, f"Rs. {subtotal_amount:,.2f}")
    pdf.setStrokeColor(light_gray)
    pdf.line(summary_x, terms_y - 6, right, terms_y - 6)

    pdf.setFillColor(gray)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(summary_x, terms_y - 18, "GST 12.0%")
    pdf.drawRightString(right, terms_y - 18, f"Rs. {gst_amount:,.2f}")

    pdf.setStrokeColor(red)
    pdf.setLineWidth(2)
    pdf.line(summary_x, terms_y - 28, right, terms_y - 28)
    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(summary_x, terms_y - 46, "Total")
    pdf.drawRightString(right, terms_y - 46, f"Rs. {grand_total_amount:,.2f}")

    signature_y = box_y - 6
    pdf.setFillColor(dark)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawRightString(right, signature_y, "Ananthan.V")
    pdf.setFillColor(gray)
    pdf.setFont("Helvetica", 6.8)
    pdf.drawRightString(right, signature_y - 10, "Sales & Service")
    pdf.setStrokeColor(dark)
    pdf.setLineWidth(1)
    pdf.line(right - 86, signature_y - 16, right, signature_y - 16)
    pdf.setFillColor(colors.HexColor("#9ca3af"))
    pdf.setFont("Helvetica-Bold", 5.8)
    pdf.drawRightString(right, signature_y - 24, "AUTHORIZED SIGNATORY")

    pdf.setFillColor(colors.HexColor("#ef4444"))
    pdf.circle(width - 24, 16, 52, fill=1, stroke=0)
    pdf.setFillColor(dark)
    pdf.circle(width / 2, 6, 210, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.circle(width / 2, 26, 220, fill=1, stroke=0)
    pdf.setFillColor(red)
    pdf.circle(width / 2, -2, 205, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.circle(width / 2, 12, 215, fill=1, stroke=0)

    pdf.save()
    return buffer.getvalue()


def send_invoice_email(bill):
    if not bill.client_email:
        return {"sent": False, "message": "Client email not provided"}

    bill_data = build_bill_response(bill)
    item_lines = []
    for index, item in enumerate(bill_data["items"], start=1):
        item_lines.append(
            f"{index}. {item['description']} | Qty: {item['qty']} | Rate: {item['rate']} | Amount: {item['amount']}"
        )

    message = (
        f"Hello {bill.client_name},\n\n"
        f"Your invoice has been generated successfully.\n\n"
        f"Invoice No: {bill.bill_no}\n"
        f"Invoice Date: {bill_data['bill_date']}\n"
        f"Payment Type: {bill.payment_type}\n"
        f"Subtotal: {bill_data['sub_total']}\n"
        f"Grand Total: {bill_data['grand_total']}\n"
        f"Amount in Words: {bill.amount_words}\n\n"
        f"Items:\n" + "\n".join(item_lines) + "\n\n"
        "Thank you for choosing Anand InfoTech."
    )
    invoice_pdf = build_invoice_pdf_bytes(bill)

    email = EmailMessage(
        subject=f"Invoice {bill.bill_no} from Anand InfoTech",
        body=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[bill.client_email],
    )
    email.attach(
        filename=f"invoice_{bill.bill_no}.pdf",
        content=invoice_pdf,
        mimetype="application/pdf",
    )
    email.send(fail_silently=False)

    return {"sent": True, "message": f"Invoice PDF sent to {bill.client_email}"}


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

            email_status = {"sent": False, "message": "Client email not provided"}
            if bill.client_email:
                try:
                    email_status = send_invoice_email(bill)
                except Exception as email_exc:
                    email_status = {"sent": False, "message": f"Invoice email failed: {str(email_exc)}"}

            return JsonResponse(
                {
                    "status": "success",
                    "message": "Bill created",
                    "bill": build_bill_response(bill),
                    "email_status": email_status,
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

    with transaction.atomic():
        deleted_items_count, _ = Billitem.objects.filter(bill=bill).delete()
        deleted_bill_count, _ = TrsBills.objects.filter(bill_no=bill_no).delete()

    if deleted_bill_count == 0:
        return JsonResponse({"status": "error", "message": "Bill delete failed"}, status=500)

    return JsonResponse(
        {
            "status": "success",
            "message": "Bill deleted",
            "deleted_bill_count": deleted_bill_count,
            "deleted_items_count": deleted_items_count,
        }
    )


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
