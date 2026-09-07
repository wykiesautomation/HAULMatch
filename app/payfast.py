import os,hashlib,urllib.parse,json
from datetime import datetime
MODE=os.getenv('HAULMATCH_PAYFAST_MODE','disabled');MID=os.getenv('HAULMATCH_PAYFAST_MERCHANT_ID','');MKEY=os.getenv('HAULMATCH_PAYFAST_MERCHANT_KEY','');PASS=os.getenv('HAULMATCH_PAYFAST_PASSPHRASE','')
def checkout_url():return 'https://sandbox.payfast.co.za/eng/process' if MODE=='sandbox' else 'https://www.payfast.co.za/eng/process'
def configured():return MODE in ['sandbox','production'] and bool(MID and MKEY)
def signature(fields):
 parts=[]
 for k,v in fields.items():
  if k!='signature' and v not in [None,'']:parts.append(f"{k}={urllib.parse.quote_plus(str(v).strip())}")
 raw='&'.join(parts)+(('&passphrase='+urllib.parse.quote_plus(PASS)) if PASS else '')
 return hashlib.md5(raw.encode()).hexdigest()
def checkout_fields(order,pack):
 f={'merchant_id':MID,'merchant_key':MKEY,'return_url':os.getenv('HAULMATCH_PAYFAST_RETURN_URL',''),'cancel_url':os.getenv('HAULMATCH_PAYFAST_CANCEL_URL',''),'notify_url':os.getenv('HAULMATCH_PAYFAST_NOTIFY_URL',''),'m_payment_id':order.reference,'amount':f'{order.amount_cents/100:.2f}','item_name':f'HaulMatch {pack.name} - {pack.credits} credits'};f['signature']=signature(f);return f
def validate_itn(payload,order):
 if signature(payload)!=payload.get('signature'):return False,'Invalid signature'
 if payload.get('merchant_id')!=MID:return False,'Merchant mismatch'
 if payload.get('m_payment_id')!=order.reference:return False,'Reference mismatch'
 try:amount=int(round(float(payload.get('amount_gross','0'))*100))
 except:return False,'Invalid amount'
 if amount!=order.amount_cents:return False,'Amount mismatch'
 if payload.get('payment_status')!='COMPLETE':return False,'Payment not complete'
 return True,'Validated'
