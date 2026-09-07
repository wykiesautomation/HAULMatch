from types import SimpleNamespace
from datetime import datetime,timedelta
from app.routing.tokens import valid
def test_token_owner_expiry_and_single_use():
 r=SimpleNamespace(user_id=4,used=False,expires_at=datetime.utcnow()+timedelta(minutes=5))
 assert valid(r,4);assert not valid(r,3);r.used=True;assert not valid(r,4)
