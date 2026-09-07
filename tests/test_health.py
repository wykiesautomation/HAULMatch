from app.health import health_payload
def test_health_payload_shape():
 d=health_payload();assert d['service']=='haulmatch-360';assert d['release']=='REV9'
