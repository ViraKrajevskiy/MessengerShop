"""SEO endpoints: dynamic sitemap.xml and robots.txt.

Served from the site root (not /api/) and proxied through nginx so crawlers
hit them at https://<host>/sitemap.xml and /robots.txt.

The base URL is derived from the incoming request host. This keeps links
correct whether the site runs on a bare IP (current VPS deploy) or on a real
domain later — no rebuild or config change needed. If SITE_DOMAIN is set to a
real domain in .env it takes precedence (canonical host for crawlers).
"""
from xml.sax.saxutils import escape

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from django.views.decorators.cache import cache_control

from Shop.models.models import Business, Product, News

# SPA routes that are public and worth indexing.
STATIC_PATHS = [
    ('/', '1.0', 'daily'),
    ('/catalog', '0.9', 'daily'),
    ('/feed', '0.8', 'hourly'),
    ('/pricing', '0.5', 'monthly'),
]

_PLACEHOLDER_DOMAINS = {'твой-домен.com', '101-school.uz'}


def _base_url(request):
    domain = (getattr(settings, 'SITE_DOMAIN', '') or '').strip()
    if domain and domain not in _PLACEHOLDER_DOMAINS:
        return f'https://{domain}'
    # No real domain configured yet — mirror whatever host the crawler used
    # (IP or domain), with the scheme nginx forwarded.
    return f'{request.scheme}://{request.get_host()}'


def _url_entry(base, path, lastmod=None, priority='0.6', changefreq='weekly'):
    parts = [f'<loc>{escape(base + path)}</loc>']
    if lastmod is not None:
        parts.append(f'<lastmod>{lastmod:%Y-%m-%d}</lastmod>')
    parts.append(f'<changefreq>{changefreq}</changefreq>')
    parts.append(f'<priority>{priority}</priority>')
    return '<url>' + ''.join(parts) + '</url>'


@cache_control(max_age=3600)
def sitemap_xml(request):
    base = _base_url(request)
    cache_key = f'sitemap_xml::{base}'
    cached = cache.get(cache_key)
    if cached is None:
        rows = [_url_entry(base, p, priority=pr, changefreq=cf)
                for p, pr, cf in STATIC_PATHS]

        for pk, updated in Business.objects.values_list('id', 'updated_at'):
            rows.append(_url_entry(base, f'/business/{pk}', updated, '0.8', 'weekly'))

        product_qs = Product.objects.filter(is_blocked=False, is_available=True)
        for pk, updated in product_qs.values_list('id', 'updated_at'):
            rows.append(_url_entry(base, f'/product/{pk}', updated, '0.7', 'weekly'))

        news_qs = News.objects.filter(is_published=True)
        for pk, updated in news_qs.values_list('id', 'updated_at'):
            rows.append(_url_entry(base, f'/news/{pk}', updated, '0.6', 'monthly'))

        cached = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + ''.join(rows) +
            '</urlset>'
        )
        cache.set(cache_key, cached, 3600)

    return HttpResponse(cached, content_type='application/xml')


@cache_control(max_age=3600)
def robots_txt(request):
    base = _base_url(request)
    body = (
        'User-agent: *\n'
        'Allow: /\n'
        'Disallow: /api/\n'
        'Disallow: /admin/\n'
        'Disallow: /moderator\n'
        'Disallow: /messenger\n'
        'Disallow: /dashboard\n'
        'Disallow: /me\n'
        'Disallow: /login\n'
        'Disallow: /register\n'
        'Disallow: /forgot-password\n'
        'Disallow: /reset-password\n'
        'Disallow: /verification\n'
        'Disallow: /complaint\n'
        '\n'
        f'Sitemap: {base}/sitemap.xml\n'
    )
    return HttpResponse(body, content_type='text/plain')
