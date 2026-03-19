"""
python manage.py seed          — создать тестовые данные
python manage.py seed --clear  — сначала удалить всё, потом создать
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from Shop.models import User, Business, Story, Product


# ── Тестовые бизнесы ──────────────────────────────────────────────────────────

BUSINESSES = [
    {
        'username': 'beauty_anna',
        'email': 'beauty_anna@test.ru',
        'city_user': 'Стамбул',
        'brand_name': 'Beauty Studio Istanbul',
        'description': 'Профессиональный салон красоты в сердце Стамбула. Стрижки, окрашивание, маникюр, уход за кожей. Работаем с 2018 года.',
        'category': 'BEAUTY',
        'city': 'Стамбул',
        'address': 'Beyoğlu, İstiklal Cd. 12, İstanbul',
        'phone': '+90 212 555 01 01',
        'website': 'https://beauty-istanbul.ru',
        'is_vip': True,
        'is_verified': True,
        'rating': '4.90',
        'logo_url': 'https://picsum.photos/id/1027/200/200',
        'cover_url': 'https://picsum.photos/id/1027/1200/400',
        'products': [
            {'name': 'Стрижка + укладка', 'price': '800', 'currency': 'TRY', 'desc': 'Профессиональная стрижка любой сложности с укладкой', 'img': 'https://picsum.photos/id/119/400/300'},
            {'name': 'Окрашивание волос', 'price': '2500', 'currency': 'TRY', 'desc': 'Стойкое окрашивание, балаяж, омбре, мелирование', 'img': 'https://picsum.photos/id/137/400/300'},
            {'name': 'Маникюр + педикюр', 'price': '1200', 'currency': 'TRY', 'desc': 'Аппаратный маникюр, гель-лак, дизайн', 'img': 'https://picsum.photos/id/145/400/300'},
            {'name': 'Уход за лицом', 'price': '1800', 'currency': 'TRY', 'desc': 'Профессиональный уход, чистка, пилинг', 'img': 'https://picsum.photos/id/177/400/300'},
            {'name': 'Восковая депиляция', 'price': '600', 'currency': 'TRY', 'desc': 'Депиляция воском всех зон', 'img': 'https://picsum.photos/id/155/400/300'},
        ],
        'stories': [
            {'caption': '✨ Новая коллекция цветов этого сезона!', 'url': 'https://picsum.photos/id/64/600/900'},
            {'caption': '💇‍♀️ Скидки до 30% на все процедуры в апреле', 'url': 'https://picsum.photos/id/96/600/900'},
            {'caption': '🌸 До и после — результат говорит сам за себя', 'url': 'https://picsum.photos/id/217/600/900'},
        ],
    },
    {
        'username': 'istanbul_realty',
        'email': 'istanbul_realty@test.ru',
        'city_user': 'Стамбул',
        'brand_name': 'Istanbul Realty Group',
        'description': 'Агентство недвижимости №1 для русскоязычных покупателей. Квартиры, виллы, коммерческая недвижимость по всей Турции. Помощь с ВНЖ.',
        'category': 'REALTY',
        'city': 'Стамбул',
        'address': 'Şişli, Büyükdere Cd. 88, İstanbul',
        'phone': '+90 212 555 02 02',
        'website': 'https://istanbul-realty.ru',
        'is_vip': True,
        'is_verified': True,
        'rating': '4.80',
        'logo_url': 'https://picsum.photos/id/1012/200/200',
        'cover_url': 'https://picsum.photos/id/1012/1200/400',
        'products': [
            {'name': 'Студия в центре Стамбула', 'price': '95000', 'currency': 'USD', 'desc': '45 кв.м., 15-й этаж, вид на Босфор, новостройка 2023 г.', 'img': 'https://picsum.photos/id/164/400/300'},
            {'name': '2+1 квартира, Кадыкёй', 'price': '145000', 'currency': 'USD', 'desc': '78 кв.м., 3-й этаж, рядом с метро, отличный район', 'img': 'https://picsum.photos/id/188/400/300'},
            {'name': 'Вилла в Анталье', 'price': '280000', 'currency': 'USD', 'desc': '250 кв.м., бассейн, 5 минут от моря, садовый участок', 'img': 'https://picsum.photos/id/365/400/300'},
            {'name': 'Коммерческая площадь', 'price': '3500', 'currency': 'USD', 'desc': 'Аренда офиса 120 кв.м. в бизнес-центре класса А, в месяц', 'img': 'https://picsum.photos/id/260/400/300'},
            {'name': 'Помощь с ВНЖ + покупкой', 'price': '1500', 'currency': 'USD', 'desc': 'Полное юридическое сопровождение сделки и оформление ВНЖ', 'img': 'https://picsum.photos/id/180/400/300'},
        ],
        'stories': [
            {'caption': '🏠 Новые объекты этой недели — Кадыкёй и Бейоглу', 'url': 'https://picsum.photos/id/274/600/900'},
            {'caption': '🌊 Вилла у моря в Анталье — осталось 2 объекта', 'url': 'https://picsum.photos/id/312/600/900'},
        ],
    },
    {
        'username': 'turkmed_clinic',
        'email': 'turkmed_clinic@test.ru',
        'city_user': 'Анкара',
        'brand_name': 'TürkMed Clinic',
        'description': 'Современная клиника для русскоязычных пациентов в Анкаре. Терапия, стоматология, офтальмология. Работаем с переводчиком.',
        'category': 'HEALTH',
        'city': 'Анкара',
        'address': 'Çankaya, Atatürk Blv. 45, Ankara',
        'phone': '+90 312 555 03 03',
        'website': 'https://turkmed.ru',
        'is_vip': True,
        'is_verified': True,
        'rating': '4.75',
        'logo_url': 'https://picsum.photos/id/1025/200/200',
        'cover_url': 'https://picsum.photos/id/1025/1200/400',
        'products': [
            {'name': 'Консультация терапевта', 'price': '500', 'currency': 'TRY', 'desc': 'Первичная консультация с переводчиком, анализ жалоб, направление', 'img': 'https://picsum.photos/id/237/400/300'},
            {'name': 'Стоматология — осмотр', 'price': '0', 'currency': 'TRY', 'desc': 'Бесплатный осмотр, рентген, план лечения', 'img': 'https://picsum.photos/id/223/400/300'},
            {'name': 'Проверка зрения', 'price': '300', 'currency': 'TRY', 'desc': 'Осмотр офтальмолога, подбор очков или линз', 'img': 'https://picsum.photos/id/239/400/300'},
            {'name': 'Комплексный анализ крови', 'price': '800', 'currency': 'TRY', 'desc': '50+ показателей, результат за 24 часа', 'img': 'https://picsum.photos/id/205/400/300'},
        ],
        'stories': [
            {'caption': '🩺 Акция: бесплатная консультация стоматолога весь апрель', 'url': 'https://picsum.photos/id/342/600/900'},
            {'caption': '💊 Новое оборудование — УЗИ нового поколения', 'url': 'https://picsum.photos/id/326/600/900'},
        ],
    },
    {
        'username': 'istanbul_lang',
        'email': 'istanbul_lang@test.ru',
        'city_user': 'Стамбул',
        'brand_name': 'Istanbul Language School',
        'description': 'Языковая школа для русскоязычных. Турецкий, английский, арабский. Группы и индивидуальные занятия. Онлайн и офлайн форматы.',
        'category': 'EDUCATION',
        'city': 'Стамбул',
        'address': 'Fatih, Ordu Cd. 22, İstanbul',
        'phone': '+90 212 555 04 04',
        'website': 'https://istanbul-lang.ru',
        'is_vip': False,
        'is_verified': True,
        'rating': '4.60',
        'logo_url': 'https://picsum.photos/id/1074/200/200',
        'cover_url': 'https://picsum.photos/id/1074/1200/400',
        'products': [
            {'name': 'Турецкий A1 (группа)', 'price': '3500', 'currency': 'TRY', 'desc': '20 занятий по 90 мин., группа до 8 человек, сертификат', 'img': 'https://picsum.photos/id/20/400/300'},
            {'name': 'Турецкий индивидуально', 'price': '800', 'currency': 'TRY', 'desc': 'Занятие 60 минут с носителем языка, любой уровень', 'img': 'https://picsum.photos/id/42/400/300'},
            {'name': 'Английский для бизнеса', 'price': '4200', 'currency': 'TRY', 'desc': 'Курс 16 занятий по деловому английскому', 'img': 'https://picsum.photos/id/28/400/300'},
            {'name': 'Подготовка к TÖMER', 'price': '5500', 'currency': 'TRY', 'desc': 'Интенсивная подготовка к экзамену на ВНЖ, 95% сдают с 1 раза', 'img': 'https://picsum.photos/id/36/400/300'},
        ],
        'stories': [
            {'caption': '📚 Набор в группы турецкого языка — старт 1 мая', 'url': 'https://picsum.photos/id/20/600/900'},
            {'caption': '🎓 Наши студенты сдали TÖMER — поздравляем!', 'url': 'https://picsum.photos/id/42/600/900'},
        ],
    },
    {
        'username': 'vostok_finance',
        'email': 'vostok_finance@test.ru',
        'city_user': 'Стамбул',
        'brand_name': 'Восток Финанс',
        'description': 'Финансовые и бухгалтерские услуги для русскоязычных предпринимателей в Турции. Открытие компании, учёт, налоги, аудит.',
        'category': 'FINANCE',
        'city': 'Стамбул',
        'address': 'Levent, Büyükdere Cd. 145, İstanbul',
        'phone': '+90 212 555 05 05',
        'website': 'https://vostok-finance.tr',
        'is_vip': False,
        'is_verified': False,
        'rating': '4.50',
        'logo_url': 'https://picsum.photos/id/1035/200/200',
        'cover_url': 'https://picsum.photos/id/1035/1200/400',
        'products': [
            {'name': 'Открытие ООО (Ltd.) в Турции', 'price': '15000', 'currency': 'TRY', 'desc': 'Регистрация компании под ключ — 5 рабочих дней', 'img': 'https://picsum.photos/id/380/400/300'},
            {'name': 'Ежемесячная бухгалтерия', 'price': '3000', 'currency': 'TRY', 'desc': 'Полное ведение учёта, налоговые декларации, в месяц', 'img': 'https://picsum.photos/id/374/400/300'},
            {'name': 'Налоговая консультация', 'price': '1500', 'currency': 'TRY', 'desc': 'Оптимизация налогов, консультация 90 минут', 'img': 'https://picsum.photos/id/366/400/300'},
            {'name': 'Аудит за год', 'price': '8000', 'currency': 'TRY', 'desc': 'Полный аудит финансовой отчётности за год', 'img': 'https://picsum.photos/id/358/400/300'},
        ],
        'stories': [
            {'caption': '💼 Открытие компании в Турции — всего за 5 дней', 'url': 'https://picsum.photos/id/349/600/900'},
        ],
    },
    {
        'username': 'istanbul_tours',
        'email': 'istanbul_tours@test.ru',
        'city_user': 'Анталья',
        'brand_name': 'Istanbul Tours & Travel',
        'description': 'Организация туров по Турции на русском языке. Экскурсии в Стамбуле, Каппадокия, Памуккале, сафари. Индивидуальные и групповые туры.',
        'category': 'TOURISM',
        'city': 'Анталья',
        'address': 'Antalya, Atatürk Blv. 33',
        'phone': '+90 242 555 06 06',
        'website': 'https://istanbul-tours.ru',
        'is_vip': False,
        'is_verified': True,
        'rating': '4.85',
        'logo_url': 'https://picsum.photos/id/1062/200/200',
        'cover_url': 'https://picsum.photos/id/1062/1200/400',
        'products': [
            {'name': 'Тур по Стамбулу (1 день)', 'price': '2500', 'currency': 'TRY', 'desc': 'Айя-София, Голубая мечеть, Гранд Базар, Босфор. Гид на русском.', 'img': 'https://picsum.photos/id/318/400/300'},
            {'name': 'Каппадокия (3 дня)', 'price': '15000', 'currency': 'TRY', 'desc': 'Перелёт, отель, полёт на шаре, экскурсии. Всё включено.', 'img': 'https://picsum.photos/id/429/400/300'},
            {'name': 'Памуккале + Эфес', 'price': '4500', 'currency': 'TRY', 'desc': 'Белые террасы, древний Эфес, термальный отдых. 1 день.', 'img': 'https://picsum.photos/id/399/400/300'},
            {'name': 'Морская прогулка Босфор', 'price': '800', 'currency': 'TRY', 'desc': 'Закатная прогулка на яхте с ужином, 2 часа', 'img': 'https://picsum.photos/id/396/400/300'},
        ],
        'stories': [
            {'caption': '🎈 Полёт на воздушном шаре — незабываемые впечатления!', 'url': 'https://picsum.photos/id/318/600/900'},
            {'caption': '🕌 Айя-София на закате — магия Стамбула', 'url': 'https://picsum.photos/id/429/600/900'},
            {'caption': '🌊 Босфор с воды — лучший вид на два континента', 'url': 'https://picsum.photos/id/399/600/900'},
        ],
    },
    {
        'username': 'turk_legal',
        'email': 'turk_legal@test.ru',
        'city_user': 'Стамбул',
        'brand_name': 'TurkLegal — Юридические услуги',
        'description': 'Юридическая помощь русскоязычным в Турции. ВНЖ, гражданство, трудовые споры, сделки с недвижимостью, перевод документов.',
        'category': 'LEGAL',
        'city': 'Стамбул',
        'address': 'Beşiktaş, Barbaros Blv. 18, İstanbul',
        'phone': '+90 212 555 07 07',
        'website': 'https://turklegal.ru',
        'is_vip': False,
        'is_verified': False,
        'rating': '4.70',
        'logo_url': 'https://picsum.photos/id/1064/200/200',
        'cover_url': 'https://picsum.photos/id/1064/1200/400',
        'products': [
            {'name': 'Оформление ВНЖ', 'price': '5000', 'currency': 'TRY', 'desc': 'Полное сопровождение получения вида на жительство, под ключ', 'img': 'https://picsum.photos/id/160/400/300'},
            {'name': 'Юридическая консультация', 'price': '1000', 'currency': 'TRY', 'desc': 'Консультация 60 мин. по любому правовому вопросу', 'img': 'https://picsum.photos/id/152/400/300'},
            {'name': 'Регистрация бизнеса', 'price': '8000', 'currency': 'TRY', 'desc': 'Открытие ИП или ООО, постановка на налоговый учёт', 'img': 'https://picsum.photos/id/147/400/300'},
            {'name': 'Перевод документов', 'price': '500', 'currency': 'TRY', 'desc': 'Нотариально заверенный перевод, 1 страница', 'img': 'https://picsum.photos/id/143/400/300'},
        ],
        'stories': [
            {'caption': '⚖️ Успешно оформили ВНЖ для 12 клиентов за март', 'url': 'https://picsum.photos/id/160/600/900'},
        ],
    },
    {
        'username': 'bosphorus_kitchen',
        'email': 'bosphorus_kitchen@test.ru',
        'city_user': 'Стамбул',
        'brand_name': 'Bosphorus Kitchen',
        'description': 'Доставка домашней еды и кейтеринг для русскоязычных в Стамбуле. Турецкая и русская кухня. Доставка ежедневно с 10:00 до 22:00.',
        'category': 'FOOD',
        'city': 'Стамбул',
        'address': 'Üsküdar, İcadiye Cd. 7, İstanbul',
        'phone': '+90 212 555 08 08',
        'website': '',
        'is_vip': False,
        'is_verified': False,
        'rating': '4.95',
        'logo_url': 'https://picsum.photos/id/1084/200/200',
        'cover_url': 'https://picsum.photos/id/1084/1200/400',
        'products': [
            {'name': 'Плов по-узбекски (порция)', 'price': '350', 'currency': 'TRY', 'desc': 'Настоящий плов с бараниной, морковью, нутом. Порция 500 г', 'img': 'https://picsum.photos/id/225/400/300'},
            {'name': 'Манты (20 шт.)', 'price': '280', 'currency': 'TRY', 'desc': 'Домашние манты с говядиной, сметана в подарок', 'img': 'https://picsum.photos/id/219/400/300'},
            {'name': 'Турецкий завтрак (на 2)', 'price': '650', 'currency': 'TRY', 'desc': 'Сыры, оливки, яйца, мёд, варенье, хлеб, чай', 'img': 'https://picsum.photos/id/213/400/300'},
            {'name': 'Кейтеринг — мероприятие', 'price': '500', 'currency': 'TRY', 'desc': 'Выездное обслуживание мероприятий, цена за персону', 'img': 'https://picsum.photos/id/207/400/300'},
            {'name': 'Борщ домашний (1 л)', 'price': '200', 'currency': 'TRY', 'desc': 'Настоящий борщ по-домашнему, на говяжьем бульоне', 'img': 'https://picsum.photos/id/201/400/300'},
        ],
        'stories': [
            {'caption': '🍽️ Сегодня готовим плов — принимаем заказы до 18:00', 'url': 'https://picsum.photos/id/225/600/900'},
            {'caption': '🫕 Новое меню: турецкий завтрак с доставкой', 'url': 'https://picsum.photos/id/219/600/900'},
        ],
    },
]


class Command(BaseCommand):
    help = 'Заполнить базу тестовыми данными (бизнесы, товары, сторисы)'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Удалить старые seed-данные перед созданием')

    def _out(self, msg):
        """Безопасный вывод — заменяет символы не из cp1251 на '?'"""
        try:
            self.stdout.write(msg)
        except UnicodeEncodeError:
            safe = msg.encode('cp1251', errors='replace').decode('cp1251')
            self.stdout.write(safe)

    def handle(self, *args, **options):
        out = self._out   # короткий алиас

        if options['clear']:
            out('[SEED] Udalyaem starye dannye...')
            emails = [b['email'] for b in BUSINESSES]
            User.objects.filter(email__in=emails).delete()
            out('[SEED] Gotovo.')

        created_count = {'users': 0, 'biz': 0, 'products': 0, 'stories': 0}

        for data in BUSINESSES:
            # Пользователь
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'role': User.Role.BUSINESS,
                    'city': data['city_user'],
                    'is_active': True,
                },
            )
            if created:
                user.set_password('test1234!')
                user.save()
                created_count['users'] += 1
                out(f'  [+] Polzovatel: {user.email}')
            else:
                out(f'  [~] Polzovatel uzhe est: {user.email}')

            # Бизнес-профиль
            biz, biz_created = Business.objects.get_or_create(
                owner=user,
                defaults={
                    'brand_name': data['brand_name'],
                    'description': data['description'],
                    'category': data['category'],
                    'city': data['city'],
                    'address': data['address'],
                    'phone': data['phone'],
                    'website': data.get('website', ''),
                    'is_vip': data['is_vip'],
                    'is_verified': data['is_verified'],
                    'rating': data['rating'],
                },
            )
            if biz_created:
                created_count['biz'] += 1
                out(f'  [+] Biznes: {biz.brand_name}')
            else:
                out(f'  [~] Biznes uzhe est: {biz.brand_name}')

            # Товары
            if biz_created:
                for p in data['products']:
                    Product.objects.create(
                        business=biz,
                        name=p['name'],
                        description=p['desc'],
                        price=p['price'] or None,
                        currency=p['currency'],
                        image_url=p['img'],
                        is_available=True,
                    )
                    created_count['products'] += 1
                out(f'     Tovary: {len(data["products"])} sht.')

            # Сторисы
            if biz_created:
                expires = timezone.now() + timedelta(hours=48)
                for s in data['stories']:
                    Story.objects.create(
                        author=user,
                        media_url=s['url'],
                        media_type='IMAGE',
                        caption=s['caption'],
                        expires_at=expires,
                    )
                    created_count['stories'] += 1
                out(f'     Storisy: {len(data["stories"])} sht.')

        self._out(self.style.SUCCESS(
            f'\nDone! Sozdano: '
            f'{created_count["users"]} polzovateley, '
            f'{created_count["biz"]} biznesov, '
            f'{created_count["products"]} tovarov, '
            f'{created_count["stories"]} storisov.'
        ))
        self._out('Password dlya vsekh: test1234!')
