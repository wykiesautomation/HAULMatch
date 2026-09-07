from pathlib import Path
from uuid import uuid4
from datetime import date
import os,hashlib,json,secrets
from fastapi import FastAPI,Depends,HTTPException,UploadFile,File,Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .database import Base,engine,get_db,SessionLocal
from .models import *
from .security import hp,vp,tok,user,roles
from .payfast import configured,checkout_url,checkout_fields,validate_itn
from .commerce import audit,notify,post_ledger
from .routing.provider import search as route_search,route as calculate_route,status as routing_status,RoutingError
from .routing.tokens import issue as issue_route_token,valid as valid_route_token
from .pricing import calculate as calculate_credits
from .config import settings
from .production import RequestContextMiddleware,SecurityHeadersMiddleware
from .health import health_payload
from .publishing import robots_text,sitemap_xml
from .seo import page as seo_page
from .trust import normalise_email,normalise_sa_phone,secure_token,token_hash,otp_code,otp_hash,verify_otp,expires,trust_level
from .risk_engine import evaluate_registration,evaluate_load,add_flag
from .rate_limit import throttle
from .messaging import provider as delivery_provider
from .config import settings
from .production import RequestContextMiddleware,SecurityHeadersMiddleware
from .health import health_payload
from .publishing import robots_text,sitemap_xml
from .seo import page as seo_page
from .trust import normalise_email,normalise_sa_phone,secure_token,token_hash,otp_code,otp_hash,verify_otp,expires,trust_level
from .risk_engine import evaluate_registration,evaluate_load,add_flag
from .rate_limit import throttle
from .messaging import provider as delivery_provider
from .config import settings
from .production import RequestContextMiddleware,SecurityHeadersMiddleware
from .health import health_payload
from .publishing import robots_text,sitemap_xml
from .seo import page as seo_page
from .trust import normalise_email,normalise_sa_phone,secure_token,token_hash,otp_code,otp_hash,verify_otp,expires,trust_level
from .risk_engine import evaluate_registration,evaluate_load,add_flag
from .rate_limit import throttle
from .messaging import provider as delivery_provider
app=FastAPI(title='HaulMatch 360',version='REV9',docs_url='/docs' if settings.env!='production' else None,redoc_url=None);app.mount('/static',StaticFiles(directory=Path(__file__).parent/'static'),name='static')
app.add_middleware(RequestContextMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(SecurityHeadersMiddleware);U=Path(__file__).parent.parent/'uploads'
def seed():
 Base.metadata.create_all(engine);d=SessionLocal()
 for e,n,c,r,cr in [('admin@haulmatch.local','Admin','HaulMatch 360','admin',100),('fleet@haulmatch.local','Fleet Owner','Demo Logistics','transporter',20),('customer@haulmatch.local','Load Owner','Demo Manufacturing','customer',0)]:
  if not d.query(User).filter_by(email=e).first():d.add(User(email=e,full_name=n,company=c,phone='0820000000',role=r,verified=True,credit_balance=cr,password_hash=hp('ChangeMe123!')))
 d.commit();f=d.query(User).filter_by(role='transporter').first();c=d.query(User).filter_by(role='customer').first()
 if not d.query(Vehicle).first():d.add(Vehicle(owner_id=f.id,registration='HM 808 GP',vehicle_type='8-ton truck',payload_kg=8000,status='available',verified=True,licence_expiry='2027-08-01',roadworthy_expiry='2027-06-01',insurance_expiry='2027-04-01'))
 if not d.query(Driver).first():d.add(Driver(owner_id=f.id,full_name='Demo Driver',phone='0830000000',licence_number='D123',licence_class='EC',licence_expiry='2028-01-01',prdp_number='P123',prdp_expiry='2027-12-01',status='available',verified=True))
 if not d.query(Load).first():d.add(Load(owner_id=c.id,reference='HM-'+uuid4().hex[:6].upper(),load_type='Shared Load',collection_area='Vanderbijlpark',delivery_area='Durban',collection_address='Demo Gate',delivery_address='Demo Bay',collection_date='2026-09-10',distance_km=620,cargo='Steel components',weight='4500 kg',vehicle='8-ton truck',description='Demo',credit_cost=3))
 d.commit()
 for name,credits,cents,order in [('Starter',10,30000,1),('Growth',25,67500,2),('Fleet',50,120000,3)]:
  if not d.query(CreditPack).filter_by(name=name).first():d.add(CreditPack(name=name,credits=credits,price_cents=cents,display_order=order))
 for u in d.query(User).filter_by(role='transporter').all():
  if not d.query(VerificationCase).filter_by(user_id=u.id).first():d.add(VerificationCase(user_id=u.id,status='APPROVED' if u.verified else 'PENDING'))
 d.commit();d.close()
@app.on_event('startup')
def start():seed()
@app.get('/')
def home():return FileResponse(Path(__file__).parent/'static/index.html')
@app.post('/api/login')
def login(x:dict,d=Depends(get_db)):
 u=d.query(User).filter_by(email=x.get('email','').lower()).first()
 if not u or not vp(x.get('password',''),u.password_hash):raise HTTPException(401,'Invalid login')
 return {'token':tok(u),'user':{'id':u.id,'role':u.role,'company':u.company,'credits':u.credit_balance}}
@app.get('/api/me')
def me(u=Depends(user)):return {'id':u.id,'role':u.role,'company':u.company,'credits':u.credit_balance}
@app.get('/api/loads')
def loads(d=Depends(get_db)):return [{'id':x.id,'reference':x.reference,'route':x.collection_area+' -> '+x.delivery_area,'cargo':x.cargo,'weight':x.weight,'vehicle':x.vehicle,'distance_km':x.distance_km,'credits':x.credit_cost,'status':x.status} for x in d.query(Load).all()]
@app.post('/api/loads/{lid}/unlock')
def unlock(lid:int,u=Depends(roles('transporter')),d=Depends(get_db)):
 if not (u.email_verified_at and u.phone_verified_at and u.verified):raise HTTPException(403,'Approved transporter verification is required')
 x=d.get(Load,lid)
 if not x or x.status!='open':raise HTTPException(404,'Unavailable')
 if not d.query(Unlock).filter_by(load_id=lid,transporter_id=u.id).first():
  if u.credit_balance<x.credit_cost:raise HTTPException(400,'Not enough credits')
  u.credit_balance-=x.credit_cost;d.add(Unlock(load_id=lid,transporter_id=u.id,credits_used=x.credit_cost));d.commit()
 return {'credits':u.credit_balance}
@app.post('/api/loads/{lid}/quote')
def quote(lid:int,x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 if not d.query(Unlock).filter_by(load_id=lid,transporter_id=u.id).first():raise HTTPException(403,'Unlock first')
 q=Quote(load_id=lid,transporter_id=u.id,amount=float(x['amount']),vehicle_offered=x['vehicle'],eta=x['eta'],terms=x.get('terms',''));d.add(q);d.commit();d.refresh(q);return {'id':q.id}
@app.get('/api/customer/loads')
def customerloads(u=Depends(roles('customer')),d=Depends(get_db)):
 return [{'id':x.id,'reference':x.reference,'route':x.collection_area+' -> '+x.delivery_area,'status':x.status,'quotes':[{'id':q.id,'amount':q.amount,'transporter':q.transporter.company,'status':q.status} for q in d.query(Quote).filter_by(load_id=x.id).all()]} for x in d.query(Load).filter_by(owner_id=u.id).all()]
@app.post('/api/quotes/{qid}/accept')
def accept(qid:int,u=Depends(roles('customer')),d=Depends(get_db)):
 q=d.get(Quote,qid);l=d.get(Load,q.load_id) if q else None
 if not l or l.owner_id!=u.id:raise HTTPException(404,'Quote not found')
 q.status='accepted';l.status='awarded';j=Job(load_id=l.id,customer_id=u.id,transporter_id=q.transporter_id);d.add(j);d.commit();d.refresh(j);d.add(JobEvent(job_id=j.id,event_type='AWARDED',note='Quote accepted',actor_id=u.id));d.commit();return {'job_id':j.id}
@app.get('/api/vehicles')
def vehicles(u=Depends(roles('transporter')),d=Depends(get_db)):return [{'id':x.id,'registration':x.registration,'vehicle_type':x.vehicle_type,'payload_kg':x.payload_kg,'status':x.status,'verified':x.verified} for x in d.query(Vehicle).filter_by(owner_id=u.id).all()]
@app.get('/api/drivers')
def drivers(u=Depends(roles('transporter')),d=Depends(get_db)):return [{'id':x.id,'full_name':x.full_name,'licence_class':x.licence_class,'status':x.status,'verified':x.verified} for x in d.query(Driver).filter_by(owner_id=u.id).all()]
@app.get('/api/jobs')
def jobs(u=Depends(user),d=Depends(get_db)):
 q=d.query(Job)
 if u.role=='customer':q=q.filter_by(customer_id=u.id)
 elif u.role=='transporter':q=q.filter_by(transporter_id=u.id)
 out=[]
 for j in q.all():
  l=d.get(Load,j.load_id);out.append({'id':j.id,'status':j.status,'route':l.collection_area+' -> '+l.delivery_area,'addresses_protected':True,'vehicle_id':j.vehicle_id,'driver_id':j.driver_id,'confirmed':j.customer_confirmed,'timeline':[{'event':e.event_type,'note':e.note,'time':e.created_at.isoformat()} for e in d.query(JobEvent).filter_by(job_id=j.id).order_by(JobEvent.id)],'pod':bool(d.query(POD).filter_by(job_id=j.id).first()),'evidence':[{'kind':e.kind,'filename':e.filename} for e in d.query(Evidence).filter_by(job_id=j.id)],'incidents':[{'type':i.incident_type,'severity':i.severity,'description':i.description} for i in d.query(Incident).filter_by(job_id=j.id)]})
 return out

@app.post('/api/jobs/{jid}/assign')
def assign(jid:int,x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 j=d.get(Job,jid);v=d.get(Vehicle,int(x['vehicle_id']));r=d.get(Driver,int(x['driver_id']));l=d.get(Load,j.load_id) if j else None
 if not j or j.transporter_id!=u.id:raise HTTPException(404,'Job not found')
 if not v or v.owner_id!=u.id or not v.verified or v.status!='available':raise HTTPException(400,'Verified available vehicle required')
 if not r or r.owner_id!=u.id or not r.verified or r.status!='available':raise HTTPException(400,'Verified available driver required')
 for expiry in [v.licence_expiry,v.roadworthy_expiry,v.insurance_expiry,r.licence_expiry,r.prdp_expiry]:
  if not expiry or date.fromisoformat(expiry)<date.today():raise HTTPException(400,'Compliance document expired or missing')
 kilograms=int(''.join(c for c in l.weight if c.isdigit()) or 0)
 if kilograms>v.payload_kg:raise HTTPException(400,'Vehicle payload too low')
 j.vehicle_id=v.id;j.driver_id=r.id;j.status='assigned';v.status='assigned';r.status='assigned';d.add(JobEvent(job_id=j.id,event_type='DRIVER_ASSIGNED',note=v.registration+' / '+r.full_name,actor_id=u.id));d.commit();return {'status':'assigned'}
@app.post('/api/jobs/{jid}/milestone')
def milestone(jid:int,x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 j=d.get(Job,jid)
 if not j or j.transporter_id!=u.id:raise HTTPException(404,'Job not found')
 event=x['event'];allowed={'assigned':['EN_ROUTE_COLLECTION'],'en_route_collection':['ARRIVED_COLLECTION'],'arrived_collection':['LOADED'],'loaded':['IN_TRANSIT'],'in_transit':['DELAYED','ARRIVED_DELIVERY'],'delayed':['IN_TRANSIT','ARRIVED_DELIVERY'],'arrived_delivery':['DELIVERED']}
 if event not in allowed.get(j.status,[]):raise HTTPException(400,'Invalid trip transition')
 states={'EN_ROUTE_COLLECTION':'en_route_collection','ARRIVED_COLLECTION':'arrived_collection','LOADED':'loaded','IN_TRANSIT':'in_transit','DELAYED':'delayed','ARRIVED_DELIVERY':'arrived_delivery','DELIVERED':'delivered'};j.status=states[event];d.add(JobEvent(job_id=j.id,event_type=event,note=x.get('note',''),actor_id=u.id));d.commit();return {'status':j.status}
@app.post('/api/jobs/{jid}/incident')
def incident(jid:int,x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 j=d.get(Job,jid)
 if not j or j.transporter_id!=u.id:raise HTTPException(404,'Job not found')
 i=Incident(job_id=jid,incident_type=x['type'],severity=x['severity'],description=x['description'],reported_by=u.id);d.add(i);d.add(JobEvent(job_id=jid,event_type='INCIDENT_REPORTED',note=x['severity']+': '+x['type'],actor_id=u.id));d.commit();return {'saved':True}
@app.post('/api/jobs/{jid}/evidence')
def evidence(jid:int,kind:str,file:UploadFile=File(...),u=Depends(roles('transporter')),d=Depends(get_db)):
 j=d.get(Job,jid)
 if not j or j.transporter_id!=u.id:raise HTTPException(404,'Job not found')
 if file.content_type not in ['image/jpeg','image/png','application/pdf']:raise HTTPException(400,'JPG, PNG or PDF only')
 name=uuid4().hex+Path(file.filename or '.bin').suffix;data=file.file.read();limit=int(os.getenv('HAULMATCH_UPLOAD_MAX_MB','10'))*1024*1024
 if len(data)>limit:raise HTTPException(400,'File too large')
 (U/name).write_bytes(data);d.add(Evidence(job_id=jid,kind=kind,filename=Path(file.filename).name,stored_name=name,content_type=file.content_type,uploaded_by=u.id));d.add(JobEvent(job_id=jid,event_type='EVIDENCE_UPLOADED',note=kind,actor_id=u.id));d.commit();return {'saved':True}
@app.post('/api/jobs/{jid}/pod')
def pod(jid:int,x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 j=d.get(Job,jid)
 if not j or j.transporter_id!=u.id:raise HTTPException(404,'Job not found')
 if j.status not in ['arrived_delivery','delivered']:raise HTTPException(400,'Arrive at delivery first')
 if d.query(POD).filter_by(job_id=jid).first():raise HTTPException(409,'POD exists')
 d.add(POD(job_id=jid,receiver_name=x['receiver_name'],signature_name=x['signature_name'],notes=x.get('notes',''),created_by=u.id));j.status='delivered';d.add(JobEvent(job_id=jid,event_type='DELIVERED',note='Electronic POD submitted',actor_id=u.id));d.commit();return {'status':'delivered'}
@app.post('/api/jobs/{jid}/confirm')
def confirm(jid:int,u=Depends(roles('customer')),d=Depends(get_db)):
 j=d.get(Job,jid)
 if not j or j.customer_id!=u.id or j.status!='delivered' or not d.query(POD).filter_by(job_id=jid).first():raise HTTPException(400,'Delivered job and POD required')
 j.customer_confirmed=True;j.status='completed';d.add(JobEvent(job_id=jid,event_type='CUSTOMER_CONFIRMED',note='Delivery confirmed',actor_id=u.id));d.commit();return {'status':'completed'}
@app.post('/api/jobs/{jid}/rating')
def rating(jid:int,x:dict,u=Depends(user),d=Depends(get_db)):
 j=d.get(Job,jid);score=int(x['score'])
 if not j or u.id not in [j.customer_id,j.transporter_id] or j.status!='completed':raise HTTPException(400,'Completed participant job required')
 if score<1 or score>5:raise HTTPException(400,'Score must be 1-5')
 if d.query(Rating).filter_by(job_id=jid,from_user_id=u.id).first():raise HTTPException(409,'Already rated')
 d.add(Rating(job_id=jid,from_user_id=u.id,to_user_id=j.transporter_id if u.id==j.customer_id else j.customer_id,score=score,comment=x.get('comment','')));d.commit();return {'saved':True}

@app.get('/api/credit-packs')
def packs(d=Depends(get_db)):return [{'id':x.id,'name':x.name,'credits':x.credits,'price_cents':x.price_cents,'currency':x.currency} for x in d.query(CreditPack).filter_by(active=True).order_by(CreditPack.display_order)]
@app.post('/api/payments/payfast/checkout')
def checkout(x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 pack=d.get(CreditPack,int(x['pack_id']))
 if not pack or not pack.active:raise HTTPException(404,'Credit pack unavailable')
 o=PaymentOrder(reference='HMP-'+uuid4().hex[:14].upper(),user_id=u.id,pack_id=pack.id,amount_cents=pack.price_cents,credits=pack.credits,status='CHECKOUT_READY');d.add(o);d.flush();audit(d,'PAYMENT_CREATED',u.id,'payment',o.id,'Credit checkout created');d.commit();d.refresh(o)
 if not configured():return {'payment_id':o.id,'reference':o.reference,'status':o.status,'configured':False,'message':'PayFast is disabled. Configure .env before checkout.'}
 return {'payment_id':o.id,'reference':o.reference,'status':o.status,'configured':True,'checkout_url':checkout_url(),'fields':checkout_fields(o,pack)}
@app.post('/api/payments/payfast/itn')
async def itn(request:__import__('fastapi').Request,d=Depends(get_db)):
 form=dict(await request.form());h=hashlib.sha256(json.dumps(form,sort_keys=True).encode()).hexdigest()
 if d.query(PaymentNotification).filter_by(notification_hash=h).first():return {'status':'duplicate'}
 o=d.query(PaymentOrder).filter_by(reference=form.get('m_payment_id')).first()
 if not o:d.add(PaymentNotification(notification_hash=h,valid=False,reason='Unknown reference',payload_json=json.dumps(form)));d.commit();raise HTTPException(400,'Unknown payment')
 valid,reason=validate_itn(form,o);d.add(PaymentNotification(notification_hash=h,payment_id=o.id,valid=valid,reason=reason,payload_json=json.dumps(form)))
 if not valid:o.status='INVALID';audit(d,'PAYMENT_REJECTED',None,'payment',o.id,reason,'HIGH');d.commit();raise HTTPException(400,reason)
 if not o.credited:
  u=d.get(User,o.user_id);post_ledger(d,u,o.credits,'credit','PURCHASE_CREDIT','PayFast '+o.reference,payment_id=o.id);o.credited=True;o.status='COMPLETE';o.completed_at=__import__('datetime').datetime.utcnow();notify(d,u.id,'PAYMENT_COMPLETE','Credits added',f'{o.credits} credits added');audit(d,'WALLET_CREDITED',None,'payment',o.id,f'{o.credits} credits')
 d.commit();return {'status':'ok'}
@app.get('/api/wallet')
def wallet(u=Depends(user),d=Depends(get_db)):return {'credits':u.credit_balance,'transactions':[{'id':x.id,'direction':x.direction,'credits':x.credits,'before':x.balance_before,'after':x.balance_after,'type':x.transaction_type,'reason':x.reason,'created_at':x.created_at.isoformat()} for x in d.query(WalletTransaction).filter_by(user_id=u.id).order_by(WalletTransaction.id.desc()).all()],'payments':[{'id':x.id,'reference':x.reference,'amount_cents':x.amount_cents,'credits':x.credits,'status':x.status} for x in d.query(PaymentOrder).filter_by(user_id=u.id).order_by(PaymentOrder.id.desc()).all()]}
@app.post('/api/unlocks/{unlock_id}/disputes')
def dispute(unlock_id:int,x:dict,u=Depends(roles('transporter')),d=Depends(get_db)):
 z=d.get(Unlock,unlock_id)
 if not z or z.transporter_id!=u.id:raise HTTPException(404,'Unlock not found')
 if d.query(Dispute).filter_by(unlock_id=unlock_id).first():raise HTTPException(409,'Dispute already exists')
 q=Dispute(unlock_id=unlock_id,opened_by=u.id,reason_code=x['reason_code'],description=x['description']);d.add(q);d.flush();audit(d,'DISPUTE_OPENED',u.id,'dispute',q.id,x['reason_code']);notify(d,u.id,'DISPUTE_OPENED','Dispute opened','Admin review started');d.commit();return {'id':q.id,'status':q.status}
@app.get('/api/notifications')
def notifications(u=Depends(user),d=Depends(get_db)):return [{'id':x.id,'event_type':x.event_type,'title':x.title,'message':x.message,'read':x.read} for x in d.query(Notification).filter_by(user_id=u.id).order_by(Notification.id.desc()).all()]
@app.post('/api/notifications/{nid}/read')
def readnote(nid:int,u=Depends(user),d=Depends(get_db)):
 x=d.get(Notification,nid)
 if not x or x.user_id!=u.id:raise HTTPException(404,'Notification not found')
 x.read=True;d.commit();return {'read':True}
@app.get('/api/admin/overview')
def adminoverview(u=Depends(roles('admin')),d=Depends(get_db)):return {'users':d.query(User).count(),'transporters':d.query(User).filter_by(role='transporter').count(),'loads':d.query(Load).count(),'jobs':d.query(Job).count(),'pending_verifications':d.query(VerificationCase).filter_by(status='PENDING').count(),'open_disputes':d.query(Dispute).filter(Dispute.status.in_(['OPEN','UNDER_REVIEW'])).count(),'risk_flags':d.query(RiskFlag).filter_by(status='OPEN').count(),'completed_payments':d.query(PaymentOrder).filter_by(status='COMPLETE').count()}
@app.get('/api/admin/verifications')
def verifications(u=Depends(roles('admin')),d=Depends(get_db)):return [{'id':x.id,'user_id':x.user_id,'company':d.get(User,x.user_id).company,'status':x.status,'note':x.review_note} for x in d.query(VerificationCase).all()]
@app.post('/api/admin/verifications/{vid}/decision')
def verification(vid:int,x:dict,u=Depends(roles('admin')),d=Depends(get_db)):
 v=d.get(VerificationCase,vid);status=x['status']
 if status not in ['APPROVED','REJECTED','MORE_INFO_REQUIRED','SUSPENDED']:raise HTTPException(400,'Invalid status')
 target=d.get(User,v.user_id);v.status=status;v.review_note=x.get('note','');v.reviewed_by=u.id;target.verified=status=='APPROVED';audit(d,'TRANSPORTER_'+status,u.id,'user',target.id,v.review_note);notify(d,target.id,'VERIFICATION_'+status,'Verification updated',v.review_note or status);d.commit();return {'status':status}
@app.get('/api/admin/disputes')
def disputes(u=Depends(roles('admin')),d=Depends(get_db)):return [{'id':x.id,'unlock_id':x.unlock_id,'reason':x.reason_code,'description':x.description,'status':x.status,'refund_credits':x.refund_credits} for x in d.query(Dispute).all()]
@app.post('/api/admin/disputes/{did}/decision')
def disputedecision(did:int,x:dict,u=Depends(roles('admin')),d=Depends(get_db)):
 q=d.get(Dispute,did)
 if not q or q.status in ['APPROVED','REJECTED','CLOSED']:raise HTTPException(400,'Dispute unavailable')
 q.status=x['status'];q.decision_note=x.get('note','')
 if q.status=='APPROVED':
  unlock=d.get(Unlock,q.unlock_id);owner=d.get(User,unlock.transporter_id);credits=min(int(x.get('refund_credits',unlock.credits_used)),unlock.credits_used);post_ledger(d,owner,credits,'credit','BAD_LEAD_REFUND','Approved dispute',created_by=u.id,dispute_id=q.id);q.refund_credits=credits;notify(d,owner.id,'CREDIT_REFUND','Credits refunded',f'{credits} credits returned')
 audit(d,'DISPUTE_'+q.status,u.id,'dispute',q.id,q.decision_note);d.commit();return {'status':q.status,'refund_credits':q.refund_credits}
@app.get('/api/admin/audit')
def audits(u=Depends(roles('admin')),d=Depends(get_db)):return [{'id':x.id,'event_type':x.event_type,'actor_id':x.actor_id,'target_type':x.target_type,'target_id':x.target_id,'reason':x.reason,'severity':x.severity,'created_at':x.created_at.isoformat()} for x in d.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(500)]
@app.get('/api/admin/risk')
def risk(u=Depends(roles('admin')),d=Depends(get_db)):return [{'id':x.id,'user_id':x.user_id,'severity':x.severity,'rule':x.rule_code,'description':x.description,'status':x.status} for x in d.query(RiskFlag).all()]
@app.post('/api/admin/users/{uid}/suspend')
def suspend(uid:int,x:dict,u=Depends(roles('admin')),d=Depends(get_db)):
 target=d.get(User,uid)
 if not target:raise HTTPException(404,'User not found')
 target.active=False;target.verified=False;d.add(RiskFlag(user_id=uid,severity='HIGH',rule_code='ADMIN_SUSPENSION',description=x.get('reason','Suspended')));audit(d,'USER_SUSPENDED',u.id,'user',uid,x.get('reason',''),'HIGH');notify(d,uid,'ACCOUNT_SUSPENDED','Account suspended',x.get('reason',''));d.commit();return {'active':False}

@app.post('/api/register')
def register_account(x:dict,request:Request,d=Depends(get_db)):
 throttle(request,'register',5,3600)
 role=x.get('role')
 if role not in ['customer','transporter']:raise HTTPException(400,'Invalid role')
 try:email=normalise_email(x.get('email',''));phone=normalise_sa_phone(x.get('phone',''))
 except ValueError as exc:raise HTTPException(400,str(exc))
 if d.query(User).filter_by(email=email).first():raise HTTPException(409,'An account with those details cannot be created')
 if d.query(User).filter_by(phone=phone).first():raise HTTPException(409,'An account with those details cannot be created')
 if len(x.get('password',''))<10:raise HTTPException(400,'Password must be at least 10 characters')
 u=User(email=email,full_name=x.get('full_name','').strip(),company=x.get('company','').strip(),phone=phone,role=role,verified=False,active=True,credit_balance=0,password_hash=hp(x['password']));d.add(u);d.flush()
 raw=secure_token();d.add(EmailVerificationToken(user_id=u.id,token_hash=token_hash(raw),expires_at=expires(30)))
 code=otp_code();salt=secrets.token_hex(16);d.add(PhoneOTP(user_id=u.id,salt=salt,code_hash=otp_hash(code,salt),expires_at=expires(5)))
 if role=='transporter':d.add(VerificationCase(user_id=u.id,status='PENDING'))
 evaluate_registration(d,u,request.client.host if request.client else '')
 audit(d,'USER_REGISTERED',u.id,'user',u.id,role);d.commit()
 delivery_provider().send_email(email,'Verify HaulMatch account',f'/api/verify/email?token={raw}')
 delivery_provider().send_sms(phone,f'HaulMatch verification code: {code}')
 response={'token':tok(u),'user':{'id':u.id,'role':u.role,'company':u.company,'credits':0,'trust_level':trust_level(u),'email_verified':False,'phone_verified':False}}
 if os.getenv('HAULMATCH_ENV','development')!='production':response['development_verification']={'email_token':raw,'otp':code}
 return response
@app.get('/api/verify/email')
def verify_email(token:str,d=Depends(get_db)):
 row=d.query(EmailVerificationToken).filter_by(token_hash=token_hash(token),used_at=None).first()
 if not row or row.expires_at<__import__('datetime').datetime.utcnow():raise HTTPException(400,'Verification link invalid or expired')
 u=d.get(User,row.user_id);row.used_at=__import__('datetime').datetime.utcnow();u.email_verified_at=row.used_at;u.verified=bool(u.email_verified_at and u.phone_verified_at) if u.role=='customer' else False;audit(d,'EMAIL_VERIFIED',u.id,'user',u.id);d.commit();return {'verified':True,'trust_level':trust_level(u)}
@app.post('/api/verify/phone')
def verify_phone(x:dict,request:Request,u=Depends(user),d=Depends(get_db)):
 throttle(request,'phone-otp',8,900);row=d.query(PhoneOTP).filter_by(user_id=u.id,used_at=None).order_by(PhoneOTP.id.desc()).first()
 if not row or row.expires_at<__import__('datetime').datetime.utcnow():raise HTTPException(400,'OTP invalid or expired')
 row.attempts+=1
 if row.attempts>5:raise HTTPException(429,'Too many OTP attempts')
 if not verify_otp(str(x.get('code','')),row.salt,row.code_hash):d.commit();raise HTTPException(400,'OTP invalid or expired')
 row.used_at=__import__('datetime').datetime.utcnow();u.phone_verified_at=row.used_at;u.verified=bool(u.email_verified_at and u.phone_verified_at) if u.role=='customer' else False;audit(d,'PHONE_VERIFIED',u.id,'user',u.id);d.commit();return {'verified':True,'trust_level':trust_level(u)}
@app.post('/api/verify/resend')
def resend_verification(request:Request,u=Depends(user),d=Depends(get_db)):
 throttle(request,'verification-resend',3,3600);raw=secure_token();d.add(EmailVerificationToken(user_id=u.id,token_hash=token_hash(raw),expires_at=expires(30)));code=otp_code();salt=secrets.token_hex(16);d.add(PhoneOTP(user_id=u.id,salt=salt,code_hash=otp_hash(code,salt),expires_at=expires(5)));d.commit();delivery_provider().send_email(u.email,'Verify HaulMatch account',f'/api/verify/email?token={raw}');delivery_provider().send_sms(u.phone,f'HaulMatch verification code: {code}');return {'sent':True}
@app.get('/api/routes/status')
def routes_status():return routing_status()
@app.get('/api/locations/search')
def locations_search(q:str,u=Depends(user)):
 try:return route_search(q)
 except RoutingError as e:raise HTTPException(503,str(e))
@app.post('/api/routes/preview')
def routes_preview(x:dict,u=Depends(roles('customer','admin')),d=Depends(get_db)):
 try:r=calculate_route(x['origin'],x['destination'],x.get('vehicle_profile','8-ton truck'))
 except RoutingError as e:raise HTTPException(503,str(e))
 token_value,expiry=issue_route_token();z=RouteCalculation(user_id=u.id,token=token_value,origin_label=x['origin']['label'],origin_public_label=x['origin']['public_label'],origin_latitude=x['origin']['latitude'],origin_longitude=x['origin']['longitude'],destination_label=x['destination']['label'],destination_public_label=x['destination']['public_label'],destination_latitude=x['destination']['latitude'],destination_longitude=x['destination']['longitude'],distance_metres=r['distance_metres'],duration_seconds=r['duration_seconds'],geometry_json=json.dumps(r['geometry']),provider=r['provider'],profile=r['profile'],vehicle_profile=r['vehicle_profile'],expires_at=expiry);d.add(z);d.commit();return {**r,'route_token':token_value,'origin_public_label':x['origin']['public_label'],'destination_public_label':x['destination']['public_label']}
@app.post('/api/loads')
def publish_route_load(x:dict,u=Depends(roles('customer','admin')),d=Depends(get_db)):
 if u.role=='customer' and not (u.email_verified_at and u.phone_verified_at):raise HTTPException(403,'Verify email and mobile before posting a load')
 route_record=d.query(RouteCalculation).filter_by(token=x.get('route_token')).first()
 if not valid_route_token(route_record,u.id):raise HTTPException(400,'Route token invalid, expired or already used')
 km=round(route_record.distance_metres/1000,1);credits,reasons=calculate_credits(km,x['load_type'],route_record.vehicle_profile,x.get('refrigerated',False),x.get('specialised_handling',False))
 z=Load(owner_id=u.id,reference='HM-'+uuid4().hex[:6].upper(),load_type=x['load_type'],collection_area=route_record.origin_public_label,delivery_area=route_record.destination_public_label,collection_address=route_record.origin_label,delivery_address=route_record.destination_label,collection_date=x['collection_date'],distance_km=km,cargo=x['cargo'],weight=x['weight'],vehicle=route_record.vehicle_profile,description=x.get('description',''),credit_cost=credits,status='open');route_record.used=True;d.add(z);d.flush();evaluate_load(d,z);audit(d,'LOAD_PUBLISHED',u.id,'load',z.id,json.dumps({'credits':credits,'pricing_reasons':reasons,'distance_km':km}));d.commit();return {'id':z.id,'reference':z.reference,'distance_km':km,'credits':credits,'reasons':reasons}

@app.get('/health/live')
def live():return {'status':'ok','service':'haulmatch-360','release':'REV9'}
@app.get('/health/ready')
def ready():
 payload=health_payload()
 if payload['status']!='ok':raise HTTPException(503,payload)
 return payload
@app.get('/legal/terms')
def terms():return FileResponse(Path(__file__).parent/'static/legal/terms.html')
@app.get('/legal/privacy')
def privacy():return FileResponse(Path(__file__).parent/'static/legal/privacy.html')
@app.get('/legal/credits')
def credits_policy():return FileResponse(Path(__file__).parent/'static/legal/credits.html')

@app.get('/health/live')
def live():return {'status':'ok','service':'haulmatch-360','release':'REV9'}
@app.get('/health/ready')
def ready():
 payload=health_payload()
 if payload['status']!='ok':raise HTTPException(503,payload)
 return payload
@app.get('/legal/terms')
def terms():return FileResponse(Path(__file__).parent/'static/legal/terms.html')
@app.get('/legal/privacy')
def privacy():return FileResponse(Path(__file__).parent/'static/legal/privacy.html')
@app.get('/legal/credits')
def credits_policy():return FileResponse(Path(__file__).parent/'static/legal/credits.html')

@app.get('/health/live')
def live():return {'status':'ok','service':'haulmatch-360','release':'REV9'}
@app.get('/health/ready')
def ready():
 payload=health_payload()
 if payload['status']!='ok':raise HTTPException(503,payload)
 return payload
@app.get('/legal/terms')
def terms():return FileResponse(Path(__file__).parent/'static/legal/terms.html')
@app.get('/legal/privacy')
def privacy():return FileResponse(Path(__file__).parent/'static/legal/privacy.html')
@app.get('/legal/credits')
def credits_policy():return FileResponse(Path(__file__).parent/'static/legal/credits.html')

@app.get('/robots.txt',include_in_schema=False)
def robots():return __import__('fastapi').responses.PlainTextResponse(robots_text(),media_type='text/plain')
@app.get('/sitemap.xml',include_in_schema=False)
def sitemap():return __import__('fastapi').responses.Response(sitemap_xml(),media_type='application/xml')

@app.get('/{seo_slug}',include_in_schema=False)
def focused_seo_page(seo_slug:str):
 html=seo_page(seo_slug)
 if html is None:raise HTTPException(404,'Page not found')
 return __import__('fastapi').responses.HTMLResponse(html)

@app.get('/api/jobs/{jid}/contact')
def awarded_contact(jid:int,u=Depends(user),d=Depends(get_db)):
 j=d.get(Job,jid)
 if not j or u.id not in [j.customer_id,j.transporter_id] and u.role!='admin':raise HTTPException(404,'Job not found')
 if u.role=='transporter' and j.transporter_id!=u.id:raise HTTPException(403,'Contact remains hidden')
 l=d.get(Load,j.load_id);customer=d.get(User,j.customer_id)
 reveal=d.query(ContactReveal).filter_by(job_id=j.id,revealed_to=u.id).first()
 if not reveal:d.add(ContactReveal(job_id=j.id,revealed_to=u.id,reason='AWARDED_JOB'));audit(d,'CONTACT_REVEALED',u.id,'job',j.id,'Awarded party accessed contact','HIGH');d.commit()
 return {'customer_name':customer.full_name,'verified_email':customer.email,'verified_mobile':customer.phone,'whatsapp':customer.phone.replace('+',''),'collection_address':l.collection_address,'delivery_address':l.delivery_address}
@app.get('/api/me/trust')
def my_trust(u=Depends(user)):return {'trust_level':trust_level(u),'email_verified':bool(u.email_verified_at),'phone_verified':bool(u.phone_verified_at),'identity_verified':bool(u.identity_verified_at),'business_verified':bool(u.business_verified_at),'transporter_approved':bool(u.verified)}
