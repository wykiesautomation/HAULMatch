from app.reconciliation import reconcile
def test_reconcile():
 assert reconcile(10,25,7,2,30)['balanced'] is True
