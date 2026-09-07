from sqlalchemy import text
from .database import SessionLocal
def health_payload():
 database='down'
 try:
  d=SessionLocal();d.execute(text('SELECT 1'));d.close();database='up'
 except Exception:pass
 return {'status':'ok' if database=='up' else 'degraded','database':database,'service':'haulmatch-360','release':'REV9'}
