from app.migration import normalise_status,reconcile_wallet
def test_status_and_wallet_reconciliation():
 assert normalise_status('appointed')=='APPOINTED'
 assert reconcile_wallet(10,[2,3],5)['ok'] is True
