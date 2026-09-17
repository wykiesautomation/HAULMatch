from datetime import date
from fastapi import HTTPException
TRANSITIONS={'ASSIGNED':['EN_ROUTE_COLLECTION'],'EN_ROUTE_COLLECTION':['ARRIVED_COLLECTION'],'ARRIVED_COLLECTION':['LOADED'],'LOADED':['IN_TRANSIT'],'IN_TRANSIT':['DELAYED','ARRIVED_DELIVERY'],'DELAYED':['IN_TRANSIT','ARRIVED_DELIVERY'],'ARRIVED_DELIVERY':['DELIVERED']}
def expired(value):
 try:return date.fromisoformat(value)<date.today()
 except Exception:return True
def validate_assignment(vehicle,driver,mass):
 if not vehicle or not vehicle.verified or vehicle.status!='AVAILABLE':raise HTTPException(400,'Verified available vehicle required')
 if not driver or not driver.verified or driver.status!='AVAILABLE':raise HTTPException(400,'Verified available driver required')
 if any(expired(x) for x in [vehicle.licence_expiry,vehicle.roadworthy_expiry,vehicle.insurance_expiry,driver.licence_expiry,driver.prdp_expiry]):raise HTTPException(400,'Compliance document expired or missing')
 kg=int(''.join(c for c in str(mass or '') if c.isdigit()) or 0)
 if kg and vehicle.payload_kg and kg>vehicle.payload_kg:raise HTTPException(400,'Vehicle payload too low')
def next_state(status,event):
 if event not in TRANSITIONS.get(status,[]):raise HTTPException(400,f'Invalid transition from {status}')
 return event
