import os
from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
from fastapi import Depends,HTTPException
from fastapi.security import HTTPBearer
from .database import get_db
from .models import User
p=CryptContext(schemes=['pbkdf2_sha256']);b=HTTPBearer(auto_error=False);S=os.getenv('HAULMATCH_SECRET_KEY','dev-change')
def hp(x):return p.hash(x)
def vp(x,h):return p.verify(x,h)
def tok(u):return jwt.encode({'sub':str(u.id),'exp':datetime.now(timezone.utc)+timedelta(hours=8)},S,algorithm='HS256')
def user(c=Depends(b),d=Depends(get_db)):
 if not c:raise HTTPException(401,'Sign in required')
 try:i=int(jwt.decode(c.credentials,S,algorithms=['HS256'])['sub'])
 except (JWTError,ValueError):raise HTTPException(401,'Invalid session')
 return d.get(User,i)
def roles(*r):
 def f(u=Depends(user)):
  if u.role not in r:raise HTTPException(403,'Role not permitted')
  return u
 return f
