from dataclasses import dataclass
@dataclass(frozen=True)
class ImportResult:
    inserted:int=0
    updated:int=0
    skipped:int=0
    errors:int=0

def normalise_status(value):
    value=str(value or '').strip().upper()
    allowed={'NEW','PUBLISHED','MORE INFO REQUIRED','REJECTED','CLOSED','SUBMITTED','SHORTLISTED','APPOINTED','NOT SELECTED'}
    if value not in allowed: raise ValueError(f'Unsupported status: {value}')
    return value

def reconcile_wallet(opening_credits, unlock_costs, closing_credits):
    expected=int(opening_credits)-sum(int(x) for x in unlock_costs)
    return {'expected':expected,'actual':int(closing_credits),'ok':expected==int(closing_credits)}
