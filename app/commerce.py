from .models import WalletTransaction,Notification,AuditEvent
def audit(db,event,actor,target_type,target_id,reason='',severity='INFO',metadata='{}'):
 db.add(AuditEvent(event_type=event,actor_id=actor,target_type=target_type,target_id=target_id,reason=reason,severity=severity,metadata_json=metadata))
def notify(db,user_id,event,title,message):db.add(Notification(user_id=user_id,event_type=event,title=title,message=message))
def post_ledger(db,user,credits,direction,kind,reason,created_by=None,payment_id=None,load_id=None,dispute_id=None):
 before=user.credit_balance;after=before+credits if direction=='credit' else before-credits
 if after<0:raise ValueError('Insufficient credits')
 user.credit_balance=after;row=WalletTransaction(user_id=user.id,direction=direction,credits=credits,balance_before=before,balance_after=after,transaction_type=kind,reason=reason,created_by=created_by,payment_id=payment_id,load_id=load_id,dispute_id=dispute_id);db.add(row);return row
