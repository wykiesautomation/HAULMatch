import threading,time
from collections import defaultdict,deque
from fastapi import HTTPException,Request
_lock=threading.Lock();_events=defaultdict(deque)
def throttle(request:Request,bucket:str,limit:int,window:int):
 key=f'{bucket}:{request.client.host if request.client else "unknown"}'
 now=time.time()
 with _lock:
  q=_events[key]
  while q and q[0]<now-window:q.popleft()
  if len(q)>=limit:raise HTTPException(429,'Too many attempts. Try again later.')
  q.append(now)
