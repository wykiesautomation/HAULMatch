from datetime import datetime
from sqlalchemy import Column,Integer,String,Text,DateTime,Boolean,ForeignKey,UniqueConstraint
from .database import Base
class Account(Base):
 __tablename__='accounts';id=Column(Integer,primary_key=True);email=Column(String(320),unique=True,index=True,nullable=False);phone=Column(String(32),unique=True,index=True);full_name=Column(String(200));company=Column(String(200));role=Column(String(30),nullable=False);password_hash=Column(String(300),nullable=False);active=Column(Boolean,default=True);approved=Column(Boolean,default=False);email_verified_at=Column(DateTime);phone_verified_at=Column(DateTime);created_at=Column(DateTime,default=datetime.utcnow);credit_balance=Column(Integer,default=0)
class Lead(Base):
 __tablename__='leads';id=Column(Integer,primary_key=True);reference=Column(String(64),unique=True,index=True);owner_id=Column(Integer,ForeignKey('accounts.id'));transport_type=Column(String(120));description=Column(Text);collection_area=Column(String(200));delivery_area=Column(String(200));required_date=Column(String(20));mass=Column(String(100));dimensions=Column(String(150));status=Column(String(40),default='NEW');risk_score=Column(Integer,default=0);moderation_status=Column(String(40),default='PENDING REVIEW');private_json=Column(Text,default='{}');awarded_quote_id=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow);updated_at=Column(DateTime,default=datetime.utcnow)
class Quote(Base):
 __tablename__='quotes';id=Column(Integer,primary_key=True);reference=Column(String(64),unique=True,index=True);lead_id=Column(Integer,ForeignKey('leads.id'));transporter_id=Column(Integer,ForeignKey('accounts.id'));amount_cents=Column(Integer);vehicle=Column(String(200));terms=Column(Text);status=Column(String(40),default='SUBMITTED');created_at=Column(DateTime,default=datetime.utcnow);__table_args__=(UniqueConstraint('lead_id','transporter_id'),)
class CreditPack(Base):
 __tablename__='credit_packs';id=Column(Integer,primary_key=True);code=Column(String(50),unique=True);name=Column(String(100));credits=Column(Integer);price_cents=Column(Integer);active=Column(Boolean,default=True);sort_order=Column(Integer,default=0)
class PaymentOrder(Base):
 __tablename__='payment_orders';id=Column(Integer,primary_key=True);reference=Column(String(64),unique=True,index=True);account_id=Column(Integer,ForeignKey('accounts.id'));pack_id=Column(Integer,ForeignKey('credit_packs.id'));credits=Column(Integer);amount_cents=Column(Integer);currency=Column(String(10),default='ZAR');status=Column(String(40),default='CREATED');credited=Column(Boolean,default=False);payfast_reference=Column(String(120));created_at=Column(DateTime,default=datetime.utcnow);completed_at=Column(DateTime)
class PaymentNotification(Base):
 __tablename__='payment_notifications';id=Column(Integer,primary_key=True);notification_hash=Column(String(64),unique=True,index=True);payment_id=Column(Integer);valid=Column(Boolean);reason=Column(String(250));payload_json=Column(Text);created_at=Column(DateTime,default=datetime.utcnow)
class WalletTransaction(Base):
 __tablename__='wallet_ledger';id=Column(Integer,primary_key=True);account_id=Column(Integer,ForeignKey('accounts.id'));direction=Column(String(10));credits=Column(Integer);balance_before=Column(Integer);balance_after=Column(Integer);transaction_type=Column(String(60));reason=Column(String(250));payment_id=Column(Integer);lead_id=Column(Integer);dispute_id=Column(Integer);created_by=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class LeadUnlock(Base):
 __tablename__='lead_unlocks';id=Column(Integer,primary_key=True);lead_id=Column(Integer,ForeignKey('leads.id'));transporter_id=Column(Integer,ForeignKey('accounts.id'));credits_used=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow);__table_args__=(UniqueConstraint('lead_id','transporter_id'),)
class ContactReveal(Base):
 __tablename__='contact_reveals';id=Column(Integer,primary_key=True);lead_id=Column(Integer);revealed_to=Column(Integer);reason=Column(String(80));created_at=Column(DateTime,default=datetime.utcnow);__table_args__=(UniqueConstraint('lead_id','revealed_to'),)
class Dispute(Base):
 __tablename__='disputes';id=Column(Integer,primary_key=True);reference=Column(String(64),unique=True);unlock_id=Column(Integer);opened_by=Column(Integer);reason_code=Column(String(80));description=Column(Text);status=Column(String(40),default='OPEN');decision_note=Column(Text);refund_credits=Column(Integer,default=0);created_at=Column(DateTime,default=datetime.utcnow)
class Receipt(Base):
 __tablename__='receipts';id=Column(Integer,primary_key=True);reference=Column(String(64),unique=True);account_id=Column(Integer);payment_id=Column(Integer);description=Column(String(250));amount_cents=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class Audit(Base):
 __tablename__='audit';id=Column(Integer,primary_key=True);event=Column(String(100));actor_id=Column(Integer);reference=Column(String(64),index=True);detail=Column(Text);created_at=Column(DateTime,default=datetime.utcnow)

class Vehicle(Base):
 __tablename__='vehicles';id=Column(Integer,primary_key=True);owner_id=Column(Integer,ForeignKey('accounts.id'));registration=Column(String(80),unique=True,index=True);vehicle_type=Column(String(120));payload_kg=Column(Integer);status=Column(String(40),default='AVAILABLE');verified=Column(Boolean,default=False);licence_expiry=Column(String(20));roadworthy_expiry=Column(String(20));insurance_expiry=Column(String(20));created_at=Column(DateTime,default=datetime.utcnow)
class Driver(Base):
 __tablename__='drivers';id=Column(Integer,primary_key=True);owner_id=Column(Integer,ForeignKey('accounts.id'));full_name=Column(String(200));phone=Column(String(32));licence_number=Column(String(100));licence_class=Column(String(40));licence_expiry=Column(String(20));prdp_number=Column(String(100));prdp_expiry=Column(String(20));status=Column(String(40),default='AVAILABLE');verified=Column(Boolean,default=False);created_at=Column(DateTime,default=datetime.utcnow)
class Job(Base):
 __tablename__='jobs';id=Column(Integer,primary_key=True);reference=Column(String(64),unique=True,index=True);lead_id=Column(Integer,ForeignKey('leads.id'),unique=True);customer_id=Column(Integer,ForeignKey('accounts.id'));transporter_id=Column(Integer,ForeignKey('accounts.id'));vehicle_id=Column(Integer,ForeignKey('vehicles.id'));driver_id=Column(Integer,ForeignKey('drivers.id'));status=Column(String(50),default='AWARDED');customer_confirmed=Column(Boolean,default=False);created_at=Column(DateTime,default=datetime.utcnow);updated_at=Column(DateTime,default=datetime.utcnow)
class JobEvent(Base):
 __tablename__='job_events';id=Column(Integer,primary_key=True);job_id=Column(Integer,ForeignKey('jobs.id'));event_type=Column(String(80));note=Column(Text);actor_id=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class Incident(Base):
 __tablename__='incidents';id=Column(Integer,primary_key=True);job_id=Column(Integer,ForeignKey('jobs.id'));incident_type=Column(String(100));severity=Column(String(30));description=Column(Text);status=Column(String(40),default='OPEN');reported_by=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class Evidence(Base):
 __tablename__='evidence';id=Column(Integer,primary_key=True);job_id=Column(Integer,ForeignKey('jobs.id'));kind=Column(String(80));original_name=Column(String(200));stored_name=Column(String(200));sha256=Column(String(64),index=True);content_type=Column(String(100));uploaded_by=Column(Integer);created_at=Column(DateTime,default=datetime.utcnow)
class POD(Base):
 __tablename__='pods';id=Column(Integer,primary_key=True);job_id=Column(Integer,ForeignKey('jobs.id'),unique=True);receiver_name=Column(String(200));signature_name=Column(String(200));notes=Column(Text);delivered_at=Column(DateTime,default=datetime.utcnow);created_by=Column(Integer)
class Rating(Base):
 __tablename__='ratings';id=Column(Integer,primary_key=True);job_id=Column(Integer,ForeignKey('jobs.id'));from_account_id=Column(Integer);to_account_id=Column(Integer);score=Column(Integer);comment=Column(Text);created_at=Column(DateTime,default=datetime.utcnow);__table_args__=(UniqueConstraint('job_id','from_account_id'),)
class BackupVerification(Base):
 __tablename__='backup_verifications';id=Column(Integer,primary_key=True);backup_reference=Column(String(120));database_ok=Column(Boolean);uploads_ok=Column(Boolean);restore_tested=Column(Boolean,default=False);notes=Column(Text);created_at=Column(DateTime,default=datetime.utcnow)
