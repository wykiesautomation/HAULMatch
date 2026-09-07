import hashlib,os,re
from pathlib import Path
from fastapi import UploadFile,HTTPException
from .config import settings
ROOT=Path(settings.upload_dir);ROOT.mkdir(parents=True,exist_ok=True)
ALLOWED={'image/jpeg':'.jpg','image/png':'.png','application/pdf':'.pdf'}
def save(file:UploadFile,max_mb=10):
 if file.content_type not in ALLOWED:raise HTTPException(400,'JPG, PNG or PDF only')
 data=file.file.read(max_mb*1024*1024+1)
 if len(data)>max_mb*1024*1024:raise HTTPException(400,'File too large')
 sha=hashlib.sha256(data).hexdigest();name=sha+ALLOWED[file.content_type];target=ROOT/name
 if not target.exists():target.write_bytes(data)
 return {'stored_name':name,'original_name':re.sub(r'[^A-Za-z0-9._ -]','_',Path(file.filename or 'upload').name)[:180],'sha256':sha,'bytes':len(data)}
