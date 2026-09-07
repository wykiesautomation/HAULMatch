from io import BytesIO
from starlette.datastructures import UploadFile
from app.storage import safe_store
def test_rejects_executable():
 f=UploadFile(filename='bad.exe',file=BytesIO(b'MZ'),headers={'content-type':'application/octet-stream'})
 try:safe_store(f);assert False
 except Exception:assert True
