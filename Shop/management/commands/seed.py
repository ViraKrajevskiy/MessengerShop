"""
python manage.py seed --clear   -- сначала удалить всё, потом создать
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from Shop.models import (
    User, Business, Story, Product, Post,
    Comment, ProductInquiry, InquiryMessage, Review,
)
from Shop.models.models import (
    Tag, News, Article, BusinessSubscription, ProductLike,
    PostFavorite, StoryView, GroupChat, GroupMember, GroupMessage,
    VerificationRequest, VerificationDocument,
)


# ── Теги ────────────────────────────────────────────────────────────────────
TAGS = [
    'красота', 'здоровье', 'недвижимость', 'образование', 'финансы',
    'юрист', 'туризм', 'еда', 'стамбул', 'анкара', 'анталья',
    'скидки', 'акция', 'новинка', 'топ', 'рекомендация',
    'внж', 'гражданство', 'бизнес', 'доставка',
]

# ── Новости платформы ────────────────────────────────────────────────────────
PLATFORM_NEWS = [
    {
        'title': 'Обновление платформы — новый мессенджер!',
        'text': 'Мы запустили встроенный мессенджер для общения между покупателями и бизнесами. Теперь вы можете задавать вопросы о товарах прямо на платформе.',
        'img': 'https://picsum.photos/id/0/800/400',
        'tags': ['новинка', 'топ'],
        'hours_ago': 6,
    },
    {
        'title': 'Верификация бизнесов — как это работает',
        'text': 'Теперь каждый бизнес может пройти верификацию и получить значок «Проверено». Верифицированные бизнесы вызывают больше доверия у клиентов и получают приоритет в выдаче.',
        'img': 'https://picsum.photos/id/3/800/400',
        'tags': ['бизнес', 'рекомендация'],
        'hours_ago': 48,
    },
    {
        'title': 'Скидки на VIP-размещение до конца апреля',
        'text': 'До 30 апреля действует скидка 30% на VIP-размещение. Ваш бизнес будет отображаться в топе каталога и получит больше просмотров.',
        'img': 'https://picsum.photos/id/6/800/400',
        'tags': ['акция', 'скидки', 'бизнес'],
        'hours_ago': 24,
    },
]

# ── Новости бизнесов (привязаны к индексу бизнеса в BUSINESSES) ──────────
BUSINESS_NEWS = [
    {
        'biz_idx': 0,  # Beauty Studio Istanbul
        'title': 'Весенняя акция — маникюр со скидкой 20%',
        'text': 'Весь апрель у нас скидка 20% на маникюр + педикюр. Запишитесь через профиль или WhatsApp!',
        'img': 'https://picsum.photos/id/119/800/400',
        'tags': ['красота', 'скидки', 'акция'],
        'hours_ago': 12,
    },
    {
        'biz_idx': 1,  # Istanbul Realty Group
        'title': 'Новые объекты — квартиры с видом на Босфор',
        'text': 'В продаже 5 новых квартир с панорамным видом на Босфор. Район Бешикташ, новостройка 2025 года. Цены от 120 000$.',
        'img': 'https://picsum.photos/id/164/800/400',
        'tags': ['недвижимость', 'стамбул', 'топ'],
        'hours_ago': 36,
    },
    {
        'biz_idx': 2,  # TürkMed Clinic
        'title': 'Бесплатный день здоровья — 15 апреля',
        'text': 'Приглашаем на бесплатный день здоровья: осмотр терапевта, измерение давления, экспресс-анализ крови. Без записи!',
        'img': 'https://picsum.photos/id/237/800/400',
        'tags': ['здоровье', 'акция'],
        'hours_ago': 72,
    },
    {
        'biz_idx': 5,  # Istanbul Tours
        'title': 'Открыт сезон туров в Каппадокию',
        'text': 'Начинаем сезон 2026! Каппадокия с полётом на шаре — даты на апрель и май уже доступны. Раннее бронирование -15%.',
        'img': 'https://picsum.photos/id/429/800/400',
        'tags': ['туризм', 'скидки', 'топ'],
        'hours_ago': 18,
    },
]

# ── Статьи бизнесов ─────────────────────────────────────────────────────────
ARTICLES = [
    {
        'biz_idx': 0,
        'title': 'Тренды окрашивания волос 2026 — что выбрать?',
        'text': 'В 2026 году в моде натуральные оттенки, плавные переходы и техника "живого" цвета. Рассказываем про самые актуальные тренды: калифорнийский блонд, медные оттенки и «шоколадный латте». Наш мастер Анна подготовила подборку из 10 лучших вариантов для разных типов волос.\n\nОсобенно популярны техники балаяж и шатуш — они создают эффект выгоревших на солнце прядей. Записывайтесь на бесплатную консультацию!',
        'img': 'https://picsum.photos/id/64/800/400',
        'tags': ['красота', 'рекомендация', 'топ'],
    },
    {
        'biz_idx': 1,
        'title': 'Как купить квартиру в Турции иностранцу — пошаговое руководство',
        'text': 'Покупка недвижимости в Турции — это реальный путь к ВНЖ и даже гражданству. В этой статье мы расскажем пошагово:\n\n1. Выбор объекта и района\n2. Проверка документов (ТАПУ, ИСКАН)\n3. Открытие налогового номера\n4. Подписание контракта\n5. Оформление ТАПУ (право собственности)\n6. Подача на ВНЖ\n\nВесь процесс занимает от 3 до 10 дней. Мы сопровождаем клиента на каждом этапе.',
        'img': 'https://picsum.photos/id/188/800/400',
        'tags': ['недвижимость', 'внж', 'гражданство'],
    },
    {
        'biz_idx': 3,
        'title': '5 советов для быстрого изучения турецкого языка',
        'text': 'Турецкий язык проще, чем кажется! Вот 5 проверенных советов:\n\n1. Начните с фонетики — турецкий читается как пишется\n2. Учите суффиксы, а не слова целиком\n3. Смотрите турецкие сериалы с субтитрами\n4. Практикуйте с турками — они обожают когда иностранцы говорят по-турецки\n5. Запишитесь на TÖMER — официальный экзамен структурирует обучение\n\nНаши студенты достигают уровня A2 за 3 месяца!',
        'img': 'https://picsum.photos/id/20/800/400',
        'tags': ['образование', 'рекомендация'],
    },
    {
        'biz_idx': 6,
        'title': 'ВНЖ в Турции 2026 — все изменения в законодательстве',
        'text': 'В 2026 году вступили в силу новые правила получения ВНЖ в Турции:\n\n- Минимальная стоимость недвижимости для ВНЖ повышена до 200 000$\n- Введена обязательная медицинская страховка\n- Сроки рассмотрения сокращены до 30 дней\n- Новый электронный формат подачи документов\n\nМы помогаем с оформлением от А до Я. Бесплатная консультация — звоните!',
        'img': 'https://picsum.photos/id/160/800/400',
        'tags': ['юрист', 'внж', 'гражданство'],
    },
]

# ── Сообщения для групповых чатов ────────────────────────────────────────────
GROUP_MESSAGES_DATA = [
    'Здравствуйте! Рады приветствовать вас в нашей группе.',
    'Подскажите, какие есть акции на этой неделе?',
    'Спасибо за быстрый ответ!',
    'Когда ближайшая запись свободна?',
    'Отличный сервис, рекомендую всем!',
    'Есть ли скидки для постоянных клиентов?',
    'Можно записаться на завтра?',
    'Какой у вас график работы в выходные?',
]


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
            {'name': 'Стрижка + укладка',    'price': '800',  'currency': 'TRY', 'desc': 'Профессиональная стрижка любой сложности с укладкой',    'img': 'https://picsum.photos/id/119/400/300', 'type': 'SERVICE', 'tags': ['красота', 'топ']},
            {'name': 'Окрашивание волос',    'price': '2500', 'currency': 'TRY', 'desc': 'Стойкое окрашивание, балаяж, омбре, мелирование',        'img': 'https://picsum.photos/id/137/400/300', 'type': 'SERVICE', 'tags': ['красота', 'новинка']},
            {'name': 'Маникюр + педикюр',   'price': '1200', 'currency': 'TRY', 'desc': 'Аппаратный маникюр, гель-лак, дизайн',                   'img': 'https://picsum.photos/id/145/400/300', 'type': 'SERVICE', 'tags': ['красота', 'скидки']},
            {'name': 'Уход за лицом',        'price': '1800', 'currency': 'TRY', 'desc': 'Профессиональный уход, чистка, пилинг',                  'img': 'https://picsum.photos/id/177/400/300', 'type': 'SERVICE', 'tags': ['красота', 'здоровье']},
            {'name': 'Набор кистей для макияжа', 'price': '450', 'currency': 'TRY', 'desc': 'Профессиональный набор из 12 кистей',                 'img': 'https://picsum.photos/id/155/400/300', 'type': 'PRODUCT', 'tags': ['красота', 'новинка']},
        ],
        'stories': [
            {'caption': 'Новая коллекция цветов этого сезона!',   'url': 'https://picsum.photos/id/64/600/900',  'hours_ago': 1},
            {'caption': 'Скидки до 30% на все процедуры в апреле','url': 'https://picsum.photos/id/96/600/900',  'hours_ago': 5},
            {'caption': 'До и после — результат говорит сам за себя','url': 'https://picsum.photos/id/217/600/900','hours_ago': 20},
        ],
        'posts': [
            {'text': 'Сертифицированные мастера, высококлассное оборудование и тёплая атмосфера. Приходите к нам за новыми впечатлениями!', 'img': 'https://picsum.photos/id/64/800/600', 'type': 'IMAGE', 'hours_ago': 2, 'tags': ['красота', 'стамбул']},
            {'text': 'Новая коллекция цветов для волос 2026 — яркие тенденции, которые уже у нас. Запись через профиль или WhatsApp.', 'img': 'https://picsum.photos/id/96/800/600', 'type': 'IMAGE', 'hours_ago': 26, 'tags': ['красота', 'новинка']},
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
        'reviews': [
            {'rating': 5, 'pros': 'Профессионализм, атмосфера', 'cons': '',    'text': 'Лучший салон в Стамбуле! Мастера внимательные, результат превзошёл ожидания.'},
            {'rating': 4, 'pros': 'Качество работы',             'cons': 'Долго ждать записи', 'text': 'Очень нравится качество, но запись иногда занята на 2 недели вперёд.'},
            {'rating': 5, 'pros': 'Всё на русском',              'cons': '',    'text': 'Наконец-то нашла салон где говорят по-русски. Делаю маникюр каждые 3 недели!'},
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
            {'name': 'Студия в центре Стамбула', 'price': '95000',  'currency': 'USD', 'desc': '45 кв.м., 15-й этаж, вид на Босфор, новостройка 2023 г.', 'img': 'https://picsum.photos/id/164/400/300', 'type': 'PRODUCT', 'tags': ['недвижимость', 'стамбул', 'топ']},
            {'name': '2+1 квартира, Кадыкёй',    'price': '145000', 'currency': 'USD', 'desc': '78 кв.м., 3-й этаж, рядом с метро, отличный район',       'img': 'https://picsum.photos/id/188/400/300', 'type': 'PRODUCT', 'tags': ['недвижимость', 'стамбул']},
            {'name': 'Вилла в Анталье',           'price': '280000', 'currency': 'USD', 'desc': '250 кв.м., бассейн, 5 минут от моря, садовый участок',    'img': 'https://picsum.photos/id/365/400/300', 'type': 'PRODUCT', 'tags': ['недвижимость', 'анталья']},
            {'name': 'Оценка недвижимости',       'price': '500',    'currency': 'USD', 'desc': 'Профессиональная оценка объекта, отчёт за 3 дня',         'img': 'https://picsum.photos/id/260/400/300', 'type': 'SERVICE', 'tags': ['недвижимость', 'бизнес']},
            {'name': 'Помощь с ВНЖ + покупкой',  'price': '1500',   'currency': 'USD', 'desc': 'Полное юридическое сопровождение сделки и оформление ВНЖ', 'img': 'https://picsum.photos/id/180/400/300', 'type': 'SERVICE', 'tags': ['внж', 'недвижимость']},
        ],
        'stories': [
            {'caption': 'Новые объекты этой недели — Кадыкёй и Бейоглу', 'url': 'https://picsum.photos/id/274/600/900', 'hours_ago': 3},
            {'caption': 'Вилла у моря в Анталье — осталось 2 объекта',    'url': 'https://picsum.photos/id/312/600/900', 'hours_ago': 18},
        ],
        'posts': [
            {'text': 'Обзор квартиры 2+1 в Кадыкёе. 78 кв.м., 3 этаж, рядом с метро. Цена 145 000$. Документы готовы.', 'img': 'https://picsum.photos/id/164/800/600', 'type': 'IMAGE', 'hours_ago': 4, 'tags': ['недвижимость', 'стамбул']},
            {'text': 'Вилла в Анталье с бассейном — 250 кв.м., 5 минут от моря. Цена 280 000$. Поможем с гражданством!', 'img': 'https://picsum.photos/id/365/800/600', 'type': 'IMAGE', 'hours_ago': 30, 'tags': ['недвижимость', 'анталья', 'гражданство']},
        ],
        'comments': [
            'Покупали через них квартиру — всё прошло отлично, документы сделали быстро!',
            'Очень профессиональная команда. Помогли с ВНЖ без лишних проблем.',
        ],
        'inquiries': [
            'Интересует студия в центре. Возможен ли просмотр на этой неделе?',
            'Какие документы нужны для покупки иностранцем? Гражданство РФ.',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Помогли с ВНЖ, быстро',     'cons': '',           'text': 'Купили квартиру через них — документы сделали за 3 дня. Рекомендуем!'},
            {'rating': 4, 'pros': 'Большой выбор объектов',     'cons': 'Цены выше рынка на 5%', 'text': 'Хороший выбор, но торгуйтесь — первоначальные цены немного завышены.'},
            {'rating': 5, 'pros': 'Профессиональная команда',   'cons': '',           'text': 'Помогли с гражданством и оформлением. Всё прошло без стресса.'},
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
            {'name': 'Консультация терапевта',    'price': '500', 'currency': 'TRY', 'desc': 'Первичная консультация с переводчиком',         'img': 'https://picsum.photos/id/237/400/300', 'type': 'SERVICE', 'tags': ['здоровье', 'анкара']},
            {'name': 'Стоматология — осмотр',     'price': '0',   'currency': 'TRY', 'desc': 'Бесплатный осмотр, рентген, план лечения',      'img': 'https://picsum.photos/id/223/400/300', 'type': 'SERVICE', 'tags': ['здоровье', 'акция']},
            {'name': 'Проверка зрения',           'price': '300', 'currency': 'TRY', 'desc': 'Осмотр офтальмолога, подбор очков или линз',    'img': 'https://picsum.photos/id/239/400/300', 'type': 'SERVICE', 'tags': ['здоровье']},
            {'name': 'Комплексный анализ крови',  'price': '800', 'currency': 'TRY', 'desc': '50+ показателей, результат за 24 часа',         'img': 'https://picsum.photos/id/205/400/300', 'type': 'SERVICE', 'tags': ['здоровье', 'рекомендация']},
        ],
        'stories': [
            {'caption': 'Акция: бесплатная консультация стоматолога весь апрель', 'url': 'https://picsum.photos/id/342/600/900', 'hours_ago': 6},
            {'caption': 'Новое оборудование — УЗИ нового поколения',              'url': 'https://picsum.photos/id/326/600/900', 'hours_ago': 22},
        ],
        'posts': [
            {'text': 'Бесплатная консультация стоматолога — весь апрель. Запись через профиль. Работаем с переводчиком!', 'img': 'https://picsum.photos/id/342/800/600', 'type': 'IMAGE', 'hours_ago': 7, 'tags': ['здоровье', 'акция', 'анкара']},
            {'text': 'Новое УЗИ-оборудование класса эксперт. Теперь диагностика ещё точнее и быстрее.',                  'img': 'https://picsum.photos/id/237/800/600', 'type': 'IMAGE', 'hours_ago': 48, 'tags': ['здоровье', 'новинка']},
        ],
        'comments': [
            'Замечательная клиника! Всё на русском, врачи внимательные.',
            'Сдавал анализы — результаты пришли быстро и с объяснениями.',
            'Наконец-то нашёл хорошего стоматолога в Анкаре 👍',
        ],
        'inquiries': [
            'Нужна консультация терапевта. Как записаться на конкретное время?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Переводчик, современное оборудование', 'cons': '', 'text': 'Замечательная клиника. Всё объяснили по-русски, анализы готовы были на следующий день.'},
            {'rating': 4, 'pros': 'Врачи внимательные',                   'cons': 'Иногда очереди', 'text': 'Хорошая клиника, но бывают очереди в часы пик.'},
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
            {'name': 'Турецкий A1 (группа)',       'price': '3500', 'currency': 'TRY', 'desc': '20 занятий по 90 мин., группа до 8 человек, сертификат',        'img': 'https://picsum.photos/id/20/400/300',  'type': 'SERVICE', 'tags': ['образование', 'стамбул']},
            {'name': 'Турецкий индивидуально',     'price': '800',  'currency': 'TRY', 'desc': 'Занятие 60 минут с носителем языка, любой уровень',              'img': 'https://picsum.photos/id/42/400/300',  'type': 'SERVICE', 'tags': ['образование', 'топ']},
            {'name': 'Английский для бизнеса',     'price': '4200', 'currency': 'TRY', 'desc': 'Курс 16 занятий по деловому английскому',                       'img': 'https://picsum.photos/id/28/400/300',  'type': 'SERVICE', 'tags': ['образование', 'бизнес']},
            {'name': 'Учебник турецкого А1-А2',    'price': '350',  'currency': 'TRY', 'desc': 'Учебник + рабочая тетрадь + аудио, авторская методика',          'img': 'https://picsum.photos/id/36/400/300',  'type': 'PRODUCT', 'tags': ['образование', 'новинка']},
        ],
        'stories': [
            {'caption': 'Набор в группы турецкого языка — старт 1 мая', 'url': 'https://picsum.photos/id/20/600/900', 'hours_ago': 2},
            {'caption': 'Наши студенты сдали TÖMER — поздравляем!',     'url': 'https://picsum.photos/id/42/600/900', 'hours_ago': 14},
        ],
        'posts': [
            {'text': 'Набор в группы турецкого языка A1 — старт 1 мая. Группы утренние и вечерние. Первый урок бесплатно!', 'img': 'https://picsum.photos/id/20/800/600', 'type': 'IMAGE', 'hours_ago': 3, 'tags': ['образование', 'стамбул']},
            {'text': '5 студентов успешно сдали экзамен TÖMER. Интенсивный курс с нами — 95% сдают с первого раза.',       'img': 'https://picsum.photos/id/42/800/600', 'type': 'IMAGE', 'hours_ago': 72, 'tags': ['образование', 'топ']},
        ],
        'comments': [
            'Учусь уже 3 месяца — прогресс заметен! Отличные преподаватели.',
            'Подготовились к TÖMER за 2 месяца, сдала с первого раза!',
        ],
        'inquiries': [
            'Есть ли группы по турецкому в вечернее время после 18:00?',
            'Интересует индивидуальный курс турецкого для начинающих. Когда можно начать?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Гибкое расписание, сертификат', 'cons': '',     'text': 'Выучил турецкий с нуля за 6 месяцев. Сдал TÖMER с первого раза!'},
            {'rating': 4, 'pros': 'Хорошие преподаватели',         'cons': 'Маленькие группы быстро заполняются', 'text': 'Отличная школа, но запись нужно делать заранее — места расходятся быстро.'},
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
            {'name': 'Открытие ООО (Ltd.) в Турции', 'price': '15000', 'currency': 'TRY', 'desc': 'Регистрация компании под ключ — 5 рабочих дней',          'img': 'https://picsum.photos/id/380/400/300', 'type': 'SERVICE', 'tags': ['финансы', 'бизнес']},
            {'name': 'Ежемесячная бухгалтерия',       'price': '3000',  'currency': 'TRY', 'desc': 'Полное ведение учёта, налоговые декларации, в месяц',   'img': 'https://picsum.photos/id/374/400/300', 'type': 'SERVICE', 'tags': ['финансы', 'бизнес']},
            {'name': 'Налоговая консультация',         'price': '1500',  'currency': 'TRY', 'desc': 'Оптимизация налогов, консультация 90 минут',            'img': 'https://picsum.photos/id/366/400/300', 'type': 'SERVICE', 'tags': ['финансы']},
            {'name': 'Аудит за год',                  'price': '8000',  'currency': 'TRY', 'desc': 'Полный аудит финансовой отчётности за год',             'img': 'https://picsum.photos/id/358/400/300', 'type': 'SERVICE', 'tags': ['финансы', 'бизнес']},
        ],
        'stories': [
            {'caption': 'Открытие компании в Турции — всего за 5 дней', 'url': 'https://picsum.photos/id/349/600/900', 'hours_ago': 10},
        ],
        'posts': [
            {'text': 'Открытие ООО (Ltd.) в Турции под ключ за 5 рабочих дней. Полное юридическое сопровождение включено.', 'img': 'https://picsum.photos/id/380/800/600', 'type': 'IMAGE', 'hours_ago': 12, 'tags': ['финансы', 'бизнес']},
        ],
        'comments': [
            'Открывали компанию через них — быстро и без лишней бюрократии.',
        ],
        'inquiries': [
            'Сколько стоит бухгалтерское сопровождение для небольшого ИП?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Быстро, всё под ключ',   'cons': '', 'text': 'Открыли ООО за 4 дня. Никаких лишних вопросов — просто дали документы и всё готово.'},
            {'rating': 4, 'pros': 'Компетентная команда',   'cons': 'Связь по email, не всегда быстро отвечают', 'text': 'Качество работы хорошее, но иногда ждёшь ответа день-два.'},
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
            {'name': 'Тур по Стамбулу (1 день)',  'price': '2500',  'currency': 'TRY', 'desc': 'Айя-София, Голубая мечеть, Гранд Базар, Босфор. Гид на русском.', 'img': 'https://picsum.photos/id/318/400/300', 'type': 'SERVICE', 'tags': ['туризм', 'стамбул', 'топ']},
            {'name': 'Каппадокия (3 дня)',         'price': '15000', 'currency': 'TRY', 'desc': 'Перелёт, отель, полёт на шаре, экскурсии. Всё включено.',         'img': 'https://picsum.photos/id/429/400/300', 'type': 'SERVICE', 'tags': ['туризм', 'рекомендация']},
            {'name': 'Памуккале + Эфес',           'price': '4500',  'currency': 'TRY', 'desc': 'Белые террасы, древний Эфес, термальный отдых. 1 день.',           'img': 'https://picsum.photos/id/399/400/300', 'type': 'SERVICE', 'tags': ['туризм']},
            {'name': 'Сувенирный набор Стамбул',   'price': '450',   'currency': 'TRY', 'desc': 'Магниты, открытки, турецкий чай, лукум — подарочный бокс',          'img': 'https://picsum.photos/id/396/400/300', 'type': 'PRODUCT', 'tags': ['туризм', 'стамбул', 'новинка']},
        ],
        'stories': [
            {'caption': 'Полёт на воздушном шаре — незабываемые впечатления!', 'url': 'https://picsum.photos/id/318/600/900', 'hours_ago': 4},
            {'caption': 'Айя-София на закате — магия Стамбула',               'url': 'https://picsum.photos/id/429/600/900', 'hours_ago': 16},
            {'caption': 'Босфор с воды — лучший вид на два континента',       'url': 'https://picsum.photos/id/399/600/900', 'hours_ago': 23},
        ],
        'posts': [
            {'text': 'Тур в Каппадокию (3 дня): полёт на шаре, отдых в пещерном отеле, экскурсии. Всё включено. Запись открыта!', 'img': 'https://picsum.photos/id/429/800/600', 'type': 'IMAGE', 'hours_ago': 5, 'tags': ['туризм', 'рекомендация']},
            {'text': 'Морская прогулка по Босфору на закат — 2 часа с ужином. Виды на оба континента. Бронируйте сейчас!',         'img': 'https://picsum.photos/id/396/800/600', 'type': 'IMAGE', 'hours_ago': 36, 'tags': ['туризм', 'стамбул']},
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
        'reviews': [
            {'rating': 5, 'pros': 'Незабываемые впечатления, русский гид', 'cons': '', 'text': 'Летели на шаре в Каппадокии — это лучшее что было в жизни! Всё организовано идеально.'},
            {'rating': 5, 'pros': 'Душевная атмосфера, знающий гид',       'cons': '', 'text': 'Тур по Стамбулу с гидом — узнали столько всего о городе. Обязательно вернёмся!'},
            {'rating': 4, 'pros': 'Отличные маршруты',                     'cons': 'Группы немного большие', 'text': 'Хорошие туры, но в высокий сезон группы бывают большие. Лучше выбирать малые группы.'},
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
            {'name': 'Оформление ВНЖ',            'price': '5000', 'currency': 'TRY', 'desc': 'Полное сопровождение получения вида на жительство, под ключ', 'img': 'https://picsum.photos/id/160/400/300', 'type': 'SERVICE', 'tags': ['юрист', 'внж']},
            {'name': 'Юридическая консультация',   'price': '1000', 'currency': 'TRY', 'desc': 'Консультация 60 мин. по любому правовому вопросу',           'img': 'https://picsum.photos/id/152/400/300', 'type': 'SERVICE', 'tags': ['юрист']},
            {'name': 'Регистрация бизнеса',        'price': '8000', 'currency': 'TRY', 'desc': 'Открытие ИП или ООО, постановка на налоговый учёт',          'img': 'https://picsum.photos/id/147/400/300', 'type': 'SERVICE', 'tags': ['юрист', 'бизнес']},
            {'name': 'Перевод документов',         'price': '500',  'currency': 'TRY', 'desc': 'Нотариально заверенный перевод, 1 страница',                 'img': 'https://picsum.photos/id/143/400/300', 'type': 'SERVICE', 'tags': ['юрист']},
        ],
        'stories': [
            {'caption': 'Успешно оформили ВНЖ для 12 клиентов за март', 'url': 'https://picsum.photos/id/160/600/900', 'hours_ago': 8},
        ],
        'posts': [
            {'text': 'Оформление ВНЖ в Турции под ключ. Более 500 успешных кейсов с 2018 года. Бесплатная первичная консультация.', 'img': 'https://picsum.photos/id/160/800/600', 'type': 'IMAGE', 'hours_ago': 9, 'tags': ['юрист', 'внж']},
        ],
        'comments': [
            'Помогли с ВНЖ быстро и без нервов. Очень рекомендую!',
            'Профессиональный подход, всё объяснили понятно.',
        ],
        'inquiries': [
            'Какие документы нужны для получения ВНЖ по покупке недвижимости?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Быстро оформили ВНЖ, без нервов', 'cons': '', 'text': 'Помогли с ВНЖ за 2 недели. Всё объяснили, сопроводили на каждом шаге.'},
            {'rating': 4, 'pros': 'Профессионализм',                  'cons': 'Дорого', 'text': 'Работа хорошая, но цены чуть выше среднего. Зато делают всё сами.'},
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
            {'name': 'Плов по-узбекски (порция)',   'price': '350', 'currency': 'TRY', 'desc': 'Настоящий плов с бараниной, морковью, нутом. Порция 500 г',     'img': 'https://picsum.photos/id/225/400/300', 'type': 'PRODUCT', 'tags': ['еда', 'доставка', 'топ']},
            {'name': 'Манты (20 шт.)',               'price': '280', 'currency': 'TRY', 'desc': 'Домашние манты с говядиной, сметана в подарок',                'img': 'https://picsum.photos/id/219/400/300', 'type': 'PRODUCT', 'tags': ['еда', 'доставка']},
            {'name': 'Турецкий завтрак (на 2)',      'price': '650', 'currency': 'TRY', 'desc': 'Сыры, оливки, яйца, мёд, варенье, хлеб, чай',                 'img': 'https://picsum.photos/id/213/400/300', 'type': 'PRODUCT', 'tags': ['еда', 'рекомендация']},
            {'name': 'Кейтеринг — мероприятие',     'price': '500', 'currency': 'TRY', 'desc': 'Выездное обслуживание мероприятий, цена за персону',            'img': 'https://picsum.photos/id/207/400/300', 'type': 'SERVICE', 'tags': ['еда', 'бизнес']},
            {'name': 'Борщ домашний (1 л)',          'price': '200', 'currency': 'TRY', 'desc': 'Настоящий борщ по-домашнему, на говяжьем бульоне',             'img': 'https://picsum.photos/id/201/400/300', 'type': 'PRODUCT', 'tags': ['еда', 'доставка']},
        ],
        'stories': [
            {'caption': 'Сегодня готовим плов — принимаем заказы до 18:00', 'url': 'https://picsum.photos/id/225/600/900', 'hours_ago': 1},
            {'caption': 'Новое меню: турецкий завтрак с доставкой',          'url': 'https://picsum.photos/id/219/600/900', 'hours_ago': 11},
        ],
        'posts': [
            {'text': 'Сегодня в меню: плов по-узбекски с бараниной — принимаем заказы до 18:00. Доставка по Стамбулу!', 'img': 'https://picsum.photos/id/225/800/600', 'type': 'IMAGE', 'hours_ago': 2, 'tags': ['еда', 'доставка', 'стамбул']},
            {'text': 'Новое: турецкий завтрак на 2 персоны с доставкой. Сыры, оливки, яйца, мёд, варенье, хлеб, чай. 650 TRY.', 'img': 'https://picsum.photos/id/213/800/600', 'type': 'IMAGE', 'hours_ago': 25, 'tags': ['еда', 'новинка']},
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
        'reviews': [
            {'rating': 5, 'pros': 'Вкусно как дома, быстрая доставка', 'cons': '',         'text': 'Плов просто как у мамы готовила! Заказываю каждую пятницу. Доставляют горячим.'},
            {'rating': 5, 'pros': 'Огромные порции, свежие продукты',   'cons': '',         'text': 'Манты — шедевр. Взяла двойную порцию и не пожалела ни разу.'},
            {'rating': 4, 'pros': 'Отличная еда',                       'cons': 'Меню небольшое', 'text': 'Очень вкусно, но хотелось бы побольше блюд в меню.'},
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

        cnt = {
            'users': 0, 'biz': 0, 'products': 0, 'stories': 0, 'posts': 0,
            'comments': 0, 'inquiries': 0, 'reviews': 0,
            'tags': 0, 'news': 0, 'articles': 0, 'subscriptions': 0,
            'likes': 0, 'favorites': 0, 'story_views': 0,
            'groups': 0, 'group_members': 0, 'group_messages': 0,
            'verifications': 0,
        }

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
                        product_type=p.get('type', 'PRODUCT'),
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

            if biz_created and regular_users:
                for i, rv in enumerate(data.get('reviews', [])):
                    author = regular_users[i % len(regular_users)]
                    _, created_rv = Review.objects.get_or_create(
                        author=author,
                        business=biz,
                        defaults={
                            'rating': rv['rating'],
                            'pros':   rv.get('pros', ''),
                            'cons':   rv.get('cons', ''),
                            'text':   rv.get('text', ''),
                        },
                    )
                    if created_rv:
                        cnt['reviews'] += 1
                out(f'     Reviews: {len(data.get("reviews", []))}')

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

        # ── Теги ─────────────────────────────────────────────────────────────
        tag_objects = {}
        for tag_name in TAGS:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            tag_objects[tag_name] = tag
            if created:
                cnt['tags'] += 1
        out(f'\n  [tags] {cnt["tags"]} new tags')

        # ── Теги на продуктах и постах ──────────────────────────────────────
        for data in BUSINESSES:
            try:
                biz = Business.objects.get(brand_name=data['brand_name'])
            except Business.DoesNotExist:
                continue
            for p_data in data['products']:
                p_tags = p_data.get('tags', [])
                if p_tags:
                    try:
                        product = Product.objects.get(business=biz, name=p_data['name'])
                        for t in p_tags:
                            if t in tag_objects:
                                product.tags.add(tag_objects[t])
                    except Product.DoesNotExist:
                        pass
            for p_data in data.get('posts', []):
                p_tags = p_data.get('tags', [])
                if p_tags:
                    try:
                        post = Post.objects.filter(business=biz, text__startswith=p_data['text'][:30]).first()
                        if post:
                            for t in p_tags:
                                if t in tag_objects:
                                    post.tags.add(tag_objects[t])
                    except Exception:
                        pass
        out('  [tags] assigned to products and posts')

        # Собираем все бизнесы и посты для связей
        all_businesses = list(Business.objects.select_related('owner').all())
        all_posts = list(Post.objects.all())
        all_stories = list(Story.objects.all())
        all_products = list(Product.objects.all())

        # ── Новости платформы ────────────────────────────────────────────────
        admin_user = User.objects.filter(is_staff=True).first()
        for n in PLATFORM_NEWS:
            if not News.objects.filter(title=n['title']).exists():
                news = News.objects.create(
                    business=None,
                    author=admin_user or (regular_users[0] if regular_users else None),
                    news_type=News.NewsType.PLATFORM,
                    title=n['title'],
                    text=n['text'],
                    media_url=n['img'],
                    media_type='IMAGE',
                    is_published=True,
                )
                News.objects.filter(pk=news.pk).update(
                    created_at=timezone.now() - timedelta(hours=n['hours_ago'])
                )
                for t in n.get('tags', []):
                    if t in tag_objects:
                        news.tags.add(tag_objects[t])
                cnt['news'] += 1
                out(f'  [+] News (platform): {n["title"][:40]}...')

        # ── Новости бизнесов ─────────────────────────────────────────────────
        for n in BUSINESS_NEWS:
            if n['biz_idx'] < len(all_businesses):
                biz = all_businesses[n['biz_idx']]
                if not News.objects.filter(title=n['title'], business=biz).exists():
                    news = News.objects.create(
                        business=biz,
                        author=biz.owner,
                        news_type=News.NewsType.BUSINESS,
                        title=n['title'],
                        text=n['text'],
                        media_url=n['img'],
                        media_type='IMAGE',
                        is_published=True,
                    )
                    News.objects.filter(pk=news.pk).update(
                        created_at=timezone.now() - timedelta(hours=n['hours_ago'])
                    )
                    for t in n.get('tags', []):
                        if t in tag_objects:
                            news.tags.add(tag_objects[t])
                    cnt['news'] += 1
                    out(f'  [+] News (biz): {n["title"][:40]}...')
        out(f'  [news] {cnt["news"]} total')

        # ── Статьи бизнесов ──────────────────────────────────────────────────
        for a in ARTICLES:
            if a['biz_idx'] < len(all_businesses):
                biz = all_businesses[a['biz_idx']]
                if not Article.objects.filter(title=a['title'], business=biz).exists():
                    article = Article.objects.create(
                        business=biz,
                        title=a['title'],
                        text=a['text'],
                        media_url=a['img'],
                        media_type='IMAGE',
                    )
                    for t in a.get('tags', []):
                        if t in tag_objects:
                            article.tags.add(tag_objects[t])
                    cnt['articles'] += 1
                    out(f'  [+] Article: {a["title"][:40]}...')
        out(f'  [articles] {cnt["articles"]} total')

        # ── Подписки на бизнесы ──────────────────────────────────────────────
        if regular_users and all_businesses:
            for i, user in enumerate(regular_users):
                # Каждый юзер подписан на 2-3 бизнеса
                subs_count = min(3, len(all_businesses))
                for j in range(subs_count):
                    biz = all_businesses[(i + j) % len(all_businesses)]
                    _, created = BusinessSubscription.objects.get_or_create(
                        user=user, business=biz,
                    )
                    if created:
                        cnt['subscriptions'] += 1
        out(f'  [subscriptions] {cnt["subscriptions"]} total')

        # ── Лайки на товары ──────────────────────────────────────────────────
        if regular_users and all_products:
            for i, user in enumerate(regular_users):
                # Каждый юзер лайкнул 2-4 товара
                likes_count = min(4, len(all_products))
                for j in range(likes_count):
                    product = all_products[(i * 2 + j) % len(all_products)]
                    _, created = ProductLike.objects.get_or_create(
                        user=user, product=product,
                    )
                    if created:
                        cnt['likes'] += 1
        out(f'  [product likes] {cnt["likes"]} total')

        # ── Избранные посты ──────────────────────────────────────────────────
        if regular_users and all_posts:
            for i, user in enumerate(regular_users):
                # Каждый юзер сохранил 1-3 поста
                favs_count = min(3, len(all_posts))
                for j in range(favs_count):
                    post = all_posts[(i + j) % len(all_posts)]
                    _, created = PostFavorite.objects.get_or_create(
                        user=user, post=post,
                    )
                    if created:
                        cnt['favorites'] += 1
        out(f'  [post favorites] {cnt["favorites"]} total')

        # ── Просмотры сторисов ───────────────────────────────────────────────
        if regular_users and all_stories:
            for i, user in enumerate(regular_users):
                # Каждый юзер просмотрел 2-5 сторисов
                views_count = min(5, len(all_stories))
                for j in range(views_count):
                    story = all_stories[(i + j) % len(all_stories)]
                    _, created = StoryView.objects.get_or_create(
                        story=story, viewer=user,
                    )
                    if created:
                        cnt['story_views'] += 1
        out(f'  [story views] {cnt["story_views"]} total')

        # ── Групповые чаты (для бизнесов без группы) ─────────────────────────
        for biz in all_businesses:
            if biz.group is None:
                group = GroupChat.objects.create(
                    name=f'Группа {biz.brand_name}',
                    description=f'Общение клиентов магазина {biz.brand_name}',
                    creator=biz.owner,
                )
                GroupMember.objects.create(
                    group=group, user=biz.owner, role=GroupMember.Role.OWNER,
                )
                biz.group = group
                biz.save(update_fields=['group'])
                cnt['groups'] += 1
                cnt['group_members'] += 1
                out(f'  [+] Group: {group.name}')

                # Добавляем участников
                for j, user in enumerate(regular_users[:3]):
                    _, created = GroupMember.objects.get_or_create(
                        group=group, user=user,
                        defaults={'role': GroupMember.Role.MEMBER},
                    )
                    if created:
                        cnt['group_members'] += 1

                # Добавляем сообщения
                participants = [biz.owner] + regular_users[:3]
                for k, msg_text in enumerate(GROUP_MESSAGES_DATA[:5]):
                    sender = participants[k % len(participants)]
                    gm = GroupMessage.objects.create(
                        group=group, sender=sender, text=msg_text,
                    )
                    GroupMessage.objects.filter(pk=gm.pk).update(
                        created_at=timezone.now() - timedelta(hours=random.randint(1, 48))
                    )
                    cnt['group_messages'] += 1

        out(f'  [groups] {cnt["groups"]} groups, {cnt["group_members"]} members, {cnt["group_messages"]} messages')

        # ── Верификация (для неверифицированных бизнесов) ─────────────────────
        for biz in all_businesses:
            if not biz.is_verified and not VerificationRequest.objects.filter(business=biz).exists():
                vr = VerificationRequest.objects.create(
                    business=biz,
                    status=VerificationRequest.Status.PENDING,
                    comment='Хотим пройти верификацию для повышения доверия клиентов.',
                )
                cnt['verifications'] += 1
                out(f'  [+] Verification request: {biz.brand_name}')
        out(f'  [verifications] {cnt["verifications"]} total')

        # ── Добавляем теги к постам ──────────────────────────────────────────
        tag_list = list(tag_objects.values())
        for post in all_posts:
            if not post.tags.exists() and tag_list:
                post_tags = random.sample(tag_list, min(3, len(tag_list)))
                post.tags.set(post_tags)

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
            f'  Users:          {cnt["users"]}\n'
            f'  Businesses:     {cnt["biz"]}\n'
            f'  Products:       {cnt["products"]}\n'
            f'  Stories:        {cnt["stories"]}\n'
            f'  Posts:          {cnt["posts"]}\n'
            f'  Comments:       {cnt["comments"]}\n'
            f'  Inquiries:      {cnt["inquiries"]}\n'
            f'  Reviews:        {cnt["reviews"]}\n'
            f'  Tags:           {cnt["tags"]}\n'
            f'  News:           {cnt["news"]}\n'
            f'  Articles:       {cnt["articles"]}\n'
            f'  Subscriptions:  {cnt["subscriptions"]}\n'
            f'  Product Likes:  {cnt["likes"]}\n'
            f'  Post Favorites: {cnt["favorites"]}\n'
            f'  Story Views:    {cnt["story_views"]}\n'
            f'  Groups:         {cnt["groups"]}\n'
            f'  Group Members:  {cnt["group_members"]}\n'
            f'  Group Messages: {cnt["group_messages"]}\n'
            f'  Verifications:  {cnt["verifications"]}\n'
            f'\nPassword for all: test1234!\n'
            f'Admin: {admin_email} / {admin_password}'
        ))
