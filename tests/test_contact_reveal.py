from pathlib import Path
def test_contact_reveal_endpoint_exists_and_is_audited():
 text=(Path(__file__).parents[1]/'app/main.py').read_text()
 assert "/api/jobs/{jid}/contact" in text
 assert "CONTACT_REVEALED" in text
 assert "revealed_to=u.id" in text
