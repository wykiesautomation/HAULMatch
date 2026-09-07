import secrets
from datetime import datetime,timedelta
def issue():return secrets.token_urlsafe(32),datetime.utcnow()+timedelta(minutes=30)
def valid(record,user_id):return bool(record and record.user_id==user_id and not record.used and record.expires_at>datetime.utcnow())
