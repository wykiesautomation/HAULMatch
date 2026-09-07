from datetime import datetime,timedelta
from .models import User,Load,Dispute,RiskFlag

def add_flag(db,user_id,rule,severity,description,load_id=None):
 existing=db.query(RiskFlag).filter_by(user_id=user_id,load_id=load_id,rule_code=rule,status='OPEN').first()
 if not existing:db.add(RiskFlag(user_id=user_id,load_id=load_id,severity=severity,rule_code=rule,description=description,status='OPEN'))

def evaluate_registration(db,user,ip=''):
 phone_count=db.query(User).filter(User.phone==user.phone,User.id!=user.id).count()
 if phone_count:add_flag(db,user.id,'DUPLICATE_PHONE','HIGH','Mobile number is linked to another account')
 domain=user.email.rsplit('@',1)[1]
 recent=db.query(User).filter(User.created_at>=datetime.utcnow()-timedelta(hours=1)).count() if hasattr(User,'created_at') else 0
 if recent>10:add_flag(db,user.id,'REGISTRATION_VELOCITY','MEDIUM','High recent registration volume')

def evaluate_load(db,load):
 recent=db.query(Load).filter(Load.owner_id==load.owner_id,Load.id!=load.id).count()
 if recent>=5:add_flag(db,load.owner_id,'LOAD_VELOCITY','MEDIUM','New account has posted many loads',load.id)
 disputes=db.query(Dispute).filter(Dispute.opened_by==load.owner_id).count()
 if disputes>=3:add_flag(db,load.owner_id,'DISPUTE_PATTERN','HIGH','Account is associated with repeated disputes',load.id)
