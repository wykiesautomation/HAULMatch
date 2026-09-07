import os,time,uuid
from collections import defaultdict,deque
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from .config import settings
class RequestContextMiddleware(BaseHTTPMiddleware):
 async def dispatch(self,request:Request,call_next):
  request_id=request.headers.get('X-Request-ID') or str(uuid.uuid4());start=time.monotonic()
  response=await call_next(request);response.headers['X-Request-ID']=request_id;response.headers['X-Process-Time-Ms']=str(round((time.monotonic()-start)*1000,1));return response
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
 async def dispatch(self,request,call_next):
  response=await call_next(request)
  response.headers['X-Content-Type-Options']='nosniff';response.headers['X-Frame-Options']='DENY';response.headers['Referrer-Policy']='strict-origin-when-cross-origin';response.headers['Permissions-Policy']='camera=(), microphone=(), geolocation=(self)';response.headers['Content-Security-Policy']="default-src 'self'; img-src 'self' data: https://*.tile.openstreetmap.org; style-src 'self' 'unsafe-inline' https://unpkg.com; script-src 'self' 'unsafe-inline' https://unpkg.com; connect-src 'self'" 
  if settings.force_https:response.headers['Strict-Transport-Security']='max-age=31536000; includeSubDomains'
  return response
