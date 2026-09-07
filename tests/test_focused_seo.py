from app.seo import slugs,page
from app.publishing import sitemap_xml
def test_only_focused_scope():
 allowed={'vehicle-transport','car-transport','bakkie-transport','non-running-vehicle-transport','tractor-transport','farm-implement-transport','agricultural-machinery-transport','heavy-equipment-transport','lowbed-transport','towing-and-recovery'}
 assert set(slugs())==allowed
def test_excluded_categories_not_published():
 xml=sitemap_xml().lower()
 for word in ['livestock','pallet','furniture','household-removals','general-freight']:assert word not in xml
def test_pages_have_cta_and_metadata():
 html=page('tractor-transport');assert 'meta name='description'' in html;assert 'Move My Tractor' in html;assert 'application/ld+json' in html
