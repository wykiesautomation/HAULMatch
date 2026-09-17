import os,re
from datetime import datetime,timedelta,timezone
from passlib.context import CryptContext
from jose import jwt,JWTError
from fastapi import HTTPException,Depends
from fastapi.security import HTTPBearer
from .database import db
from .models import Account
from .config import settings
pwd=CryptContext(schemes=['pbkdf2_sha256']);bearer=HTTPBearer(auto_error=False)
def hash_password(v):return pwd.hash(v)
def verify_password(v,h):return pwd.verify(v,h)
def normalise_email(v):
 v=(v or '').strip().lower()
 if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$',v):raise HTTPException(400,'Invalid email')
 return v
def normalise_phone(v):
 d=re.sub(r'\D','',v or '')
 if d.startswith('27') and len(d)==11:return '+'+d
 if d.startswith('0') and len(d)==10:return '+27'+d[1:]
 raise HTTPException(400,'Invalid South African mobile number')
def token(a):return jwt.encode({'sub':str(a.id),'role':a.role,'exp':datetime.now(timezone.utc)+timedelta(hours=8)},settings.secret_key,algorithm='HS256')
def current(c=Depends(bearer),s=Depends(db)):
 if not c:raise HTTPException(401,'Authentication required')
 try:i=int(jwt.decode(c.credentials,settings.secret_key,algorithms=['HS256'])['sub'])
 except (JWTError,ValueError):raise HTTPException(401,'Invalid session')
 a=s.get(Account,i)
 if not a or not a.active:raise HTTPException(401,'Account unavailable')
 return a
def roles(*allowed):
 def check(a=Depends(current)):
  if a.role not in allowed:raise HTTPException(403,'Role not permitted')
  return a
 return check
