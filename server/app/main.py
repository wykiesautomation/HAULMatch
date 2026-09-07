from pathlib import Path
from uuid import uuid4
from datetime import datetime
import json,hashlib
from fastapi import FastAPI,Depends,HTTPException,Request,UploadFile,File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware
from .config import settings
from .database import Base,engine,db,SessionLocal
from .models import Account,Lead,Quote,Audit,CreditPack,PaymentOrder,PaymentNotification,WalletTransaction,LeadUnlock,ContactReveal,Dispute,Receipt,Vehicle,Driver,Job,JobEvent,Incident,Evidence,POD,Rating,BackupVerification
from .security import hash_password,verify_password,normalise_email,normalise_phone,token,current,roles
from .storage import save
from .payfast import configured as payfast_configured,checkout_url,checkout_fields,validate_itn
from .commerce import post_ledger,audit
from .operations import validate_assignment,next_state
errors=settings.validate()
if errors:raise RuntimeError('Production configuration invalid: '+'; '.join(errors))
app=FastAPI(title='HaulMatch 360',version='Batch D',docs_url=None if settings.env=='production' else '/docs')
app.add_middleware(TrustedHostMiddleware,allowed_hosts=list(settings.allowed_hosts))
site=Path('/app/site')
app.mount('/assets',StaticFiles(directory=site/'assets'),name='assets')
@app.on_event('startup')
def startup():
 Base.metadata.create_all(engine)
 s=SessionLocal()
 for code,name,credits,cents,order in [('STARTER','Starter',10,30000,1),('GROWTH','Growth',25,67500,2),('FLEET','Fleet',50,120000,3)]:
  if not s.query(CreditPack).filter_by(code=code).first():s.add(CreditPack(code=code,name=name,credits=credits,price_cents=cents,sort_order=order))
 s.commit();s.close()
@app.middleware('http')
async def headers(request:Request,call_next):
 response=await call_next(request);response.headers['X-Content-Type-Options']='nosniff';response.headers['X-Frame-Options']='DENY';response.headers['Referrer-Policy']='strict-origin-when-cross-origin';response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=(self)';response.headers['Content-Security-Policy']="default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'";return response
@app.get('/health/live')
def live():return {'status':'ok','service':'haulmatch-360','release':'Batch D'}
@app.get('/health/ready')
def ready(s=Depends(db)):
 try:s.execute(__import__('sqlalchemy').text('SELECT 1'));return {'status':'ok','database':'up'}
 except Exception:raise HTTPException(503,'Database unavailable')
@app.post('/api/accounts/register')
def register(x:dict,s=Depends(db)):
 email=normalise_email(x.get('email'));phone=normalise_phone(x.get('phone'));role=x.get('role')
 if role not in ['customer','transporter']:raise HTTPException(400,'Invalid role')
 if len(x.get('password',''))<10:raise HTTPException(400,'Password must contain at least 10 characters')
 if s.query(Account).filter((Account.email==email)|(Account.phone==phone)).first():raise HTTPException(409,'Account cannot be created')
 a=Account(email=email,phone=phone,full_name=x.get('full_name','').strip(),company=x.get('company','').strip(),role=role,password_hash=hash_password(x['password']));s.add(a);s.flush();s.add(Audit(event='ACCOUNT_REGISTERED',actor_id=a.id,detail=role));s.commit();return {'token':token(a),'role':role}
@app.post('/api/accounts/login')
def login(x:dict,s=Depends(db)):
 a=s.query(Account).filter_by(email=normalise_email(x.get('email'))).first()
 if not a or not verify_password(x.get('password',''),a.password_hash):raise HTTPException(401,'Invalid login')
 return {'token':token(a),'role':a.role}
@app.post('/api/leads')
def create_lead(x:dict,a=Depends(roles('customer','admin')),s=Depends(db)):
 ref='HM-'+uuid4().hex[:10].upper();lead=Lead(reference=ref,owner_id=a.id,transport_type=x.get('transport_type'),description=x.get('description'),collection_area=x.get('collection_area'),delivery_area=x.get('delivery_area'),required_date=x.get('required_date'),mass=x.get('mass'),dimensions=x.get('dimensions'),private_json=json.dumps(x.get('private',{})));s.add(lead);s.add(Audit(event='LEAD_CREATED',actor_id=a.id,reference=ref));s.commit();return {'reference':ref,'status':'NEW'}
@app.get('/api/marketplace')
def marketplace(s=Depends(db)):
 rows=s.query(Lead).filter_by(status='PUBLISHED',moderation_status='CLEARED').all();return [{'reference':x.reference,'transport_type':x.transport_type,'description':x.description,'collection_area':x.collection_area,'delivery_area':x.delivery_area,'required_date':x.required_date,'mass':x.mass,'dimensions':x.dimensions} for x in rows]
@app.get('/api/leads/{reference}')
def lead_status(reference:str,a=Depends(current),s=Depends(db)):
 x=s.query(Lead).filter_by(reference=reference).first()
 if not x or a.role!='admin' and a.id!=x.owner_id:raise HTTPException(404,'Request not found')
 return {'reference':x.reference,'status':x.status,'moderation_status':x.moderation_status,'risk_score':x.risk_score}
@app.post('/api/leads/{reference}/publish')
def publish(reference:str,a=Depends(roles('admin')),s=Depends(db)):
 x=s.query(Lead).filter_by(reference=reference).first()
 if not x:raise HTTPException(404,'Request not found')
 if x.risk_score>=75 or x.moderation_status=='BLOCKED':raise HTTPException(400,'Clear moderation before publishing')
 x.status='PUBLISHED';x.moderation_status='CLEARED';x.updated_at=datetime.utcnow();s.add(Audit(event='LEAD_PUBLISHED',actor_id=a.id,reference=reference));s.commit();return {'status':'PUBLISHED'}
@app.post('/api/leads/{reference}/quotes')
def quote(reference:str,x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 lead=s.query(Lead).filter_by(reference=reference,status='PUBLISHED',moderation_status='CLEARED').first()
 if not lead:raise HTTPException(404,'Opportunity unavailable')
 if s.query(Quote).filter_by(lead_id=lead.id,transporter_id=a.id).first():raise HTTPException(409,'Quote already submitted')
 q=Quote(reference='HMQ-'+uuid4().hex[:10].upper(),lead_id=lead.id,transporter_id=a.id,amount_cents=int(round(float(x.get('amount',0))*100)),vehicle=x.get('vehicle'),terms=x.get('terms'));s.add(q);s.add(Audit(event='QUOTE_SUBMITTED',actor_id=a.id,reference=q.reference,detail=reference));s.commit();return {'reference':q.reference,'status':'SUBMITTED'}

@app.get('/api/credit-packs')
def credit_packs(s=Depends(db)):return [{'id':p.id,'code':p.code,'name':p.name,'credits':p.credits,'price_cents':p.price_cents,'currency':'ZAR'} for p in s.query(CreditPack).filter_by(active=True).order_by(CreditPack.sort_order)]
@app.post('/api/payments/payfast/checkout')
def payment_checkout(x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 pack=s.get(CreditPack,int(x.get('pack_id',0)))
 if not pack or not pack.active:raise HTTPException(404,'Credit pack unavailable')
 order=PaymentOrder(reference='HMP-'+uuid4().hex[:14].upper(),account_id=a.id,pack_id=pack.id,credits=pack.credits,amount_cents=pack.price_cents,status='CHECKOUT_READY');s.add(order);s.flush();audit(s,'PAYMENT_CREATED',a.id,order.reference,pack.code);s.commit()
 if not payfast_configured():return {'configured':False,'reference':order.reference,'status':order.status}
 return {'configured':True,'reference':order.reference,'checkout_url':checkout_url(),'fields':checkout_fields(order,pack)}
@app.post('/api/payments/payfast/itn')
async def payment_itn(request:Request,s=Depends(db)):
 form=dict(await request.form());raw=json.dumps(form,sort_keys=True);digest=hashlib.sha256(raw.encode()).hexdigest()
 if s.query(PaymentNotification).filter_by(notification_hash=digest).first():return {'status':'duplicate'}
 order=s.query(PaymentOrder).filter_by(reference=form.get('m_payment_id')).first()
 if not order:s.add(PaymentNotification(notification_hash=digest,valid=False,reason='Unknown reference',payload_json=raw));s.commit();raise HTTPException(400,'Unknown payment')
 valid,reason=validate_itn(form,order);s.add(PaymentNotification(notification_hash=digest,payment_id=order.id,valid=valid,reason=reason,payload_json=raw))
 if not valid:order.status='INVALID';audit(s,'PAYMENT_REJECTED',None,order.reference,reason);s.commit();raise HTTPException(400,reason)
 if not order.credited:
  account=s.get(Account,order.account_id);post_ledger(s,account,order.credits,'credit','PURCHASE_CREDIT','PayFast '+order.reference,payment_id=order.id);order.credited=True;order.status='COMPLETE';order.completed_at=datetime.utcnow();receipt=Receipt(reference='HMR-'+uuid4().hex[:12].upper(),account_id=account.id,payment_id=order.id,description=f'{order.credits} HaulMatch credits',amount_cents=order.amount_cents);s.add(receipt);audit(s,'WALLET_CREDITED',None,order.reference,str(order.credits))
 s.commit();return {'status':'ok'}
@app.get('/api/wallet')
def wallet(a=Depends(current),s=Depends(db)):return {'credits':a.credit_balance,'transactions':[{'id':x.id,'direction':x.direction,'credits':x.credits,'before':x.balance_before,'after':x.balance_after,'type':x.transaction_type,'reason':x.reason,'created_at':x.created_at.isoformat()} for x in s.query(WalletTransaction).filter_by(account_id=a.id).order_by(WalletTransaction.id.desc()).limit(200)]}
@app.get('/api/receipts')
def receipts(a=Depends(current),s=Depends(db)):return [{'reference':x.reference,'description':x.description,'amount_cents':x.amount_cents,'created_at':x.created_at.isoformat()} for x in s.query(Receipt).filter_by(account_id=a.id).order_by(Receipt.id.desc())]
@app.post('/api/leads/{reference}/unlock')
def unlock_lead(reference:str,a=Depends(roles('transporter')),s=Depends(db)):
 if not a.approved:raise HTTPException(403,'Approved transporter required')
 lead=s.query(Lead).filter_by(reference=reference,status='PUBLISHED',moderation_status='CLEARED').first()
 if not lead:raise HTTPException(404,'Opportunity unavailable')
 existing=s.query(LeadUnlock).filter_by(lead_id=lead.id,transporter_id=a.id).first()
 if not existing:
  cost=3
  try:post_ledger(s,a,cost,'debit','LEAD_UNLOCK','Unlock '+reference,lead_id=lead.id)
  except ValueError:raise HTTPException(400,'Insufficient credits')
  existing=LeadUnlock(lead_id=lead.id,transporter_id=a.id,credits_used=cost);s.add(existing);audit(s,'LEAD_UNLOCKED',a.id,reference,str(cost));s.commit()
 return {'unlocked':True,'credits':a.credit_balance,'contact_released':False}
@app.post('/api/quotes/{quote_reference}/award')
def award_quote(quote_reference:str,a=Depends(roles('customer','admin')),s=Depends(db)):
 q=s.query(Quote).filter_by(reference=quote_reference).first();lead=s.get(Lead,q.lead_id) if q else None
 if not lead or a.role!='admin' and lead.owner_id!=a.id:raise HTTPException(404,'Quote not found')
 if lead.awarded_quote_id:raise HTTPException(409,'A quote has already been awarded')
 q.status='AWARDED';lead.awarded_quote_id=q.id;lead.status='AWARDED';lead.updated_at=datetime.utcnow()
 for other in s.query(Quote).filter(Quote.lead_id==lead.id,Quote.id!=q.id).all():other.status='NOT SELECTED'
 job=Job(reference='HMJ-'+uuid4().hex[:12].upper(),lead_id=lead.id,customer_id=lead.owner_id,transporter_id=q.transporter_id,status='AWARDED');s.add(job);s.flush();s.add(JobEvent(job_id=job.id,event_type='AWARDED',note='Quote awarded',actor_id=a.id));audit(s,'QUOTE_AWARDED',a.id,q.reference,lead.reference);s.commit();return {'status':'AWARDED','lead_reference':lead.reference,'job_reference':job.reference}
@app.get('/api/leads/{reference}/contact')
def awarded_contact(reference:str,a=Depends(current),s=Depends(db)):
 lead=s.query(Lead).filter_by(reference=reference).first()
 if not lead or not lead.awarded_quote_id:raise HTTPException(404,'Contact unavailable')
 q=s.get(Quote,lead.awarded_quote_id)
 if a.role!='admin' and a.id not in [lead.owner_id,q.transporter_id]:raise HTTPException(403,'Contact remains hidden')
 reveal=s.query(ContactReveal).filter_by(lead_id=lead.id,revealed_to=a.id).first()
 if not reveal:s.add(ContactReveal(lead_id=lead.id,revealed_to=a.id,reason='AWARDED_JOB'));audit(s,'CONTACT_REVEALED',a.id,reference,'awarded only');s.commit()
 customer=s.get(Account,lead.owner_id);private=json.loads(lead.private_json or '{}')
 return {'customer_name':customer.full_name,'customer_email':customer.email,'customer_mobile':customer.phone,'collection_address':private.get('collection_address'),'delivery_address':private.get('delivery_address')}
@app.post('/api/unlocks/{unlock_id}/disputes')
def open_dispute(unlock_id:int,x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 unlock=s.get(LeadUnlock,unlock_id)
 if not unlock or unlock.transporter_id!=a.id:raise HTTPException(404,'Unlock not found')
 if s.query(Dispute).filter_by(unlock_id=unlock_id).first():raise HTTPException(409,'Dispute already exists')
 d=Dispute(reference='HMD-'+uuid4().hex[:12].upper(),unlock_id=unlock.id,opened_by=a.id,reason_code=x.get('reason_code'),description=x.get('description'));s.add(d);audit(s,'DISPUTE_OPENED',a.id,d.reference,lead_ref(s,unlock.lead_id));s.commit();return {'reference':d.reference,'status':'OPEN'}
def lead_ref(s,lead_id):
 lead=s.get(Lead,lead_id);return lead.reference if lead else ''
@app.post('/api/admin/disputes/{reference}/decision')
def dispute_decision(reference:str,x:dict,a=Depends(roles('admin')),s=Depends(db)):
 d=s.query(Dispute).filter_by(reference=reference).first()
 if not d or d.status in ['APPROVED','REJECTED','CLOSED']:raise HTTPException(400,'Dispute unavailable')
 status=x.get('status')
 if status not in ['APPROVED','REJECTED']:raise HTTPException(400,'Invalid decision')
 d.status=status;d.decision_note=x.get('note','')
 if status=='APPROVED':
  unlock=s.get(LeadUnlock,d.unlock_id);account=s.get(Account,unlock.transporter_id);credits=min(int(x.get('refund_credits',unlock.credits_used)),unlock.credits_used);post_ledger(s,account,credits,'credit','BAD_LEAD_REFUND','Approved dispute',dispute_id=d.id,created_by=a.id);d.refund_credits=credits
 audit(s,'DISPUTE_'+status,a.id,d.reference,d.decision_note);s.commit();return {'status':status,'refund_credits':d.refund_credits}


@app.post('/api/vehicles')
def create_vehicle(x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 v=Vehicle(owner_id=a.id,registration=str(x.get('registration','')).strip().upper(),vehicle_type=x.get('vehicle_type'),payload_kg=int(x.get('payload_kg') or 0),licence_expiry=x.get('licence_expiry'),roadworthy_expiry=x.get('roadworthy_expiry'),insurance_expiry=x.get('insurance_expiry'),verified=False);s.add(v);audit(s,'VEHICLE_CREATED',a.id,v.registration,v.vehicle_type or '');s.commit();return {'id':v.id,'status':v.status,'verified':v.verified}
@app.get('/api/vehicles')
def list_vehicles(a=Depends(roles('transporter')),s=Depends(db)):return [{'id':v.id,'registration':v.registration,'vehicle_type':v.vehicle_type,'payload_kg':v.payload_kg,'status':v.status,'verified':v.verified,'licence_expiry':v.licence_expiry,'roadworthy_expiry':v.roadworthy_expiry,'insurance_expiry':v.insurance_expiry} for v in s.query(Vehicle).filter_by(owner_id=a.id).all()]
@app.post('/api/drivers')
def create_driver(x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 d=Driver(owner_id=a.id,full_name=x.get('full_name'),phone=normalise_phone(x.get('phone')),licence_number=x.get('licence_number'),licence_class=x.get('licence_class'),licence_expiry=x.get('licence_expiry'),prdp_number=x.get('prdp_number'),prdp_expiry=x.get('prdp_expiry'),verified=False);s.add(d);audit(s,'DRIVER_CREATED',a.id,d.licence_number,d.full_name or '');s.commit();return {'id':d.id,'status':d.status,'verified':d.verified}
@app.get('/api/drivers')
def list_drivers(a=Depends(roles('transporter')),s=Depends(db)):return [{'id':d.id,'full_name':d.full_name,'licence_class':d.licence_class,'status':d.status,'verified':d.verified,'licence_expiry':d.licence_expiry,'prdp_expiry':d.prdp_expiry} for d in s.query(Driver).filter_by(owner_id=a.id).all()]
@app.post('/api/admin/vehicles/{vehicle_id}/verify')
def verify_vehicle(vehicle_id:int,x:dict,a=Depends(roles('admin')),s=Depends(db)):
 v=s.get(Vehicle,vehicle_id)
 if not v:raise HTTPException(404,'Vehicle not found')
 v.verified=bool(x.get('approved'));v.status='AVAILABLE' if v.verified else 'REVIEW REQUIRED';audit(s,'VEHICLE_VERIFICATION',a.id,v.registration,str(v.verified));s.commit();return {'verified':v.verified}
@app.post('/api/admin/drivers/{driver_id}/verify')
def verify_driver(driver_id:int,x:dict,a=Depends(roles('admin')),s=Depends(db)):
 d=s.get(Driver,driver_id)
 if not d:raise HTTPException(404,'Driver not found')
 d.verified=bool(x.get('approved'));d.status='AVAILABLE' if d.verified else 'REVIEW REQUIRED';audit(s,'DRIVER_VERIFICATION',a.id,d.licence_number,str(d.verified));s.commit();return {'verified':d.verified}
@app.get('/api/jobs')
def list_jobs(a=Depends(current),s=Depends(db)):
 query=s.query(Job)
 if a.role=='customer':query=query.filter_by(customer_id=a.id)
 elif a.role=='transporter':query=query.filter_by(transporter_id=a.id)
 return [{'reference':j.reference,'status':j.status,'vehicle_id':j.vehicle_id,'driver_id':j.driver_id,'customer_confirmed':j.customer_confirmed,'events':[{'event':e.event_type,'note':e.note,'created_at':e.created_at.isoformat()} for e in s.query(JobEvent).filter_by(job_id=j.id).order_by(JobEvent.id)]} for j in query.all()]
@app.post('/api/jobs/{reference}/assign')
def assign_job(reference:str,x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference,transporter_id=a.id).first()
 if not j:raise HTTPException(404,'Job not found')
 v=s.get(Vehicle,int(x.get('vehicle_id')));d=s.get(Driver,int(x.get('driver_id')));lead=s.get(Lead,j.lead_id)
 if not v or v.owner_id!=a.id or not d or d.owner_id!=a.id:raise HTTPException(400,'Vehicle and driver must belong to transporter')
 validate_assignment(v,d,lead.mass);j.vehicle_id=v.id;j.driver_id=d.id;j.status='ASSIGNED';j.updated_at=datetime.utcnow();v.status='ASSIGNED';d.status='ASSIGNED';s.add(JobEvent(job_id=j.id,event_type='ASSIGNED',note=v.registration+' / '+d.full_name,actor_id=a.id));audit(s,'JOB_ASSIGNED',a.id,j.reference,v.registration);s.commit();return {'status':j.status}
@app.post('/api/jobs/{reference}/milestone')
def job_milestone(reference:str,x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference,transporter_id=a.id).first()
 if not j:raise HTTPException(404,'Job not found')
 event=x.get('event');j.status=next_state(j.status,event);j.updated_at=datetime.utcnow();s.add(JobEvent(job_id=j.id,event_type=event,note=x.get('note',''),actor_id=a.id));audit(s,'JOB_MILESTONE',a.id,j.reference,event);s.commit();return {'status':j.status}
@app.post('/api/jobs/{reference}/incident')
def job_incident(reference:str,x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference,transporter_id=a.id).first()
 if not j:raise HTTPException(404,'Job not found')
 i=Incident(job_id=j.id,incident_type=x.get('incident_type'),severity=x.get('severity'),description=x.get('description'),reported_by=a.id);s.add(i);s.add(JobEvent(job_id=j.id,event_type='INCIDENT_REPORTED',note=(i.severity or '')+': '+(i.incident_type or ''),actor_id=a.id));audit(s,'INCIDENT_REPORTED',a.id,j.reference,i.severity or '');s.commit();return {'id':i.id,'status':i.status}
@app.post('/api/jobs/{reference}/evidence')
def job_evidence(reference:str,kind:str,file:UploadFile=File(...),a=Depends(current),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference).first()
 if not j or a.role!='admin' and a.id not in [j.customer_id,j.transporter_id]:raise HTTPException(404,'Job not found')
 saved=save(file);row=Evidence(job_id=j.id,kind=kind,original_name=saved['original_name'],stored_name=saved['stored_name'],sha256=saved['sha256'],content_type=file.content_type,uploaded_by=a.id);s.add(row);s.add(JobEvent(job_id=j.id,event_type='EVIDENCE_UPLOADED',note=kind,actor_id=a.id));audit(s,'EVIDENCE_UPLOADED',a.id,j.reference,kind);s.commit();return {'saved':True,'sha256':saved['sha256']}
@app.post('/api/jobs/{reference}/pod')
def job_pod(reference:str,x:dict,a=Depends(roles('transporter')),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference,transporter_id=a.id).first()
 if not j or j.status not in ['ARRIVED_DELIVERY','DELIVERED']:raise HTTPException(400,'Arrive at delivery before POD')
 if s.query(POD).filter_by(job_id=j.id).first():raise HTTPException(409,'POD already exists')
 pod=POD(job_id=j.id,receiver_name=x.get('receiver_name'),signature_name=x.get('signature_name'),notes=x.get('notes'),created_by=a.id);s.add(pod);j.status='DELIVERED';j.updated_at=datetime.utcnow();s.add(JobEvent(job_id=j.id,event_type='DELIVERED',note='Electronic POD submitted',actor_id=a.id));audit(s,'POD_SUBMITTED',a.id,j.reference,pod.receiver_name or '');s.commit();return {'status':j.status}
@app.post('/api/jobs/{reference}/confirm')
def confirm_delivery(reference:str,a=Depends(roles('customer')),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference,customer_id=a.id).first()
 if not j or j.status!='DELIVERED' or not s.query(POD).filter_by(job_id=j.id).first():raise HTTPException(400,'Delivered job and POD required')
 j.customer_confirmed=True;j.status='COMPLETED';j.updated_at=datetime.utcnow();v=s.get(Vehicle,j.vehicle_id);d=s.get(Driver,j.driver_id)
 if v:v.status='AVAILABLE'
 if d:d.status='AVAILABLE'
 s.add(JobEvent(job_id=j.id,event_type='CUSTOMER_CONFIRMED',note='Delivery confirmed',actor_id=a.id));audit(s,'DELIVERY_CONFIRMED',a.id,j.reference,'completed');s.commit();return {'status':j.status}
@app.post('/api/jobs/{reference}/rating')
def rate_job(reference:str,x:dict,a=Depends(current),s=Depends(db)):
 j=s.query(Job).filter_by(reference=reference).first();score=int(x.get('score',0))
 if not j or a.id not in [j.customer_id,j.transporter_id] or j.status!='COMPLETED':raise HTTPException(400,'Completed participant job required')
 if score<1 or score>5:raise HTTPException(400,'Score must be 1 to 5')
 if s.query(Rating).filter_by(job_id=j.id,from_account_id=a.id).first():raise HTTPException(409,'Already rated')
 to_id=j.transporter_id if a.id==j.customer_id else j.customer_id;s.add(Rating(job_id=j.id,from_account_id=a.id,to_account_id=to_id,score=score,comment=x.get('comment')));audit(s,'RATING_CREATED',a.id,j.reference,str(score));s.commit();return {'saved':True}
@app.get('/api/admin/operations-overview')
def operations_overview(a=Depends(roles('admin')),s=Depends(db)):
 return {'jobs':s.query(Job).count(),'active_jobs':s.query(Job).filter(Job.status.notin_(['COMPLETED'])).count(),'incidents_open':s.query(Incident).filter_by(status='OPEN').count(),'pending_vehicle_reviews':s.query(Vehicle).filter_by(verified=False).count(),'pending_driver_reviews':s.query(Driver).filter_by(verified=False).count(),'completed_jobs':s.query(Job).filter_by(status='COMPLETED').count()}
@app.post('/api/admin/backups/verify')
def verify_backup(x:dict,a=Depends(roles('admin')),s=Depends(db)):
 row=BackupVerification(backup_reference=x.get('backup_reference'),database_ok=bool(x.get('database_ok')),uploads_ok=bool(x.get('uploads_ok')),restore_tested=bool(x.get('restore_tested')),notes=x.get('notes'));s.add(row);audit(s,'BACKUP_VERIFIED',a.id,row.backup_reference,str(row.restore_tested));s.commit();return {'saved':True}

@app.post('/api/private-upload')
def upload(file:UploadFile=File(...),a=Depends(current)):return save(file)
@app.get('/robots.txt',include_in_schema=False)
def robots():return FileResponse(site/'robots.txt')
@app.get('/sitemap.xml',include_in_schema=False)
def sitemap():return FileResponse(site/'sitemap.xml')
@app.get('/{path:path}',include_in_schema=False)
def static_page(path:str=''):
 target=site/path
 if target.is_dir():target=target/'index.html'
 if target.is_file():return FileResponse(target)
 return FileResponse(site/'404.html',status_code=404)
