import hashlib,urllib.parse,json
from .config import settings
def checkout_url():return 'https://sandbox.payfast.co.za/eng/process' if settings.payfast_mode=='sandbox' else 'https://www.payfast.co.za/eng/process'
def configured():return settings.payfast_mode in ['sandbox','production'] and bool(settings.payfast_merchant_id and settings.payfast_merchant_key)
def signature(fields):
 parts=[]
 for k,v in fields.items():
  if k!='signature' and v not in [None,'']:parts.append(f"{k}={urllib.parse.quote_plus(str(v).strip())}")
 raw='&'.join(parts)+(('&passphrase='+urllib.parse.quote_plus(settings.payfast_passphrase)) if settings.payfast_passphrase else '')
 return hashlib.md5(raw.encode()).hexdigest()
def checkout_fields(order,pack):
 f={'merchant_id':settings.payfast_merchant_id,'merchant_key':settings.payfast_merchant_key,'return_url':settings.public_url+'/payments/return/','cancel_url':settings.public_url+'/payments/cancel/','notify_url':settings.public_url+'/api/payments/payfast/itn','m_payment_id':order.reference,'amount':f'{order.amount_cents/100:.2f}','item_name':f'HaulMatch {pack.name} - {pack.credits} credits'};f['signature']=signature(f);return f
def validate_itn(payload,order):
 if signature(payload)!=payload.get('signature'):return False,'Invalid signature'
 if payload.get('merchant_id')!=settings.payfast_merchant_id:return False,'Merchant mismatch'
 if payload.get('m_payment_id')!=order.reference:return False,'Reference mismatch'
 try:amount=int(round(float(payload.get('amount_gross','0'))*100))
 except Exception:return False,'Invalid amount'
 if amount!=order.amount_cents:return False,'Amount mismatch'
 if payload.get('payment_status')!='COMPLETE':return False,'Payment not complete'
 return True,'Validated'
