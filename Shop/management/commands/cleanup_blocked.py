"""
Management command: cleanup_blocked

Deletes content that has been blocked for more than 4 days.
Run via cron every hour:
    0 * * * * python manage.py cleanup_blocked

Or schedule in Django settings with django-crontab / Celery beat.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from Shop.models import Post, Story, Comment, Product, Review

BLOCK_TTL_DAYS = 4


class Command(BaseCommand):
    help = 'Delete content blocked more than 4 days ago'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=BLOCK_TTL_DAYS)
        total = 0

        models_to_clean = [
            ('Post',    Post),
            ('Story',   Story),
            ('Comment', Comment),
            ('Product', Product),
            ('Review',  Review),
        ]

        for label, Model in models_to_clean:
            qs = Model.objects.filter(is_blocked=True, blocked_at__lte=cutoff)
            count, _ = qs.delete()
            total += count
            if count:
                self.stdout.write(f'  {label}: удалено {count}')

        self.stdout.write(
            self.style.SUCCESS(f'cleanup_blocked завершён. Всего удалено: {total}')
        )
