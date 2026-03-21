"""
python manage.py seed           -- создать тестовые данные
python manage.py seed --clear   -- сначала удалить всё, потом создать
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from Shop.models import (
    User, Business, Story, Product, Post,
    Comment, ProductInquiry, InquiryMessage,
)


# ── Обычные пользователи (не бизнесы) ─────────────────────────────────────────

REGULAR_USERS = [
    {'username': 'maria_k',    'email': 'maria@test.ru',   'city': 'Стамбул'},
    {'username': 'alex_v',     'email': 'alex@test.ru',    'city': 'Анкара'},
    {'username': 'olga_s',     'email': 'olga@test.ru',    'city': 'Анталья'},
    {'username': 'dmitry_p',   'email': 'dmitry@test.ru',  'city': 'Стамбул'},
    {'username': 'natasha_m',  'email': 'natasha@test.ru', 'city': 'Измир'},
    {'username': 'sergei_b',   'email': 'sergei@test.ru',  'city': 'Бурса'},
]

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
        'products': [
            {'name': 'Стрижка + укладка',    'price': '800',  'currency': 'TRY', 'desc': 'Профессиональная стрижка любой сложности с укладкой',    'img': 'https://picsum.photos/id/119/400/300'},
            {'name': 'Окрашивание волос',    'price': '2500', 'currency': 'TRY', 'desc': 'Стойкое окрашивание, балаяж, омбре, мелирование',        'img': 'https://picsum.photos/id/137/400/300'},
            {'name': 'Маникюр + педикюр',   'price': '1200', 'currency': 'TRY', 'desc': 'Аппаратный маникюр, гель-лак, дизайн',                   'img': 'https://picsum.photos/id/145/400/300'},
            {'name': 'Уход за лицом',        'price': '1800', 'currency': 'TRY', 'desc': 'Профессиональный уход, чистка, пилинг',                  'img': 'https://picsum.photos/id/177/400/300'},
            {'name': 'Восковая депиляция',   'price': '600',  'currency': 'TRY', 'desc': 'Депиляция воском всех зон',                              'img': 'https://picsum.photos/id/155/400/300'},
        ],
        'stories': [
            {'caption': 'Новая коллекция цветов этого сезона!',   'url': 'https://picsum.photos/id/64/600/900',  'hours_ago': 1},
            {'caption': 'Скидки до 30% на все процедуры в апреле','url': 'https://picsum.photos/id/96/600/900',  'hours_ago': 5},
            {'caption': 'До и после — результат говорит сам за себя','url': 'https://picsum.photos/id/217/600/900','hours_ago': 20},
        ],
        'posts': [
            {'text': 'Сертифицированные мастера, высококлассное оборудование и тёплая атмосфера. Приходите к нам за новыми впечатлениями!', 'img': 'https://picsum.photos/id/64/800/600', 'type': 'IMAGE', 'hours_ago': 2},
            {'text': 'Новая коллекция цветов для волос 2026 — яркие тенденции, которые уже у нас. Запись через профиль или WhatsApp.', 'img': 'https://picsum.photos/id/96/800/600', 'type': 'IMAGE', 'hours_ago': 26},
        ],
        'comments': [
            'Была вчера — просто восторг! Мастера профессионалы.',
            'Записалась на следующей неделе, очень жду!',
            'Лучший салон в Стамбуле, рекомендую всем подругам 💅',
        ],
        'inquiries': [
            'Хочу записаться на маникюр на следующую среду, есть ли свободные места?',
            'Интересует окрашивание балаяж. Сколько времени занимает процедура?',
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
        'products': [
            {'name': 'Студия в центре Стамбула', 'price': '95000',  'currency': 'USD', 'desc': '45 кв.м., 15-й этаж, вид на Босфор, новостройка 2023 г.', 'img': 'https://picsum.photos/id/164/400/300'},
            {'name': '2+1 квартира, Кадыкёй',    'price': '145000', 'currency': 'USD', 'desc': '78 кв.м., 3-й этаж, рядом с метро, отличный район',       'img': 'https://picsum.photos/id/188/400/300'},
            {'name': 'Вилла в Анталье',           'price': '280000', 'currency': 'USD', 'desc': '250 кв.м., бассейн, 5 минут от моря, садовый участок',    'img': 'https://picsum.photos/id/365/400/300'},
            {'name': 'Коммерческая площадь',      'price': '3500',   'currency': 'USD', 'desc': 'Аренда офиса 120 кв.м. в бизнес-центре класса А, в месяц','img': 'https://picsum.photos/id/260/400/300'},
            {'name': 'Помощь с ВНЖ + покупкой',  'price': '1500',   'currency': 'USD', 'desc': 'Полное юридическое сопровождение сделки и оформление ВНЖ', 'img': 'https://picsum.photos/id/180/400/300'},
        ],
        'stories': [
            {'caption': 'Новые объекты этой недели — Кадыкёй и Бейоглу', 'url': 'https://picsum.photos/id/274/600/900', 'hours_ago': 3},
            {'caption': 'Вилла у моря в Анталье — осталось 2 объекта',    'url': 'https://picsum.photos/id/312/600/900', 'hours_ago': 18},
        ],
        'posts': [
            {'text': 'Обзор квартиры 2+1 в Кадыкёе. 78 кв.м., 3 этаж, рядом с метро. Цена 145 000$. Документы готовы.', 'img': 'https://picsum.photos/id/164/800/600', 'type': 'IMAGE', 'hours_ago': 4},
            {'text': 'Вилла в Анталье с бассейном — 250 кв.м., 5 минут от моря. Цена 280 000$. Поможем с гражданством!', 'img': 'https://picsum.photos/id/365/800/600', 'type': 'IMAGE', 'hours_ago': 30},
        ],
        'comments': [
            'Покупали через них квартиру — всё прошло отлично, документы сделали быстро!',
            'Очень профессиональная команда. Помогли с ВНЖ без лишних проблем.',
        ],
        'inquiries': [
            'Интересует студия в центре. Возможен ли просмотр на этой неделе?',
            'Какие документы нужны для покупки иностранцем? Гражданство РФ.',
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
        'products': [
            {'name': 'Консультация терапевта',    'price': '500', 'currency': 'TRY', 'desc': 'Первичная консультация с переводчиком',         'img': 'https://picsum.photos/id/237/400/300'},
            {'name': 'Стоматология — осмотр',     'price': '0',   'currency': 'TRY', 'desc': 'Бесплатный осмотр, рентген, план лечения',      'img': 'https://picsum.photos/id/223/400/300'},
            {'name': 'Проверка зрения',           'price': '300', 'currency': 'TRY', 'desc': 'Осмотр офтальмолога, подбор очков или линз',    'img': 'https://picsum.photos/id/239/400/300'},
            {'name': 'Комплексный анализ крови',  'price': '800', 'currency': 'TRY', 'desc': '50+ показателей, результат за 24 часа',         'img': 'https://picsum.photos/id/205/400/300'},
        ],
        'stories': [
            {'caption': 'Акция: бесплатная консультация стоматолога весь апрель', 'url': 'https://picsum.photos/id/342/600/900', 'hours_ago': 6},
            {'caption': 'Новое оборудование — УЗИ нового поколения',              'url': 'https://picsum.photos/id/326/600/900', 'hours_ago': 22},
        ],
        'posts': [
            {'text': 'Бесплатная консультация стоматолога — весь апрель. Запись через профиль. Работаем с переводчиком!', 'img': 'https://picsum.photos/id/342/800/600', 'type': 'IMAGE', 'hours_ago': 7},
            {'text': 'Новое УЗИ-оборудование класса эксперт. Теперь диагностика ещё точнее и быстрее.',                  'img': 'https://picsum.photos/id/237/800/600', 'type': 'IMAGE', 'hours_ago': 48},
        ],
        'comments': [
            'Замечательная клиника! Всё на русском, врачи внимательные.',
            'Сдавал анализы — результаты пришли быстро и с объяснениями.',
            'Наконец-то нашёл хорошего стоматолога в Анкаре 👍',
        ],
        'inquiries': [
            'Нужна консультация терапевта. Как записаться на конкретное время?',
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
        'products': [
            {'name': 'Турецкий A1 (группа)',       'price': '3500', 'currency': 'TRY', 'desc': '20 занятий по 90 мин., группа до 8 человек, сертификат',        'img': 'https://picsum.photos/id/20/400/300'},
            {'name': 'Турецкий индивидуально',     'price': '800',  'currency': 'TRY', 'desc': 'Занятие 60 минут с носителем языка, любой уровень',              'img': 'https://picsum.photos/id/42/400/300'},
            {'name': 'Английский для бизнеса',     'price': '4200', 'currency': 'TRY', 'desc': 'Курс 16 занятий по деловому английскому',                       'img': 'https://picsum.photos/id/28/400/300'},
            {'name': 'Подготовка к TÖMER',         'price': '5500', 'currency': 'TRY', 'desc': 'Интенсивная подготовка к экзамену на ВНЖ, 95% сдают с 1 раза', 'img': 'https://picsum.photos/id/36/400/300'},
        ],
        'stories': [
            {'caption': 'Набор в группы турецкого языка — старт 1 мая', 'url': 'https://picsum.photos/id/20/600/900', 'hours_ago': 2},
            {'caption': 'Наши студенты сдали TÖMER — поздравляем!',     'url': 'https://picsum.photos/id/42/600/900', 'hours_ago': 14},
        ],
        'posts': [
            {'text': 'Набор в группы турецкого языка A1 — старт 1 мая. Группы утренние и вечерние. Первый урок бесплатно!', 'img': 'https://picsum.photos/id/20/800/600', 'type': 'IMAGE', 'hours_ago': 3},
            {'text': '5 студентов успешно сдали экзамен TÖMER. Интенсивный курс с нами — 95% сдают с первого раза.',       'img': 'https://picsum.photos/id/42/800/600', 'type': 'IMAGE', 'hours_ago': 72},
        ],
        'comments': [
            'Учусь уже 3 месяца — прогресс заметен! Отличные преподаватели.',
            'Подготовились к TÖMER за 2 месяца, сдала с первого раза!',
        ],
        'inquiries': [
            'Есть ли группы по турецкому в вечернее время после 18:00?',
            'Интересует индивидуальный курс турецкого для начинающих. Когда можно начать?',
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
        'products': [
            {'name': 'Открытие ООО (Ltd.) в Турции', 'price': '15000', 'currency': 'TRY', 'desc': 'Регистрация компании под ключ — 5 рабочих дней',          'img': 'https://picsum.photos/id/380/400/300'},
            {'name': 'Ежемесячная бухгалтерия',       'price': '3000',  'currency': 'TRY', 'desc': 'Полное ведение учёта, налоговые декларации, в месяц',   'img': 'https://picsum.photos/id/374/400/300'},
            {'name': 'Налоговая консультация',         'price': '1500',  'currency': 'TRY', 'desc': 'Оптимизация налогов, консультация 90 минут',            'img': 'https://picsum.photos/id/366/400/300'},
            {'name': 'Аудит за год',                  'price': '8000',  'currency': 'TRY', 'desc': 'Полный аудит финансовой отчётности за год',             'img': 'https://picsum.photos/id/358/400/300'},
        ],
        'stories': [
            {'caption': 'Открытие компании в Турции — всего за 5 дней', 'url': 'https://picsum.photos/id/349/600/900', 'hours_ago': 10},
        ],
        'posts': [
            {'text': 'Открытие ООО (Ltd.) в Турции под ключ за 5 рабочих дней. Полное юридическое сопровождение включено.', 'img': 'https://picsum.photos/id/380/800/600', 'type': 'IMAGE', 'hours_ago': 12},
        ],
        'comments': [
            'Открывали компанию через них — быстро и без лишней бюрократии.',
        ],
        'inquiries': [
            'Сколько стоит бухгалтерское сопровождение для небольшого ИП?',
        ],
    },
    {
        'username': 'istanbul_tours',
        'email': 'istanbul_tours@test.ru',
        'city_user': 'Анталья',
        'brand_name': 'Istanbul Tours & Travel',
        'description': 'Организация туров по Турции на русском языке. Экскурсии в Стамбуле, Каппадокия, Памуккале, сафари.',
        'category': 'TOURISM',
        'city': 'Анталья',
        'address': 'Antalya, Atatürk Blv. 33',
        'phone': '+90 242 555 06 06',
        'website': 'https://istanbul-tours.ru',
        'is_vip': False,
        'is_verified': True,
        'rating': '4.85',
        'products': [
            {'name': 'Тур по Стамбулу (1 день)',  'price': '2500',  'currency': 'TRY', 'desc': 'Айя-София, Голубая мечеть, Гранд Базар, Босфор. Гид на русском.', 'img': 'https://picsum.photos/id/318/400/300'},
            {'name': 'Каппадокия (3 дня)',         'price': '15000', 'currency': 'TRY', 'desc': 'Перелёт, отель, полёт на шаре, экскурсии. Всё включено.',         'img': 'https://picsum.photos/id/429/400/300'},
            {'name': 'Памуккале + Эфес',           'price': '4500',  'currency': 'TRY', 'desc': 'Белые террасы, древний Эфес, термальный отдых. 1 день.',           'img': 'https://picsum.photos/id/399/400/300'},
            {'name': 'Морская прогулка Босфор',    'price': '800',   'currency': 'TRY', 'desc': 'Закатная прогулка на яхте с ужином, 2 часа',                       'img': 'https://picsum.photos/id/396/400/300'},
        ],
        'stories': [
            {'caption': 'Полёт на воздушном шаре — незабываемые впечатления!', 'url': 'https://picsum.photos/id/318/600/900', 'hours_ago': 4},
            {'caption': 'Айя-София на закате — магия Стамбула',               'url': 'https://picsum.photos/id/429/600/900', 'hours_ago': 16},
            {'caption': 'Босфор с воды — лучший вид на два континента',       'url': 'https://picsum.photos/id/399/600/900', 'hours_ago': 23},
        ],
        'posts': [
            {'text': 'Тур в Каппадокию (3 дня): полёт на шаре, отдых в пещерном отеле, экскурсии. Всё включено. Запись открыта!', 'img': 'https://picsum.photos/id/429/800/600', 'type': 'IMAGE', 'hours_ago': 5},
            {'text': 'Морская прогулка по Босфору на закат — 2 часа с ужином. Виды на оба континента. Бронируйте сейчас!',         'img': 'https://picsum.photos/id/396/800/600', 'type': 'IMAGE', 'hours_ago': 36},
        ],
        'comments': [
            'Летали на шаре в Каппадокии — это просто невероятно! Спасибо за организацию.',
            'Тур по Стамбулу понравился, гид очень знающий и весёлый.',
            'Обязательно поедем ещё раз! Лучшее агентство 🙌',
        ],
        'inquiries': [
            'Есть ли туры в Каппадокию в начале мая? На двоих.',
            'Сколько стоит индивидуальный тур по Стамбулу на 4 человека?',
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
        'products': [
            {'name': 'Оформление ВНЖ',            'price': '5000', 'currency': 'TRY', 'desc': 'Полное сопровождение получения вида на жительство, под ключ', 'img': 'https://picsum.photos/id/160/400/300'},
            {'name': 'Юридическая консультация',   'price': '1000', 'currency': 'TRY', 'desc': 'Консультация 60 мин. по любому правовому вопросу',           'img': 'https://picsum.photos/id/152/400/300'},
            {'name': 'Регистрация бизнеса',        'price': '8000', 'currency': 'TRY', 'desc': 'Открытие ИП или ООО, постановка на налоговый учёт',          'img': 'https://picsum.photos/id/147/400/300'},
            {'name': 'Перевод документов',         'price': '500',  'currency': 'TRY', 'desc': 'Нотариально заверенный перевод, 1 страница',                 'img': 'https://picsum.photos/id/143/400/300'},
        ],
        'stories': [
            {'caption': 'Успешно оформили ВНЖ для 12 клиентов за март', 'url': 'https://picsum.photos/id/160/600/900', 'hours_ago': 8},
        ],
        'posts': [
            {'text': 'Оформление ВНЖ в Турции под ключ. Более 500 успешных кейсов с 2018 года. Бесплатная первичная консультация.', 'img': 'https://picsum.photos/id/160/800/600', 'type': 'IMAGE', 'hours_ago': 9},
        ],
        'comments': [
            'Помогли с ВНЖ быстро и без нервов. Очень рекомендую!',
            'Профессиональный подход, всё объяснили понятно.',
        ],
        'inquiries': [
            'Какие документы нужны для получения ВНЖ по покупке недвижимости?',
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
        'products': [
            {'name': 'Плов по-узбекски (порция)',   'price': '350', 'currency': 'TRY', 'desc': 'Настоящий плов с бараниной, морковью, нутом. Порция 500 г',     'img': 'https://picsum.photos/id/225/400/300'},
            {'name': 'Манты (20 шт.)',               'price': '280', 'currency': 'TRY', 'desc': 'Домашние манты с говядиной, сметана в подарок',                'img': 'https://picsum.photos/id/219/400/300'},
            {'name': 'Турецкий завтрак (на 2)',      'price': '650', 'currency': 'TRY', 'desc': 'Сыры, оливки, яйца, мёд, варенье, хлеб, чай',                 'img': 'https://picsum.photos/id/213/400/300'},
            {'name': 'Кейтеринг — мероприятие',     'price': '500', 'currency': 'TRY', 'desc': 'Выездное обслуживание мероприятий, цена за персону',            'img': 'https://picsum.photos/id/207/400/300'},
            {'name': 'Борщ домашний (1 л)',          'price': '200', 'currency': 'TRY', 'desc': 'Настоящий борщ по-домашнему, на говяжьем бульоне',             'img': 'https://picsum.photos/id/201/400/300'},
        ],
        'stories': [
            {'caption': 'Сегодня готовим плов — принимаем заказы до 18:00', 'url': 'https://picsum.photos/id/225/600/900', 'hours_ago': 1},
            {'caption': 'Новое меню: турецкий завтрак с доставкой',          'url': 'https://picsum.photos/id/219/600/900', 'hours_ago': 11},
        ],
        'posts': [
            {'text': 'Сегодня в меню: плов по-узбекски с бараниной — принимаем заказы до 18:00. Доставка по Стамбулу!', 'img': 'https://picsum.photos/id/225/800/600', 'type': 'IMAGE', 'hours_ago': 2},
            {'text': 'Новое: турецкий завтрак на 2 персоны с доставкой. Сыры, оливки, яйца, мёд, варенье, хлеб, чай. 650 TRY.', 'img': 'https://picsum.photos/id/213/800/600', 'type': 'IMAGE', 'hours_ago': 25},
        ],
        'comments': [
            'Плов просто как у мамы! Заказываю каждую неделю 😍',
            'Манты — объеденье! Доставили быстро и горячими.',
            'Лучшая домашняя еда в Стамбуле, однозначно.',
        ],
        'inquiries': [
            'Можно заказать плов на 10 человек для корпоратива?',
            'Есть ли доставка в район Бешикташ?',
        ],
    },
]


class Command(BaseCommand):
    help = 'Заполнить базу тестовыми данными'

    def add_arguments(self, parser):
        parser.add_argument('--clear',          action='store_true', help='Удалить старые seed-данные перед созданием')
        parser.add_argument('--admin-email',    default='admin@admin.com', help='Email суперадмина')
        parser.add_argument('--admin-password', default='admin1234!',      help='Пароль суперадмина')

    def _out(self, msg):
        try:
            self.stdout.write(msg)
        except UnicodeEncodeError:
            safe = msg.encode('cp1251', errors='replace').decode('cp1251')
            self.stdout.write(safe)

    def handle(self, *args, **options):
        out = self._out

        # ── Очистка ───────────────────────────────────────────────────────────
        if options['clear']:
            out('[SEED] Udalyaem starye dannye...')
            biz_emails  = [b['email'] for b in BUSINESSES]
            user_emails = [u['email'] for u in REGULAR_USERS]
            User.objects.filter(email__in=biz_emails + user_emails).delete()
            out('[SEED] Gotovo.')

        cnt = {'users': 0, 'biz': 0, 'products': 0, 'stories': 0, 'posts': 0, 'comments': 0, 'inquiries': 0}

        # ── Обычные пользователи ──────────────────────────────────────────────
        regular_users = []
        for u in REGULAR_USERS:
            obj, created = User.objects.get_or_create(
                email=u['email'],
                defaults={
                    'username': u['username'],
                    'role': User.Role.USER,
                    'city': u['city'],
                    'is_active': True,
                },
            )
            if created:
                obj.set_password('test1234!')
                obj.save()
                cnt['users'] += 1
                out(f'  [+] User: {obj.email}')
            else:
                out(f'  [~] User exists: {obj.email}')
            regular_users.append(obj)

        # ── Бизнесы ───────────────────────────────────────────────────────────
        for data in BUSINESSES:
            # Пользователь-бизнесмен
            biz_user, u_created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'role': User.Role.BUSINESS,
                    'city': data['city_user'],
                    'is_active': True,
                },
            )
            if u_created:
                biz_user.set_password('test1234!')
                biz_user.save()
                cnt['users'] += 1
                out(f'  [+] BizUser: {biz_user.email}')
            else:
                out(f'  [~] BizUser exists: {biz_user.email}')

            # Бизнес-профиль
            biz, biz_created = Business.objects.get_or_create(
                owner=biz_user,
                defaults={
                    'brand_name':  data['brand_name'],
                    'description': data['description'],
                    'category':    data['category'],
                    'city':        data['city'],
                    'address':     data['address'],
                    'phone':       data['phone'],
                    'website':     data.get('website', ''),
                    'is_vip':      data['is_vip'],
                    'is_verified': data['is_verified'],
                    'rating':      data['rating'],
                },
            )
            if biz_created:
                cnt['biz'] += 1
                out(f'  [+] Biz: {biz.brand_name}')
            else:
                out(f'  [~] Biz exists: {biz.brand_name}')

            # Товары
            products_created = []
            if biz_created:
                for p in data['products']:
                    product = Product.objects.create(
                        business=biz,
                        name=p['name'],
                        description=p['desc'],
                        price=p['price'] if p['price'] != '0' else None,
                        currency=p['currency'],
                        image_url=p['img'],
                        is_available=True,
                    )
                    products_created.append(product)
                    cnt['products'] += 1
                out(f'     Products: {len(data["products"])}')

            # Сторисы
            stories_created = []
            if biz_created:
                for s in data['stories']:
                    hours_ago = s.get('hours_ago', 0)
                    created_time = timezone.now() - timedelta(hours=hours_ago)
                    story = Story.objects.create(
                        author=biz_user,
                        media_url=s['url'],
                        media_type='IMAGE',
                        caption=s['caption'],
                        expires_at=timezone.now() + timedelta(hours=48),
                    )
                    # Обновляем created_at через queryset чтобы обойти auto_now_add
                    Story.objects.filter(pk=story.pk).update(created_at=created_time)
                    story.refresh_from_db()
                    stories_created.append(story)
                    cnt['stories'] += 1
                out(f'     Stories: {len(data["stories"])}')

            # Посты
            if biz_created:
                for p in data.get('posts', []):
                    hours_ago = p.get('hours_ago', 0)
                    created_time = timezone.now() - timedelta(hours=hours_ago)
                    post = Post.objects.create(
                        business=biz,
                        text=p['text'],
                        media_url=p['img'],
                        media_type=p['type'],
                    )
                    Post.objects.filter(pk=post.pk).update(created_at=created_time)
                    cnt['posts'] += 1
                out(f'     Posts: {len(data.get("posts", []))}')

            # Комментарии к первому сторису
            if stories_created and regular_users:
                story = stories_created[0]
                comment_texts = data.get('comments', [])
                for i, text in enumerate(comment_texts):
                    author = regular_users[i % len(regular_users)]
                    hours_ago = random.randint(1, 10)
                    comment = Comment.objects.create(
                        story=story,
                        author=author,
                        text=text,
                    )
                    Comment.objects.filter(pk=comment.pk).update(
                        created_at=timezone.now() - timedelta(hours=hours_ago)
                    )
                    cnt['comments'] += 1
                out(f'     Comments: {len(comment_texts)}')

            # Заявки на товары
            if products_created and regular_users:
                inquiry_texts = data.get('inquiries', [])
                for i, text in enumerate(inquiry_texts):
                    sender = regular_users[i % len(regular_users)]
                    product = products_created[i % len(products_created)]
                    inq = ProductInquiry.objects.create(
                        product=product,
                        sender=sender,
                        message=text,
                    )
                    InquiryMessage.objects.create(inquiry=inq, sender=sender, text=text)
                    cnt['inquiries'] += 1
                out(f'     Inquiries: {len(inquiry_texts)}')

        # ── Суперадмин ────────────────────────────────────────────────────────
        admin_email    = options['admin_email']
        admin_password = options['admin_password']
        admin, admin_created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username':     'admin',
                'role':         User.Role.USER,
                'is_active':    True,
                'is_staff':     True,
                'is_superuser': True,
            },
        )
        admin.is_active    = True
        admin.is_staff     = True
        admin.is_superuser = True
        admin.set_password(admin_password)
        admin.save()
        out(f'\n  [admin] {admin_email} / {admin_password} ({"created" if admin_created else "updated"})')

        # ── Итог ──────────────────────────────────────────────────────────────
        self._out(self.style.SUCCESS(
            f'\n=== DONE ===\n'
            f'  Users:     {cnt["users"]}\n'
            f'  Businesses:{cnt["biz"]}\n'
            f'  Products:  {cnt["products"]}\n'
            f'  Stories:   {cnt["stories"]}\n'
            f'  Posts:     {cnt["posts"]}\n'
            f'  Comments:  {cnt["comments"]}\n'
            f'  Inquiries: {cnt["inquiries"]}\n'
            f'\nPassword for all: test1234!\n'
            f'Admin: {admin_email} / {admin_password}'
        ))
