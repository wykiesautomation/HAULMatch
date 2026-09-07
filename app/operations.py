from datetime import date
from fastapi import HTTPException
TRANSITIONS={"assigned":["EN_ROUTE_COLLECTION"],"en_route_collection":["ARRIVED_COLLECTION"],"arrived_collection":["LOADED"],"loaded":["IN_TRANSIT"],"in_transit":["DELAYED","ARRIVED_DELIVERY"],"delayed":["IN_TRANSIT","ARRIVED_DELIVERY"],"arrived_delivery":["DELIVERED"]}
STATES={"EN_ROUTE_COLLECTION":"en_route_collection","ARRIVED_COLLECTION":"arrived_collection","LOADED":"loaded","IN_TRANSIT":"in_transit","DELAYED":"delayed","ARRIVED_DELIVERY":"arrived_delivery","DELIVERED":"delivered"}
def expired(v):
 try:return date.fromisoformat(v)<date.today()
 except:return True
def check_transition(status,event):
 if event not in TRANSITIONS.get(status,[]):raise HTTPException(400,f"Invalid transition from {status}")
 return STATES[event]
def check_assignment(vehicle,driver,weight):
 if not vehicle or not vehicle.verified or vehicle.status!='available':raise HTTPException(400,'Verified available vehicle required')
 if not driver or not driver.verified or driver.status!='available':raise HTTPException(400,'Verified available driver required')
 if any(expired(x) for x in [vehicle.licence_expiry,vehicle.roadworthy_expiry,vehicle.insurance_expiry,driver.licence_expiry,driver.prdp_expiry]):raise HTTPException(400,'Compliance document expired or missing')
 kg=int(''.join(c for c in weight if c.isdigit()) or 0)
 if kg>vehicle.payload_kg:raise HTTPException(400,'Vehicle payload too low')
