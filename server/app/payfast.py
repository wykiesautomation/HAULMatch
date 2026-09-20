import hashlib
import urllib.parse
import httpx
from .config import settings

SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process"
LIVE_URL = "https://www.payfast.co.za/eng/process"
VALIDATE_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/query/validate"
VALIDATE_LIVE_URL = "https://www.payfast.co.za/eng/query/validate"

def mode():
    value = settings.payfast_mode.lower()
    return "live" if value in {"live", "production"} else value

def checkout_url():
    return LIVE_URL if mode() == "live" else SANDBOX_URL

def validation_url():
    return VALIDATE_LIVE_URL if mode() == "live" else VALIDATE_SANDBOX_URL

def configured():
    return mode() in {"sandbox", "live"} and bool(
        settings.payfast_merchant_id and settings.payfast_merchant_key
    )

def signature(fields):
    parts = []
    for key, value in fields.items():
        if key != "signature" and value not in [None, ""]:
            parts.append(f"{key}={urllib.parse.quote_plus(str(value).strip())}")
    raw = "&".join(parts)
    if settings.payfast_passphrase:
        raw += "&passphrase=" + urllib.parse.quote_plus(settings.payfast_passphrase)
    return hashlib.md5(raw.encode()).hexdigest()

def checkout_fields(order, pack):
    fields = {
        "merchant_id": settings.payfast_merchant_id,
        "merchant_key": settings.payfast_merchant_key,
        "return_url": settings.public_url + "/payments/return/",
        "cancel_url": settings.public_url + "/payments/cancel/",
        "notify_url": settings.public_url + "/api/payments/payfast/itn",
        "m_payment_id": order.reference,
        "amount": f"{order.amount_cents / 100:.2f}",
        "item_name": f"HaulMatch {pack.name} - {pack.credits} credits",
    }
    fields["signature"] = signature(fields)
    return fields

def validate_itn(payload, order):
    if not configured():
        return False, "PayFast is not configured"
    if signature(payload) != payload.get("signature"):
        return False, "Invalid signature"
    if payload.get("merchant_id") != settings.payfast_merchant_id:
        return False, "Merchant mismatch"
    if payload.get("m_payment_id") != order.reference:
        return False, "Reference mismatch"
    try:
        amount = int(round(float(payload.get("amount_gross", "0")) * 100))
    except Exception:
        return False, "Invalid amount"
    if amount != order.amount_cents:
        return False, "Amount mismatch"
    if payload.get("payment_status") != "COMPLETE":
        return False, "Payment not complete"
    return True, "Validated"

async def confirm_with_payfast(payload):
    encoded = urllib.parse.urlencode(
        [(k, v) for k, v in payload.items() if k != "signature"],
        quote_via=urllib.parse.quote_plus,
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            validation_url(),
            content=encoded,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    return response.status_code == 200 and response.text.strip().upper() == "VALID"
