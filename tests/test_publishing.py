from app.publishing import robots_text,sitemap_xml
def test_robots_blocks_private_paths():
 text=robots_text();assert "Disallow: /api/" in text;assert "sitemap.xml" in text
def test_sitemap_has_public_legal_pages_only():
 xml=sitemap_xml();assert "/legal/privacy" in xml;assert "/api/" not in xml
