from app.config import Settings
def test_development_defaults_are_local():
 s=Settings();assert 'localhost' in s.allowed_hosts or '127.0.0.1' in s.allowed_hosts
