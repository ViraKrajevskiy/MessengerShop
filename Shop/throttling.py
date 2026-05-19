"""Throttle classes bound to a dedicated in-memory cache.

DRF's default throttles use the `default` cache, which here is a
DatabaseCache (`django_cache` table, created only by the separate
`createcachetable` command — `migrate` does NOT create it). Binding the
*global* throttles to that table means a missing table 500s the entire
API. Throttling tolerates a per-process cache, so use LocMem and keep
the DB cache only for the cross-worker pending-registration flow.
"""
from django.core.cache import caches
from rest_framework.throttling import (
    AnonRateThrottle, UserRateThrottle, ScopedRateThrottle,
)

_throttle_cache = caches['throttle']


class AnonThrottle(AnonRateThrottle):
    cache = _throttle_cache


class UserThrottle(UserRateThrottle):
    cache = _throttle_cache


class ScopedThrottle(ScopedRateThrottle):
    cache = _throttle_cache
