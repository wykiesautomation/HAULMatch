import hashlib,os,re
from pathlib import Path
from fastapi import HTTPException,UploadFile
ROOT=Path(os.getenv('HAULMATCH_UPLOAD_DIR','./uploads')).resolve();ROOT.mkdir(parents=True,exist_ok=True)
ALLOWED={'image/jpeg':'.jpg','image/png':'.png','application/pdf':'.pdf'}
def safe_store(file:UploadFile,max_mb:int=10):
 if file.content_type not in ALLOWED:raise HTTPException(400,'Only JPG, PNG and PDF files are allowed')
 data=file.file.read(max_mb*1024*1024+1)
 if len(data)>max_mb*1024*1024:raise HTTPException(400,'File exceeds upload limit')
 digest=hashlib.sha256(data).hexdigest();name=digest+ALLOWED[file.content_type];target=ROOT/name
 if not target.exists():target.write_bytes(data)
 original=re.sub(r'[^A-Za-z0-9._ -]','_',Path(file.filename or 'upload').name)[:180]
 return {'stored_name':name,'original_name':original,'sha256':digest,'bytes':len(data),'content_type':file.content_type}
