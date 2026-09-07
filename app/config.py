import os,secrets
from dataclasses import dataclass
@dataclass(frozen=True)
class Settings:
 env:str=os.getenv('HAULMATCH_ENV','development')
 secret_key:str=os.getenv('HAULMATCH_SECRET_KEY','dev-change')
 allowed_hosts:tuple=tuple(x.strip() for x in os.getenv('HAULMATCH_ALLOWED_HOSTS','127.0.0.1,localhost').split(',') if x.strip())
 cors_origins:tuple=tuple(x.strip() for x in os.getenv('HAULMATCH_CORS_ORIGINS','').split(',') if x.strip())
 force_https:bool=os.getenv('HAULMATCH_FORCE_HTTPS','false').lower()=='true'
 upload_dir:str=os.getenv('HAULMATCH_UPLOAD_DIR','./uploads')
 def validate(self):
  errors=[]
  if self.env=='production' and (self.secret_key=='dev-change' or len(self.secret_key)<48):errors.append('Production secret must be at least 48 characters')
  if self.env=='production' and '*' in self.allowed_hosts:errors.append('Wildcard hosts are prohibited in production')
  return errors
settings=Settings()
