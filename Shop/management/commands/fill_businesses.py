"""
python manage.py fill_businesses
Updates existing businesses: fills empty text fields (address, phone, website)
and downloads placeholder images for logo/cover/card_media.
"""
import io
import urllib.request
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from Shop.models.models import Business


FILL_DATA = {
    'beauty_anna': {
        'address': 'Beyoglu, Istiklal Cd. 12, Istanbul',
        'phone': '+90 212 555 01 01',
        'website': 'https://beauty-istanbul.ru',
        'logo_url': 'https://picsum.photos/id/119/400/400',
        'cover_url': 'https://picsum.photos/id/64/1200/400',
        'card_url': 'https://picsum.photos/id/96/600/400',
    },
    'istanbul_realty': {
        'address': 'Sisli, Buyukdere Cd. 88, Istanbul',
        'phone': '+90 212 555 02 02',
        'website': 'https://istanbul-realty.ru',
        'logo_url': 'https://picsum.photos/id/164/400/400',
        'cover_url': 'https://picsum.photos/id/274/1200/400',
        'card_url': 'https://picsum.photos/id/188/600/400',
    },
    'turkmed_clinic': {
        'address': 'Cankaya, Ataturk Blv. 45, Ankara',
        'phone': '+90 312 555 03 03',
        'website': 'https://turkmed.ru',
        'logo_url': 'https://picsum.photos/id/237/400/400',
        'cover_url': 'https://picsum.photos/id/342/1200/400',
        'card_url': 'https://picsum.photos/id/223/600/400',
    },
    'istanbul_lang': {
        'address': 'Fatih, Ordu Cd. 22, Istanbul',
        'phone': '+90 212 555 04 04',
        'website': 'https://istanbul-lang.ru',
        'logo_url': 'https://picsum.photos/id/20/400/400',
        'cover_url': 'https://picsum.photos/id/42/1200/400',
        'card_url': 'https://picsum.photos/id/28/600/400',
    },
    'vostok_finance': {
        'address': 'Levent, Buyukdere Cd. 145, Istanbul',
        'phone': '+90 212 555 05 05',
        'website': 'https://vostok-finance.tr',
        'logo_url': 'https://picsum.photos/id/380/400/400',
        'cover_url': 'https://picsum.photos/id/374/1200/400',
        'card_url': 'https://picsum.photos/id/366/600/400',
    },
    'istanbul_tours': {
        'address': 'Antalya, Ataturk Blv. 33',
        'phone': '+90 242 555 06 06',
        'website': 'https://istanbul-tours.ru',
        'logo_url': 'https://picsum.photos/id/318/400/400',
        'cover_url': 'https://picsum.photos/id/429/1200/400',
        'card_url': 'https://picsum.photos/id/399/600/400',
    },
    'turk_legal': {
        'address': 'Besiktas, Barbaros Blv. 18, Istanbul',
        'phone': '+90 212 555 07 07',
        'website': 'https://turklegal.ru',
        'logo_url': 'https://picsum.photos/id/160/400/400',
        'cover_url': 'https://picsum.photos/id/152/1200/400',
        'card_url': 'https://picsum.photos/id/147/600/400',
    },
    'bosphorus_kitchen': {
        'address': 'Uskudar, Icadiye Cd. 7, Istanbul',
        'phone': '+90 212 555 08 08',
        'website': '',
        'logo_url': 'https://picsum.photos/id/225/400/400',
        'cover_url': 'https://picsum.photos/id/219/1200/400',
        'card_url': 'https://picsum.photos/id/213/600/400',
    },
    'turk_auto': {
        'address': 'Kadikoy, Bagdat Cd. 55, Istanbul',
        'phone': '+90 212 555 09 09',
        'website': 'https://turkauto.ru',
        'logo_url': 'https://picsum.photos/id/133/400/400',
        'cover_url': 'https://picsum.photos/id/111/1200/400',
        'card_url': 'https://picsum.photos/id/171/600/400',
    },
    'pixel_studio': {
        'address': 'Beyoglu, Mesrutiyet Cd. 40, Istanbul',
        'phone': '+90 212 555 10 10',
        'website': 'https://pixel-studio.tr',
        'logo_url': 'https://picsum.photos/id/0/400/400',
        'cover_url': 'https://picsum.photos/id/2/1200/400',
        'card_url': 'https://picsum.photos/id/4/600/400',
    },
    'iron_gym_istanbul': {
        'address': 'Besiktas, Sinanpasa Mah. 12, Istanbul',
        'phone': '+90 212 555 11 11',
        'website': 'https://iron-gym.tr',
        'logo_url': 'https://picsum.photos/id/195/400/400',
        'cover_url': 'https://picsum.photos/id/175/1200/400',
        'card_url': 'https://picsum.photos/id/180/600/400',
    },
    'antalya_kitchen': {
        'address': 'Muratpasa, Ismet Inonu Blv. 78, Antalya',
        'phone': '+90 242 555 12 12',
        'website': 'https://antalya-kitchen.tr',
        'logo_url': 'https://picsum.photos/id/292/400/400',
        'cover_url': 'https://picsum.photos/id/312/1200/400',
        'card_url': 'https://picsum.photos/id/326/600/400',
    },
    'foto_istanbul': {
        'address': 'Beyoglu, Siraselviler Cd. 8, Istanbul',
        'phone': '+90 212 555 13 13',
        'website': 'https://foto-istanbul.ru',
        'logo_url': 'https://picsum.photos/id/250/400/400',
        'cover_url': 'https://picsum.photos/id/256/1200/400',
        'card_url': 'https://picsum.photos/id/260/600/400',
    },
    'techmarket_ist': {
        'address': 'Kadikoy, Moda Cd. 22, Istanbul',
        'phone': '+90 212 555 14 14',
        'website': 'https://techmarket-ist.tr',
        'logo_url': 'https://picsum.photos/id/60/400/400',
        'cover_url': 'https://picsum.photos/id/48/1200/400',
        'card_url': 'https://picsum.photos/id/36/600/400',
    },
}


def _download(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.read()
    except Exception as e:
        return None


class Command(BaseCommand):
    help = 'Fill empty fields on existing businesses (address, phone, website, images)'

    def handle(self, *args, **options):
        businesses = Business.objects.select_related('owner').all()
        updated = 0

        for biz in businesses:
            username = biz.owner.username
            data = FILL_DATA.get(username)
            if not data:
                self.stdout.write(f'  [skip] {biz.brand_name} (owner={username}) — no fill data')
                continue

            changed = False

            if not biz.address and data.get('address'):
                biz.address = data['address']
                changed = True
            if not biz.phone and data.get('phone'):
                biz.phone = data['phone']
                changed = True
            if not biz.website and data.get('website'):
                biz.website = data['website']
                changed = True

            if not biz.logo and data.get('logo_url'):
                img = _download(data['logo_url'])
                if img:
                    biz.logo.save(f'{username}_logo.jpg', ContentFile(img), save=False)
                    changed = True
                    self.stdout.write(f'    [+] logo for {biz.brand_name}')

            if not biz.cover and data.get('cover_url'):
                img = _download(data['cover_url'])
                if img:
                    biz.cover.save(f'{username}_cover.jpg', ContentFile(img), save=False)
                    changed = True
                    self.stdout.write(f'    [+] cover for {biz.brand_name}')

            if not biz.card_media and data.get('card_url'):
                img = _download(data['card_url'])
                if img:
                    biz.card_media.save(f'{username}_card.jpg', ContentFile(img), save=False)
                    changed = True
                    self.stdout.write(f'    [+] card_media for {biz.brand_name}')

            if changed:
                biz.save()
                updated += 1
                self.stdout.write(self.style.SUCCESS(f'  [OK] {biz.brand_name}'))
            else:
                self.stdout.write(f'  [~] {biz.brand_name} — already filled')

        self.stdout.write(self.style.SUCCESS(f'\nDone. Updated {updated} businesses.'))
