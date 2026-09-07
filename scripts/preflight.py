import os,sys
from app.config import settings
errors=settings.validate()
required=['HAULMATCH_DATABASE_URL','HAULMATCH_PAYFAST_MERCHANT_ID','HAULMATCH_PAYFAST_MERCHANT_KEY','HAULMATCH_PAYFAST_NOTIFY_URL','HAULMATCH_ORS_API_KEY','HAULMATCH_PUBLIC_BASE_URL']
if settings.env=='production':
 for name in required:
  if not os.getenv(name):errors.append(f'Missing {name}')
if errors:
 print('PREFLIGHT FAILED')
 for e in errors:print(' -',e)
 sys.exit(1)
print('PREFLIGHT PASSED')
