import os
from app.payfast import signature
def test_signature_repeatable():
 fields={"merchant_id":"1","amount":"300.00","m_payment_id":"HMP-1"}
 assert signature(fields)==signature(fields)
