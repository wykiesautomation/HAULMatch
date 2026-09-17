def reconcile(opening, issued, debits, adjustments, actual):
 expected=int(opening)+int(issued)-int(debits)+int(adjustments)
 return {'opening':int(opening),'issued':int(issued),'debits':int(debits),'adjustments':int(adjustments),'expected':expected,'actual':int(actual),'balanced':expected==int(actual)}
