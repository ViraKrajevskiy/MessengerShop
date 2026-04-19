"""
Anti-abuse helper for views_count counters.

Dedups view increments per (authenticated user or client IP) × entity × id
within a configurable time window, and skips known crawler/preview bots.

Uses Django's default cache backend. In dev this is LocMemCache (per-process,
so with N gunicorn workers dedup is ~1/N accurate). In prod, switch the cache
backend to Redis for proper cross-worker dedup — no code changes needed here.
"""

from django.core.cache import cache
from django.db.models import F

# 6 hours: same viewer won't bump the counter again within this window
DEFAULT_WINDOW_SECONDS = 6 * 3600

# Common crawler / link-preview User-Agent fragments. Matched case-insensitively.
_BOT_UA_FRAGMENTS = (
    'bot', 'crawl', 'spider', 'slurp', 'mediapartners',
    'facebookexternalhit', 'whatsapp', 'telegrambot', 'twitterbot',
    'linkedinbot', 'embedly', 'quora link preview', 'pinterest',
    'slackbot', 'vkshare', 'discordbot', 'preview',
    'headlesschrome', 'python-requests', 'curl/', 'wget/',
    'go-http-client', 'okhttp', 'java/', 'scrapy',
)


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        # Left-most is the original client when behind a trusted proxy chain
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _is_bot(request):
    ua = (request.META.get('HTTP_USER_AGENT') or '').lower()
    if not ua:
        # No UA is a strong bot signal (real browsers always send one)
        return True
    return any(frag in ua for frag in _BOT_UA_FRAGMENTS)


def should_count_view(request, entity, entity_id, window_seconds=DEFAULT_WINDOW_SECONDS):
    """
    Return True if this request should increment the view counter.

    Rules:
      - Bots (by UA heuristic) never count.
      - Authenticated users are deduped by user_id.
      - Anonymous users are deduped by client IP.
      - Same viewer viewing the same entity won't count again for
        `window_seconds` seconds.
    """
    if _is_bot(request):
        return False

    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        viewer_key = f'u{user.id}'
    else:
        ip = _client_ip(request)
        if not ip:
            # Can't identify the viewer — don't count (safer than counting every hit)
            return False
        viewer_key = f'ip{ip}'

    cache_key = f'view:{entity}:{entity_id}:{viewer_key}'
    # cache.add() is atomic and returns True only if the key did NOT exist.
    # This gives us first-in-window wins semantics.
    return cache.add(cache_key, 1, timeout=window_seconds)


def bump_view(model_cls, pk, request, entity_name, window_seconds=DEFAULT_WINDOW_SECONDS):
    """
    Atomically increment model_cls(pk=pk).views_count by 1 if this request
    qualifies as a new view (see should_count_view for rules). No-op otherwise.
    """
    if should_count_view(request, entity_name, pk, window_seconds):
        model_cls.objects.filter(pk=pk).update(views_count=F('views_count') + 1)
