from pathlib import Path
def test_risk_rules_present():
 text=(Path(__file__).parents[1]/'app/risk_engine.py').read_text()
 for rule in ['DUPLICATE_PHONE','REGISTRATION_VELOCITY','LOAD_VELOCITY','DISPUTE_PATTERN']:assert rule in text
