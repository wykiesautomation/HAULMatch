import os
from datetime import date
from xml.sax.saxutils import escape
from .seo import slugs
BASE=os.getenv("HAULMATCH_PUBLIC_BASE_URL","http://127.0.0.1:8080").rstrip("/")
def public_paths():return ["/"]+["/"+x for x in slugs()]+["/legal/terms","/legal/privacy","/legal/credits"]
def robots_text():return f"User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /docs\nDisallow: /uploads/\nDisallow: /admin/\nSitemap: {BASE}/sitemap.xml\n"
def sitemap_xml():
 today=date.today().isoformat();rows=[]
 for path in public_paths():
  priority="1.0" if path=="/" else "0.8" if path not in ["/legal/terms","/legal/privacy","/legal/credits"] else "0.3"
  rows.append(f"<url><loc>{escape(BASE+path)}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>{priority}</priority></url>")
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(rows)+'</urlset>'
