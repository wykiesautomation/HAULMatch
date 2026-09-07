import os,httpx
BASE=os.getenv("HAULMATCH_ORS_BASE_URL","https://api.openrouteservice.org");KEY=os.getenv("HAULMATCH_ORS_API_KEY","");TIMEOUT=float(os.getenv("HAULMATCH_ROUTE_TIMEOUT_SECONDS","20"))
class RoutingError(Exception):pass
def status():return {"provider":"openrouteservice","configured":bool(KEY),"profile":"driving-hgv","key_exposed":False}
def search(query,limit=6):
 if not KEY:raise RoutingError("Add HAULMATCH_ORS_API_KEY to .env")
 try:
  r=httpx.get(BASE+"/geocode/autocomplete",params={"api_key":KEY,"text":query,"boundary.country":"ZA","size":limit},timeout=TIMEOUT);r.raise_for_status()
 except httpx.TimeoutException as e:raise RoutingError("Address lookup timed out") from e
 except Exception as e:raise RoutingError("Address lookup failed") from e
 out=[]
 for f in r.json().get("features",[]):
  c=f.get("geometry",{}).get("coordinates",[]);p=f.get("properties",{})
  if len(c)==2:out.append({"label":p.get("label",query),"public_label":", ".join(filter(None,[p.get("locality") or p.get("county"),p.get("region")])) or p.get("label",query),"longitude":c[0],"latitude":c[1],"provider_id":p.get("id","")})
 return out
def route(origin,destination,vehicle):
 if not KEY:raise RoutingError("Add HAULMATCH_ORS_API_KEY to .env")
 coords=[[origin["longitude"],origin["latitude"]],[destination["longitude"],destination["latitude"]]]
 try:
  r=httpx.post(BASE+"/v2/directions/driving-hgv/geojson",headers={"Authorization":KEY},json={"coordinates":coords,"instructions":False,"geometry":True},timeout=TIMEOUT);r.raise_for_status();f=r.json()["features"][0]
 except httpx.TimeoutException as e:raise RoutingError("Route calculation timed out") from e
 except Exception as e:raise RoutingError("Commercial route calculation failed") from e
 s=f["properties"]["summary"];seconds=int(s["duration"]);h,m=divmod(seconds//60,60)
 return {"distance_metres":int(s["distance"]),"distance_km":round(s["distance"]/1000,1),"duration_seconds":seconds,"duration_display":f"{h} hr {m} min","geometry":f["geometry"],"provider":"openrouteservice","profile":"driving-hgv","vehicle_profile":vehicle}
