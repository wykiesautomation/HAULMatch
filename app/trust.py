import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta
from email_validator import validate_email, EmailNotValidError

DISPOSABLE_DOMAINS={
 '10minutemail.com','guerrillamail.com','mailinator.com','tempmail.com',
 'temp-mail.org','yopmail.com','throwawaymail.com','sharklasers.com'
}
PHONE_RE=re.compile(r'\D+')

def normalise_email(value:str):
 try:
  info=validate_email(value,check_deliverability=False)
 except EmailNotValidError as exc:
  raise ValueError(str(exc)) from exc
 email=info.normalized
 domain=email.rsplit('@',1)[1].lower()
 if domain in DISPOSABLE_DOMAINS:raise ValueError('Temporary or disposable email addresses are not allowed')
 return email

def normalise_sa_phone(value:str):
 digits=PHONE_RE.sub('',value or '')
 if digits.startswith('00'):digits=digits[2:]
 if digits.startswith('27') and len(digits)==11:return '+'+digits
 if digits.startswith('0') and len(digits)==10:return '+27'+digits[1:]
 raise ValueError('Enter a valid South African mobile number')

def token_hash(value:str):return hashlib.sha256(value.encode()).hexdigest()
def secure_token():return secrets.token_urlsafe(32)
def otp_code():return f'{secrets.randbelow(1000000):06d}'
def otp_hash(code:str,salt:str):return hashlib.pbkdf2_hmac('sha256',code.encode(),salt.encode(),120000).hex()
def verify_otp(code:str,salt:str,expected:str):return hmac.compare_digest(otp_hash(code,salt),expected)
def expires(minutes:int):return datetime.utcnow()+timedelta(minutes=minutes)
def trust_level(user):
 if user.identity_verified_at and user.business_verified_at:return 'BUSINESS_VERIFIED'
 if user.identity_verified_at:return 'IDENTITY_VERIFIED'
 if user.email_verified_at and user.phone_verified_at:return 'CONTACT_VERIFIED'
 if user.email_verified_at:return 'EMAIL_VERIFIED'
 return 'UNVERIFIED'
