from types import SimpleNamespace
class Session:
 def add(self,x):self.last=x
from app.commerce import post_ledger
def test_ledger_credit_and_debit():
 a=SimpleNamespace(id=1,credit_balance=10);s=Session();post_ledger(s,a,5,'credit','TEST','test');assert a.credit_balance==15;post_ledger(s,a,3,'debit','TEST','test');assert a.credit_balance==12
