from types import SimpleNamespace
from datetime import date,timedelta
from app.operations import validate_assignment,next_state
def future():return (date.today()+timedelta(days=90)).isoformat()
def test_assignment_and_transition():
 v=SimpleNamespace(verified=True,status='AVAILABLE',payload_kg=5000,licence_expiry=future(),roadworthy_expiry=future(),insurance_expiry=future())
 d=SimpleNamespace(verified=True,status='AVAILABLE',licence_expiry=future(),prdp_expiry=future())
 validate_assignment(v,d,'4500 kg')
 assert next_state('ASSIGNED','EN_ROUTE_COLLECTION')=='EN_ROUTE_COLLECTION'
