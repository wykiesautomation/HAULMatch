from .models import WalletTransaction,Audit
def post_ledger(s,account,credits,direction,kind,reason,**links):
 before=account.credit_balance or 0;after=before+credits if direction=='credit' else before-credits
 if after<0:raise ValueError('Insufficient credits')
 account.credit_balance=after;row=WalletTransaction(account_id=account.id,direction=direction,credits=credits,balance_before=before,balance_after=after,transaction_type=kind,reason=reason,payment_id=links.get('payment_id'),lead_id=links.get('lead_id'),dispute_id=links.get('dispute_id'),created_by=links.get('created_by'));s.add(row);return row
def audit(s,event,actor,reference,detail=''):s.add(Audit(event=event,actor_id=actor,reference=reference,detail=detail))
