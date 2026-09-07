from datetime import datetime
from sqlalchemy import *
from sqlalchemy.orm import relationship
from .database import Base
class User(Base):
 __tablename__='users';id=Column(Integer,primary_key=True);email=Column(String,unique=True);full_name=Column(String);company=Column(String);phone=Column(String);password_hash=Column(String);role=Column(String);verified=Column(Boolean,default=False);active=Column(Boolean,default=True);credit_balance=Column(Integer,default=0);email_verified_at=Column(DateTime);phone_verified_at=Column(DateTime);identity_verified_at=Column(DateTime);business_verified_at=Column(DateTime);failed_login_count=Column(Integer,default=0);locked_until=Column(DateTime);created_at=Column(DateTime,default=datetime.utcnow)
class Vehicle(Base):
 __tablename__='vehicles';id=Column(Integer,primary_key=True);owner_id=Column(Integer);registration=Column(String);vehicle_type=Column(String);payload_kg=Column(Integer);status=Column(String,default='available');verified=Column(Boolean,default=False);licence_expiry=Column(String);roadworthy_expiry=Column(String);insurance_expiry=Column(String)
class Driver(Base):
 __tablename__='drivers';id=Column(Integer,primary_key=True);owner_id=Column(Integer);full_name=Column(String);phone=Column(String);licence_number=Column(String);licence_class=Column(String);licence_expiry=Column(String);prdp_number=Column(String);prdp_expiry=Column(String);status=Column(String,default='available');verified=Column(Boolean,default=False)
class Load(Base):
 __tablename__='loads';id=Column(Integer,primary_key=True);owner_id=Column(Integer,ForeignKey('users.id'));reference=Column(String,unique=True);load_type=Column(String);collection_area=Column(String);delivery_area=Column(String);collection_address=Column(Text);delivery_address=Column(Text);collection_date=Column(String);distance_km=Column(Float);cargo=Column(String);weight=Column(String);vehicle=Column(String);description=Column(Text);credit_cost=Column(Integer);status=Column(String,default='open');owner=relationship('User')
class Unlock(Base):
 __tablename__='unlocks';id=Column(Integer,primary_key=True);load_id=Column(Integer);transporter_id=Column(Integer);credits_used=Column(Integer);__table_args__=(UniqueConstraint('load_id','transporter_id'),)
class Quote(Base):
 __tablename__='quotes';id=Column(Integer,primary_key=True);load_id=Column(Integer);transporter_id=Column(Integer,ForeignKey('users.id'));amount=Column(Float);vehicle_offered=Column(String);eta=Column(String);terms=Column(Text);status=Column(String,default='submitted');transporter=relationship('User')
class Job(Base):
 __tablename__='jobs';id=Column(Integer,primary_key=True);load_id=Column(Integer,unique=True);customer_id=Column(Integer);transporter_id=Column(Integer);vehicle_id=Column(Integer);driver_id=Column(Integer);status=Column(String,default='awarded');customer_confirmed=Column(Boolean,default=False);created_at=Column(DateTime,default=datetime.utcnow)
class JobEvent(Base):
 __tablename__='job_events';id=Column(Integer,primary_key=True);job_id=Column(Integer);event_type=Column(String);note=Column(Text);actor_id=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class Evidence(Base):
 __tablename__='evidence';id=Column(Integer,primary_key=True);job_id=Column(Integer);kind=Column(String);filename=Column(String);stored_name=Column(String);content_type=Column(String);uploaded_by=Column(Integer)
class POD(Base):
 __tablename__='pods';id=Column(Integer,primary_key=True);job_id=Column(Integer,unique=True);receiver_name=Column(String);signature_name=Column(String);notes=Column(Text);delivered_at=Column(DateTime,default=datetime.utcnow);created_by=Column(Integer)
class Incident(Base):
 __tablename__='incidents';id=Column(Integer,primary_key=True);job_id=Column(Integer);incident_type=Column(String);severity=Column(String);description=Column(Text);status=Column(String,default='open');reported_by=Column(Integer)
class Rating(Base):
 __tablename__='ratings';id=Column(Integer,primary_key=True);job_id=Column(Integer);from_user_id=Column(Integer);to_user_id=Column(Integer);score=Column(Integer);comment=Column(Text);__table_args__=(UniqueConstraint('job_id','from_user_id'),)

class CreditPack(Base):
 __tablename__='credit_packs';id=Column(Integer,primary_key=True);name=Column(String,unique=True);credits=Column(Integer);price_cents=Column(Integer);currency=Column(String,default='ZAR');active=Column(Boolean,default=True);display_order=Column(Integer,default=0)
class PaymentOrder(Base):
 __tablename__='payment_orders';id=Column(Integer,primary_key=True);reference=Column(String,unique=True,index=True);user_id=Column(Integer);pack_id=Column(Integer);amount_cents=Column(Integer);credits=Column(Integer);status=Column(String,default='CREATED');payfast_reference=Column(String);credited=Column(Boolean,default=False);created_at=Column(DateTime,default=datetime.utcnow);completed_at=Column(DateTime)
class PaymentNotification(Base):
 __tablename__='payment_notifications';id=Column(Integer,primary_key=True);notification_hash=Column(String,unique=True);payment_id=Column(Integer);valid=Column(Boolean);reason=Column(String);payload_json=Column(Text);created_at=Column(DateTime,default=datetime.utcnow)
class WalletTransaction(Base):
 __tablename__='wallet_ledger';id=Column(Integer,primary_key=True);user_id=Column(Integer);direction=Column(String);credits=Column(Integer);balance_before=Column(Integer);balance_after=Column(Integer);transaction_type=Column(String);reason=Column(String);payment_id=Column(Integer);load_id=Column(Integer);dispute_id=Column(Integer);created_by=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class Dispute(Base):
 __tablename__='disputes';id=Column(Integer,primary_key=True);unlock_id=Column(Integer);opened_by=Column(Integer);reason_code=Column(String);description=Column(Text);status=Column(String,default='OPEN');decision_note=Column(Text);refund_credits=Column(Integer,default=0);created_at=Column(DateTime,default=datetime.utcnow)
class VerificationCase(Base):
 __tablename__='verification_cases';id=Column(Integer,primary_key=True);user_id=Column(Integer,unique=True);status=Column(String,default='PENDING');review_note=Column(Text);reviewed_by=Column(Integer);updated_at=Column(DateTime,default=datetime.utcnow)
class RiskFlag(Base):
 __tablename__='risk_flags';id=Column(Integer,primary_key=True);user_id=Column(Integer);load_id=Column(Integer);severity=Column(String);rule_code=Column(String);description=Column(Text);status=Column(String,default='OPEN');created_at=Column(DateTime,default=datetime.utcnow)
class Notification(Base):
 __tablename__='notifications';id=Column(Integer,primary_key=True);user_id=Column(Integer);event_type=Column(String);title=Column(String);message=Column(Text);read=Column(Boolean,default=False);created_at=Column(DateTime,default=datetime.utcnow)
class AuditEvent(Base):
 __tablename__='audit_events';id=Column(Integer,primary_key=True);event_type=Column(String);actor_id=Column(Integer);target_type=Column(String);target_id=Column(Integer);reason=Column(Text);severity=Column(String,default='INFO');metadata_json=Column(Text,default='{}');created_at=Column(DateTime,default=datetime.utcnow)
class ComplianceDocument(Base):
 __tablename__='compliance_documents';id=Column(Integer,primary_key=True);user_id=Column(Integer);category=Column(String);filename=Column(String);stored_name=Column(String);content_type=Column(String);issue_date=Column(String);expiry_date=Column(String);status=Column(String,default='PENDING');review_note=Column(Text);created_at=Column(DateTime,default=datetime.utcnow)

class RouteCalculation(Base):
 __tablename__='route_calculations';id=Column(Integer,primary_key=True);user_id=Column(Integer);token=Column(String,unique=True,index=True);origin_label=Column(Text);origin_public_label=Column(String);origin_latitude=Column(Float);origin_longitude=Column(Float);destination_label=Column(Text);destination_public_label=Column(String);destination_latitude=Column(Float);destination_longitude=Column(Float);distance_metres=Column(Integer);duration_seconds=Column(Integer);geometry_json=Column(Text);provider=Column(String);profile=Column(String);vehicle_profile=Column(String);expires_at=Column(DateTime);used=Column(Boolean,default=False);created_at=Column(DateTime,default=datetime.utcnow)

class EmailVerificationToken(Base):
 __tablename__='email_verification_tokens';id=Column(Integer,primary_key=True);user_id=Column(Integer);token_hash=Column(String,unique=True,index=True);expires_at=Column(DateTime);used_at=Column(DateTime);created_at=Column(DateTime,default=datetime.utcnow)
class PhoneOTP(Base):
 __tablename__='phone_otps';id=Column(Integer,primary_key=True);user_id=Column(Integer);salt=Column(String);code_hash=Column(String);expires_at=Column(DateTime);attempts=Column(Integer,default=0);used_at=Column(DateTime);created_at=Column(DateTime,default=datetime.utcnow)
class ContactReveal(Base):
 __tablename__='contact_reveals';id=Column(Integer,primary_key=True);job_id=Column(Integer);revealed_to=Column(Integer);reason=Column(String);created_at=Column(DateTime,default=datetime.utcnow);__table_args__=(UniqueConstraint('job_id','revealed_to'),)
class LoadEvidence(Base):
 __tablename__='load_evidence';id=Column(Integer,primary_key=True);load_id=Column(Integer);kind=Column(String);filename=Column(String);stored_name=Column(String);sha256=Column(String,index=True);created_at=Column(DateTime,default=datetime.utcnow)
