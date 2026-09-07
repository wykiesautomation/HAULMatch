import pytest
from app.trust import normalise_email,normalise_sa_phone,otp_hash,verify_otp
def test_phone_normalisation():
 assert normalise_sa_phone('082 123 4567')=='+27821234567'
 assert normalise_sa_phone('+27 82 123 4567')=='+27821234567'
def test_disposable_email_blocked():
 with pytest.raises(ValueError):normalise_email('fake@mailinator.com')
def test_otp_hash_verification():
 h=otp_hash('123456','salt');assert verify_otp('123456','salt',h);assert not verify_otp('654321','salt',h)
