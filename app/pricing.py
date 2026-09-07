def calculate(km,kind,vehicle,cold=False,special=False):
 base=1 if km<=100 else 2 if km<=300 else 3 if km<=700 else 4 if km<=1200 else 5;raw=base;why=[f"Distance band: {base} credit(s)"]
 if kind=="Full Load":raw+=1;why.append("Full load: +1")
 if kind=="Urgent":raw+=1;why.append("Urgent: +1")
 if kind=="Recurring Contract":raw+=2;why.append("Contract: +2")
 if any(x in vehicle.lower() for x in ['superlink','lowbed','abnormal']):raw+=1;why.append("Special vehicle: +1")
 if cold:raw+=1;why.append("Refrigerated: +1")
 if special:raw+=1;why.append("Special handling: +1")
 final=max(6,min(10,raw)) if kind=="Recurring Contract" else max(1,min(5,raw))
 if final!=raw:why.append(f"Pricing cap applied: {final}")
 return final,why
