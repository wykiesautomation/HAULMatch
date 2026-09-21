import os
from dataclasses import dataclass
@dataclass(frozen=True)
class Settings:
 env:str=os.getenv('HAULMATCH_ENV','development')
 secret_key:str=os.getenv('HAULMATCH_SECRET_KEY','dev-change')
 database_url:str=os.getenv('HAULMATCH_DATABASE_URL','sqlite:///./haulmatch.db')
 public_url:str=os.getenv('HAULMATCH_PUBLIC_BASE_URL','http://127.0.0.1:8080').rstrip('/')
 allowed_hosts:tuple=tuple(x.strip() for x in os.getenv('HAULMATCH_ALLOWED_HOSTS','localhost,127.0.0.1').split(',') if x.strip())
 upload_dir:str=os.getenv('HAULMATCH_UPLOAD_DIR','/app/private_uploads')
 seed_demo:bool=os.getenv('HAULMATCH_SEED_DEMO','false').lower()=='true'
 payfast_mode:str=os.getenv('HAULMATCH_PAYFAST_MODE','disabled').strip().lower()
 payfast_merchant_id:str=os.getenv('HAULMATCH_PAYFAST_MERCHANT_ID','')
 payfast_merchant_key:str=os.getenv('HAULMATCH_PAYFAST_MERCHANT_KEY','')
 payfast_passphrase:str=os.getenv('HAULMATCH_PAYFAST_PASSPHRASE','')
 neon_data_api_url:str=os.getenv('HAULMATCH_NEON_DATA_API_URL','https://ep-fancy-union-b1hu0o27.apirest.c-5.eu-central-1.aws.neon.tech/neondb/rest/v1').rstrip('/')
 def validate(self):
  e=[]
  if self.env=='production' and (self.secret_key=='dev-change' or len(self.secret_key)<48):e.append('HAULMATCH_SECRET_KEY must contain at least 48 characters')
  if self.env=='production' and not self.database_url.startswith('postgresql'):e.append('Production database must use PostgreSQL')
  if self.env=='production' and not self.public_url.startswith('https://'):e.append('Production public URL must use HTTPS')
  if self.env=='production' and self.payfast_mode in ['live','production'] and not (self.payfast_merchant_id and self.payfast_merchant_key and self.payfast_passphrase):e.append('PayFast production credentials are incomplete')
  return e
settings=Settings()
