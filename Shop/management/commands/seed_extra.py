"""
python manage.py seed_extra          -- добавить новые тестовые данные
python manage.py seed_extra --clear  -- сначала удалить, потом создать
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from Shop.models import (
    User, Business, Story, Product, Post,
    Comment, ProductInquiry, Review,
)
from Shop.models.models import (
    Tag, News, BusinessSubscription, ProductLike,
    PostFavorite, StoryView, GroupChat, GroupMember, GroupMessage,
)


# ─────────────────────────────────────────────────────────────────────────────
# НОВЫЕ ОБЫЧНЫЕ ПОЛЬЗОВАТЕЛИ
# ─────────────────────────────────────────────────────────────────────────────
EXTRA_USERS = [
    {'username': 'irina_k',    'email': 'irina@extra.ru',    'city': 'Стамбул'},
    {'username': 'pavel_n',    'email': 'pavel@extra.ru',    'city': 'Анталья'},
    {'username': 'anna_v',     'email': 'anna@extra.ru',     'city': 'Анкара'},
    {'username': 'mike_s',     'email': 'mike@extra.ru',     'city': 'Измир'},
    {'username': 'elena_p',    'email': 'elena@extra.ru',    'city': 'Стамбул'},
    {'username': 'roman_g',    'email': 'roman@extra.ru',    'city': 'Бурса'},
    {'username': 'kate_zh',    'email': 'kate@extra.ru',     'city': 'Стамбул'},
    {'username': 'andrei_m',   'email': 'andrei@extra.ru',   'city': 'Анкара'},
]

# ─────────────────────────────────────────────────────────────────────────────
# НОВЫЕ БИЗНЕСЫ  (6 штук, охватывают Transport, Other, Food-VIP, Health-PRO)
# ─────────────────────────────────────────────────────────────────────────────
EXTRA_BUSINESSES = [

    # ── 1. Авто-сервис (TRANSPORT, PRO) ──────────────────────────────────────
    {
        'username':   'turk_auto',
        'email':      'turk_auto@extra.ru',
        'city_user':  'Стамбул',
        'brand_name': 'TurkAuto — Прокат и сервис',
        'description': 'Прокат автомобилей, трансферы из аэропорта, автосервис для русскоязычных в Стамбуле. Работаем 24/7.',
        'category':   'TRANSPORT',
        'city':       'Стамбул',
        'address':    'Bağcılar, E-5 Karayolu 12, İstanbul',
        'phone':      '+90 212 555 10 10',
        'website':    'https://turkauto.ru',
        'plan_type':  'PRO',
        'is_verified': True,
        'rating':     '4.70',
        'products': [

            {'name': 'Трансфер аэропорт → отель',   'price': '1200',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Встреча с табличкой, помощь с багажом. Любой район Стамбула.',
             'img': 'https://picsum.photos/id/111/400/300', 'available': True,  'tags': ['транспорт', 'стамбул', 'топ']},
            {'name': 'Прокат авто — эконом (сутки)', 'price': '2500',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Toyota Yaris / Renault Symbol, полная страховка, без залога.',
             'img': 'https://picsum.photos/id/117/400/300', 'available': True,  'tags': ['транспорт', 'скидки']},
            {'name': 'Прокат авто — бизнес (сутки)', 'price': '5500',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Mercedes E-класс / BMW 5, водитель по запросу.',
             'img': 'https://picsum.photos/id/133/400/300', 'available': True,  'tags': ['транспорт', 'бизнес']},
            {'name': 'Тур на авто по Стамбулу',      'price': '4000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Автомобиль + гид на русском, все главные достопримечательности, 8 часов.',
             'img': 'https://picsum.photos/id/125/400/300', 'available': True,  'tags': ['транспорт', 'туризм']},
            # Продукты
            {'name': 'Видеорегистратор Hikvision',   'price': '3200',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': '4K-качество, ночное видение, WiFi, встроенный GPS.',
             'img': 'https://picsum.photos/id/121/400/300', 'available': True,  'tags': ['транспорт', 'новинка']},
            {'name': 'Автоковрики 3D (комплект)',     'price': '1800',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Резиновые ковры с бортиком, универсальные, 4 штуки.',
             'img': 'https://picsum.photos/id/127/400/300', 'available': False, 'tags': ['транспорт']},  # скрыт
            {'name': 'Страховка на авто (год)',       'price': '12000', 'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'КАСКО + ОСАГО, полная защита, оформление за 1 день.',
             'img': 'https://picsum.photos/id/129/400/300', 'available': False, 'tags': ['транспорт', 'бизнес']},  # скрыт
        ],
        'stories': [
            {'caption': 'Наш новый Mercedes для бизнес-трансферов!',    'url': 'https://picsum.photos/id/111/600/900', 'type': 'IMAGE', 'hours_ago': 3},
            {'caption': 'Трансфер из Сабихи — быстро и комфортно',       'url': 'https://picsum.photos/id/133/600/900', 'type': 'IMAGE', 'hours_ago': 20},
            {'caption': 'Подборка маршрутов на выходные 🚗',              'url': 'https://picsum.photos/id/125/600/900', 'type': 'IMAGE', 'hours_ago': 47},
        ],
        'posts': [
            {'text': 'Трансфер из аэропорта Сабиха Гёкчен от 1200 TRY. Встреча с табличкой, русский водитель. Доступно 24/7!',
             'img': 'https://picsum.photos/id/111/800/600', 'type': 'IMAGE', 'hours_ago': 4, 'tags': ['транспорт', 'стамбул']},
            {'text': 'Прокат авто эконом-класса без залога. Toyota Yaris от 2500 TRY/сутки. Полная страховка включена. Доставляем в любую точку города.',
             'img': 'https://picsum.photos/id/117/800/600', 'type': 'IMAGE', 'hours_ago': 28, 'tags': ['транспорт', 'скидки']},
            {'text': 'Маршрут выходного дня: Стамбул — Бурса — Сапанджа. Арендуйте авто и исследуйте окрестности самостоятельно!',
             'img': None, 'type': 'IMAGE', 'hours_ago': 72, 'tags': ['транспорт', 'туризм']},
        ],
        'comments': [
            'Заказывали трансфер из Ататюрк — приехали чётко по времени, спасибо!',
            'Прокат машины на неделю — всё ок, машина чистая, страховка реальная.',
            'Лучший трансфер в Стамбуле, уже третий раз пользуюсь 🚗',
        ],
        'inquiries': [
            'Нужен трансфер на 4 человека с двумя большими чемоданами. Какие машины есть?',
            'Можно ли арендовать машину с детским креслом?',
            'Сколько стоит прокат BMW на 3 дня?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Пунктуальность, чистые машины', 'cons': '', 'text': 'Заказывали трансфер из аэропорта дважды. Оба раза водитель ждал у выхода. Рекомендуем!'},
            {'rating': 4, 'pros': 'Хороший автопарк', 'cons': 'Иногда берут наличку', 'text': 'Машины хорошие, но хотелось бы оплату картой без проблем.'},
            {'rating': 5, 'pros': 'Русский водитель, помог с маршрутом', 'cons': '', 'text': 'Замечательный сервис! Водитель помог найти правильный терминал.'},
        ],
    },

    # ── 2. IT-агентство (OTHER, FREE, не верифицирован) ──────────────────────
    {
        'username':   'pixel_studio',
        'email':      'pixel_studio@extra.ru',
        'city_user':  'Стамбул',
        'brand_name': 'Pixel Studio — Сайты и приложения',
        'description': 'Создаём сайты, интернет-магазины и мобильные приложения. Дизайн, разработка, SEO под ключ. Работаем с русскоязычными бизнесами в Турции.',
        'category':   'OTHER',
        'city':       'Стамбул',
        'address':    'Maslak, Ahi Evran Cd. 6, İstanbul',
        'phone':      '+90 212 555 11 11',
        'website':    'https://pixel-studio.tr',
        'plan_type':  'FREE',
        'is_verified': False,
        'rating':     '4.55',
        'products': [
            {'name': 'Сайт-визитка',                 'price': '15000', 'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Сайт до 5 страниц, адаптивный дизайн, SEO-базис, срок 7 дней.',
             'img': 'https://picsum.photos/id/0/400/300',  'available': True,  'tags': ['бизнес', 'новинка']},
            {'name': 'Интернет-магазин',              'price': '45000', 'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Магазин на Django/Next.js: каталог, корзина, оплата, доставка.',
             'img': 'https://picsum.photos/id/2/400/300',  'available': True,  'tags': ['бизнес', 'топ']},
            {'name': 'Мобильное приложение (iOS/Android)', 'price': None, 'currency': 'USD', 'type': 'SERVICE',
             'desc': 'Кросс-платформенное приложение. Цена по договору — от 3 000$.',
             'img': 'https://picsum.photos/id/4/400/300',  'available': True,  'tags': ['бизнес', 'новинка']},
            {'name': 'SEO-продвижение (месяц)',       'price': '8000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Оптимизация + написание статей + наращивание ссылок.',
             'img': 'https://picsum.photos/id/5/400/300',  'available': True,  'tags': ['бизнес']},
            {'name': 'Логотип + фирстиль',            'price': '5000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Уникальный логотип, визитки, фирменный стиль. 3 варианта на выбор.',
             'img': 'https://picsum.photos/id/7/400/300',  'available': True,  'tags': ['бизнес']},
            {'name': 'Техподдержка сайта (месяц)',    'price': '2000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Обновления, бэкапы, безопасность, мелкие правки.',
             'img': 'https://picsum.photos/id/9/400/300',  'available': False, 'tags': ['бизнес']},   # скрыт
            {'name': 'Курс: создай сайт сам',         'price': '3500',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': '40 видео-уроков, чат поддержки, диплом. Доступ навсегда.',
             'img': 'https://picsum.photos/id/11/400/300', 'available': False, 'tags': ['образование', 'бизнес']}, # скрыт
        ],
        'stories': [
            {'caption': 'Запустили интернет-магазин для клиента за 12 дней 🚀', 'url': 'https://picsum.photos/id/0/600/900',  'type': 'IMAGE', 'hours_ago': 5},
            {'caption': 'Наши работы — портфолио 2026',                          'url': 'https://picsum.photos/id/2/600/900',  'type': 'IMAGE', 'hours_ago': 30},
        ],
        'posts': [
            {'text': 'Создали сайт-визитку для ресторана в Стамбуле за 7 дней. Адаптив, SEO, русский и турецкий языки. Посмотрите на результат!',
             'img': 'https://picsum.photos/id/0/800/600', 'type': 'IMAGE', 'hours_ago': 6, 'tags': ['бизнес', 'новинка']},
            {'text': 'Почему вашему бизнесу нужен сайт прямо сейчас:\n→ 87% клиентов ищут через Google\n→ Без сайта вас нет в интернете\n→ Конкуренты уже там\n\nЗапишитесь на бесплатную консультацию!',
             'img': None, 'type': 'IMAGE', 'hours_ago': 50, 'tags': ['бизнес']},
        ],
        'comments': [
            'Сделали нам сайт быстро и качественно. Уже пошли первые заявки!',
            'Хорошая команда, слушают пожелания и не тянут с дедлайнами.',
        ],
        'inquiries': [
            'Нужен простой сайт для салона красоты. Сколько будет стоить?',
            'Делаете ли вы SEO для турецкого Google (google.com.tr)?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Быстро, всё по ТЗ', 'cons': '', 'text': 'Сделали сайт за 8 дней. Есть небольшие правки — исправили за 2 часа. Отличная команда!'},
            {'rating': 3, 'pros': 'Хороший дизайн', 'cons': 'Затянули с SEO', 'text': 'Дизайн понравился, но SEO-работы заняли в 2 раза дольше обещанного.'},
        ],
    },

    # ── 3. Фитнес-клуб (HEALTH, PRO, верифицирован) ──────────────────────────
    {
        'username':   'iron_gym_istanbul',
        'email':      'iron_gym@extra.ru',
        'city_user':  'Стамбул',
        'brand_name': 'Iron Gym Istanbul',
        'description': 'Современный фитнес-клуб для русскоязычных в Стамбуле. Тренажёрный зал, групповые занятия, персональные тренеры. Без языкового барьера.',
        'category':   'HEALTH',
        'city':       'Стамбул',
        'address':    'Kadıköy, Moda Cd. 34, İstanbul',
        'phone':      '+90 216 555 12 12',
        'website':    'https://irongym-ist.ru',
        'plan_type':  'PRO',
        'is_verified': True,
        'rating':     '4.80',
        'products': [
            {'name': 'Абонемент — 1 месяц',          'price': '1800',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Неограниченный доступ в зал с 6:00 до 23:00 ежедневно.',
             'img': 'https://picsum.photos/id/401/400/300', 'available': True,  'tags': ['здоровье', 'стамбул']},
            {'name': 'Абонемент — 3 месяца',          'price': '4500',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Скидка 17% по сравнению с месячным. Зал + все групповые.',
             'img': 'https://picsum.photos/id/403/400/300', 'available': True,  'tags': ['здоровье', 'скидки', 'топ']},
            {'name': 'Персональная тренировка (1ч)', 'price': '1200',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Тренер говорит по-русски, составит программу под ваши цели.',
             'img': 'https://picsum.photos/id/405/400/300', 'available': True,  'tags': ['здоровье', 'рекомендация']},
            {'name': 'Йога — групповое (10 занятий)', 'price': '2000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Йога для всех уровней, группа до 12 человек.',
             'img': 'https://picsum.photos/id/407/400/300', 'available': True,  'tags': ['здоровье', 'новинка']},
            {'name': 'Спортивное питание Whey Protein','price': '1500', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': '1 кг протеина, шоколад / ваниль / клубника. Сертифицирован.',
             'img': 'https://picsum.photos/id/409/400/300', 'available': True,  'tags': ['здоровье']},
            {'name': 'Резиновые петли (5 уровней)',   'price': '650',   'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Набор фитнес-резинок для дома, сумка в комплекте.',
             'img': 'https://picsum.photos/id/411/400/300', 'available': True,  'tags': ['здоровье']},
            {'name': 'Разовое посещение',              'price': '250',   'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Без абонемента — просто прийти и потренироваться.',
             'img': 'https://picsum.photos/id/413/400/300', 'available': False, 'tags': ['здоровье']},  # скрыт
        ],
        'stories': [
            {'caption': 'Утренняя тренировка в 6:30 — начни день правильно 💪',  'url': 'https://picsum.photos/id/401/600/900', 'type': 'IMAGE', 'hours_ago': 2},
            {'caption': 'Новый тренажёр — инверсионный стол уже в зале!',         'url': 'https://picsum.photos/id/403/600/900', 'type': 'IMAGE', 'hours_ago': 13},
            {'caption': 'Результат клиента за 3 месяца тренировок — минус 12 кг', 'url': 'https://picsum.photos/id/405/600/900', 'type': 'IMAGE', 'hours_ago': 36},
            {'caption': 'Групповое занятие йогой каждую субботу в 10:00',         'url': 'https://picsum.photos/id/407/600/900', 'type': 'IMAGE', 'hours_ago': 60},
        ],
        'posts': [
            {'text': '🏋️ Абонемент на 3 месяца — всего 4500 TRY. Это дешевле двух персональных тренировок! Запишитесь сегодня и получите первую тренировку с тренером бесплатно.',
             'img': 'https://picsum.photos/id/403/800/600', 'type': 'IMAGE', 'hours_ago': 5, 'tags': ['здоровье', 'скидки']},
            {'text': 'Результат нашего клиента Андрея: минус 12 кг за 3 месяца. Без голодовок, только правильные тренировки и питание. Хочешь так же? Пиши нам!',
             'img': 'https://picsum.photos/id/405/800/600', 'type': 'IMAGE', 'hours_ago': 40, 'tags': ['здоровье', 'рекомендация']},
            {'text': 'Почему не стоит откладывать тренировки на понедельник:\n→ Мышцы не ждут\n→ Стресс накапливается\n→ Энергия падает\n\nПриходи сегодня — первое занятие бесплатно!',
             'img': None, 'type': 'IMAGE', 'hours_ago': 96, 'tags': ['здоровье']},
        ],
        'comments': [
            'Хожу уже 4 месяца — результат виден! Тренер Максим лучший 💪',
            'Наконец нашёл зал где можно не думать о языке. Всё по-русски!',
            'Йога в субботу — просто огонь, приходите все!',
            'Хорошее оборудование, чисто, кондиционер — всё что надо.',
        ],
        'inquiries': [
            'Есть ли групповые занятия по боксу или единоборствам?',
            'Можно ли купить абонемент только на групповые, без тренажёрного зала?',
            'Работает ли зал в праздники (1 мая, байрам)?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Русскоязычный тренер, современное оборудование', 'cons': '', 'text': 'Лучший зал в Кадыкёе! За 3 месяца сбросил 10 кг. Тренер составил программу точно под меня.'},
            {'rating': 5, 'pros': 'Чисто, просторно, хорошая атмосфера', 'cons': 'Парковки нет рядом', 'text': 'Отличное место для тренировок. Единственное — нет парковки, надо идти пешком от метро.'},
            {'rating': 4, 'pros': 'Хороший тренажёрный зал', 'cons': 'Раздевалки могли бы быть лучше', 'text': 'Зал хороший, но раздевалки немного тесноваты в часы пик.'},
        ],
    },

    # ── 4. Ресторан / доставка (FOOD, VIP, верифицирован) ────────────────────
    {
        'username':   'antalya_kitchen',
        'email':      'antalya_kitchen@extra.ru',
        'city_user':  'Анталья',
        'brand_name': 'Antalya Kitchen — Русская кухня',
        'description': 'Ресторан и доставка русской и кавказской кухни в Анталье. Хинкали, шашлык, борщ, пельмени. Доставка от 200 TRY, готовим с душой.',
        'category':   'FOOD',
        'city':       'Анталья',
        'address':    'Lara, Fener Cd. 45, Antalya',
        'phone':      '+90 242 555 13 13',
        'website':    '',
        'plan_type':  'VIP',
        'is_verified': True,
        'rating':     '4.90',
        'products': [
            {'name': 'Хинкали (10 шт.)',              'price': '380',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Сочные хинкали с говядиной и свининой. Классический рецепт.',
             'img': 'https://picsum.photos/id/431/400/300', 'available': True,  'tags': ['еда', 'доставка', 'топ']},
            {'name': 'Шашлык из баранины (300 г)',    'price': '650',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Маринованная баранина на углях, лаваш, соус.',
             'img': 'https://picsum.photos/id/433/400/300', 'available': True,  'tags': ['еда', 'рекомендация']},
            {'name': 'Борщ украинский (1 л)',          'price': '250',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Наваристый борщ на говяжьем бульоне со сметаной.',
             'img': 'https://picsum.photos/id/435/400/300', 'available': True,  'tags': ['еда', 'доставка']},
            {'name': 'Пельмени домашние (500 г)',      'price': '320',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Лепим вручную каждый день. Говядина + свинина, сметана.',
             'img': 'https://picsum.photos/id/437/400/300', 'available': True,  'tags': ['еда', 'доставка']},
            {'name': 'Сет «Кавказское застолье»',     'price': '2800', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'На 4 персоны: хинкали, шашлык, сациви, лаваш, соусы.',
             'img': 'https://picsum.photos/id/439/400/300', 'available': True,  'tags': ['еда', 'топ', 'рекомендация']},
            {'name': 'Кейтеринг (за персону)',         'price': '800',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Выездное обслуживание, меню согласовывается. Минимум 20 чел.',
             'img': 'https://picsum.photos/id/441/400/300', 'available': True,  'tags': ['еда', 'бизнес']},
            {'name': 'Торт на заказ (за кг)',          'price': '500',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Бисквитный, медовик, прага. Украшение по желанию.',
             'img': 'https://picsum.photos/id/443/400/300', 'available': False, 'tags': ['еда']},  # скрыт
        ],
        'stories': [
            {'caption': '🥟 Хинкали готовы — ловите пока горячие!',            'url': 'https://picsum.photos/id/431/600/900', 'type': 'IMAGE', 'hours_ago': 1},
            {'caption': 'Шашлык на углях каждый вечер — приходите!',            'url': 'https://picsum.photos/id/433/600/900', 'type': 'IMAGE', 'hours_ago': 18},
            {'caption': 'Новое в меню: грузинское сациви из курицы',             'url': 'https://picsum.photos/id/435/600/900', 'type': 'IMAGE', 'hours_ago': 42},
            {'caption': 'Сет «Кавказское застолье» — идеально для компании',    'url': 'https://picsum.photos/id/439/600/900', 'type': 'IMAGE', 'hours_ago': 70},
        ],
        'posts': [
            {'text': '🥟 Хинкали по-грузински — теперь в меню постоянно! Лепим вручную каждое утро. Заказывайте до 16:00 и получите доставку в тот же день.',
             'img': 'https://picsum.photos/id/431/800/600', 'type': 'IMAGE', 'hours_ago': 3, 'tags': ['еда', 'доставка', 'анталья']},
            {'text': 'Кавказский вечер по пятницам — живая музыка, шашлык, хинкали. Бронируйте столик заранее, места ограничены!',
             'img': 'https://picsum.photos/id/433/800/600', 'type': 'IMAGE', 'hours_ago': 45, 'tags': ['еда', 'рекомендация']},
            {'text': 'Топ-3 блюда по отзывам наших гостей:\n1. Хинкали с говядиной\n2. Шашлык из баранины\n3. Борщ с пампушками\n\nЧто заказываете чаще всего?',
             'img': None, 'type': 'IMAGE', 'hours_ago': 100, 'tags': ['еда', 'топ']},
        ],
        'comments': [
            'Хинкали лучше чем в Тбилиси, не шутка! 🤤',
            'Заказываю борщ каждую неделю, доставляют всегда горячим.',
            'Лучший ресторан в Анталье для русских, нашли наконец-то!',
            'Шашлык просто огонь, маринад потрясающий.',
        ],
        'inquiries': [
            'Есть ли доставка в район Коньяалты?',
            'Можно заказать торт на день рождения на 2 кг с надписью?',
            'Организуете ли банкеты на 30-40 человек?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Вкус как дома, быстрая доставка', 'cons': '', 'text': 'Наконец-то нашли место в Анталье где готовят как у нас! Хинкали — объеденье, заказываем каждую неделю.'},
            {'rating': 5, 'pros': 'Огромные порции, всё свежее', 'cons': '', 'text': 'Борщ вкуснейший! Литра хватает на два раза. Спасибо за домашнюю еду!'},
            {'rating': 4, 'pros': 'Вкусно и много', 'cons': 'Долгая доставка в пятницу', 'text': 'Еда отличная, но в пятницу вечером доставка шла 1,5 часа — видимо загружены.'},
        ],
    },

    # ── 5. Фото-студия (OTHER, FREE, не верифицирован) ───────────────────────
    {
        'username':   'foto_istanbul',
        'email':      'foto_istanbul@extra.ru',
        'city_user':  'Стамбул',
        'brand_name': 'FotoIstanbul — Фотограф и студия',
        'description': 'Профессиональная фотосъёмка в Стамбуле: портреты, семейные фото, бизнес-портреты, репортаж. Студия в Бейоглу.',
        'category':   'OTHER',
        'city':       'Стамбул',
        'address':    'Beyoğlu, Sıraselviler Cd. 5, İstanbul',
        'phone':      '+90 212 555 14 14',
        'website':    'https://foto-istanbul.ru',
        'plan_type':  'FREE',
        'is_verified': False,
        'rating':     '4.65',
        'products': [
            {'name': 'Портретная съёмка (2 часа)',    'price': '3500',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': '2 часа студийной съёмки, 30 обработанных фото, RAW в подарок.',
             'img': 'https://picsum.photos/id/64/400/300',  'available': True,  'tags': ['бизнес', 'новинка']},
            {'name': 'Семейная фотосессия',           'price': '5000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': '3 часа, 50 фото, разные локации Стамбула.',
             'img': 'https://picsum.photos/id/96/400/300',  'available': True,  'tags': ['топ', 'рекомендация']},
            {'name': 'Бизнес-портрет (LinkedIn/CV)',  'price': '1500',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': '1 час, 10 фото, нейтральный фон, ретушь лица.',
             'img': 'https://picsum.photos/id/177/400/300', 'available': True,  'tags': ['бизнес']},
            {'name': 'Фото на документы (онлайн)',    'price': '300',   'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Съёмка + обработка + доставка файлов на email за 24 часа.',
             'img': 'https://picsum.photos/id/91/400/300',  'available': True,  'tags': []},
            {'name': 'Фотокнига (20 стр. А4)',        'price': '2500',  'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Печатная фотокнига в твёрдой обложке. Верстаем сами.',
             'img': 'https://picsum.photos/id/159/400/300', 'available': True,  'tags': ['новинка']},
            {'name': 'Съёмка интерьера (для AirBnB)','price': '4000',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Профессиональные фото квартиры/виллы для сдачи в аренду.',
             'img': 'https://picsum.photos/id/186/400/300', 'available': False, 'tags': ['недвижимость']},  # скрыт
        ],
        'stories': [
            {'caption': 'Портретная сессия на крышах Стамбула ✨',         'url': 'https://picsum.photos/id/64/600/900',  'type': 'IMAGE', 'hours_ago': 7},
            {'caption': 'Семейная съёмка в парке Гюльхане — нежно и ярко', 'url': 'https://picsum.photos/id/96/600/900',  'type': 'IMAGE', 'hours_ago': 24},
        ],
        'posts': [
            {'text': '📸 Портретная сессия на рассвете на крышах Стамбула — 3500 TRY, 2 часа, 30 фото. Места на апрель ограничены!',
             'img': 'https://picsum.photos/id/64/800/600', 'type': 'IMAGE', 'hours_ago': 8, 'tags': ['бизнес', 'стамбул']},
            {'text': 'Бизнес-портрет для LinkedIn — как это важно:\n→ Профиль с фото получает в 14 раз больше просмотров\n→ Рекрутеры смотрят на фото в первую очередь\n→ Хорошее фото = доверие\n\nЗапишитесь на съёмку!',
             'img': None, 'type': 'IMAGE', 'hours_ago': 55, 'tags': ['бизнес']},
        ],
        'comments': [
            'Потрясающие снимки! Профессионал своего дела 📸',
            'Семейная сессия на набережной — лучшие фото в жизни!',
        ],
        'inquiries': [
            'Можно ли сделать съёмку в районе Кадыкёй, на азиатском берегу?',
            'Делаете ли съёмку новорождённых (newborn)?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Профессионализм, красивые фото', 'cons': '', 'text': 'Делали семейную фотосессию — результат превзошёл все ожидания. Дети на фото прекрасны!'},
            {'rating': 4, 'pros': 'Хорошие фото', 'cons': 'Долгая обработка (5 дней)', 'text': 'Качество фотографий отличное, но пришлось ждать готовые снимки 5 дней вместо обещанных 3.'},
        ],
    },

    # ── 6. Магазин электроники (OTHER, VIP, верифицирован) ───────────────────
    {
        'username':   'techmarket_ist',
        'email':      'techmarket@extra.ru',
        'city_user':  'Стамбул',
        'brand_name': 'TechMarket Istanbul',
        'description': 'Продажа новой и б/у техники: iPhone, MacBook, Samsung, ноутбуки. Гарантия, доставка по Турции. Скупка устройств.',
        'category':   'OTHER',
        'city':       'Стамбул',
        'address':    'Bağcılar, Yenibosna Cd. 78, İstanbul',
        'phone':      '+90 212 555 15 15',
        'website':    'https://techmarket-ist.ru',
        'plan_type':  'VIP',
        'is_verified': True,
        'rating':     '4.75',
        'products': [
            {'name': 'iPhone 15 Pro 256 GB (новый)',  'price': '55000', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Черный титан, запечатанный, гарантия Apple 1 год. Чек в комплекте.',
             'img': 'https://picsum.photos/id/0/400/300',  'available': True,  'tags': ['новинка', 'топ']},
            {'name': 'MacBook Air M2 (новый)',         'price': '72000', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': '8 ГБ RAM, 256 SSD, Midnight. Официальная гарантия.',
             'img': 'https://picsum.photos/id/3/400/300',  'available': True,  'tags': ['новинка']},
            {'name': 'Samsung Galaxy S24 Ultra (б/у)', 'price': '35000', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Состояние A+, 256 ГБ, S-Pen, 90 дней гарантии от магазина.',
             'img': 'https://picsum.photos/id/6/400/300',  'available': True,  'tags': ['скидки']},
            {'name': 'AirPods Pro 2 (новые)',          'price': '12000', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Запечатанные, гарантия Apple. Есть USB-C версия.',
             'img': 'https://picsum.photos/id/9/400/300',  'available': True,  'tags': ['новинка']},
            {'name': 'Скупка iPhone 13/14/15',        'price': None,    'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Выкупаем ваш iPhone за 30 минут. Оценка бесплатно, наличные сразу.',
             'img': 'https://picsum.photos/id/12/400/300', 'available': True,  'tags': ['бизнес']},
            {'name': 'Ремонт iPhone (экран)',          'price': '4500',  'currency': 'TRY', 'type': 'SERVICE',
             'desc': 'Замена экрана за 2 часа. Оригинальные запчасти.',
             'img': 'https://picsum.photos/id/15/400/300', 'available': True,  'tags': []},
            {'name': 'iPad Air 5 (б/у)',               'price': '22000', 'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'WiFi, 64 ГБ, состояние хорошее. 60 дней гарантии.',
             'img': 'https://picsum.photos/id/17/400/300', 'available': False, 'tags': ['скидки']},  # скрыт
            {'name': 'Чехол MagSafe для iPhone 15',   'price': '800',   'currency': 'TRY', 'type': 'PRODUCT',
             'desc': 'Силикон Apple, все цвета в наличии.',
             'img': 'https://picsum.photos/id/19/400/300', 'available': False, 'tags': []},  # скрыт
        ],
        'stories': [
            {'caption': 'iPhone 15 Pro — в наличии, чеки, гарантия Apple 📱', 'url': 'https://picsum.photos/id/0/600/900',  'type': 'IMAGE', 'hours_ago': 2},
            {'caption': 'MacBook Air M2 — новые, запечатанные 💻',             'url': 'https://picsum.photos/id/3/600/900',  'type': 'IMAGE', 'hours_ago': 14},
            {'caption': 'Скупаем iPhone 13/14/15 — оценка за 30 минут',       'url': 'https://picsum.photos/id/6/600/900',  'type': 'IMAGE', 'hours_ago': 35},
        ],
        'posts': [
            {'text': '📱 iPhone 15 Pro 256 ГБ — в наличии! Черный титан, запечатан, чек + гарантия Apple. 55 000 TRY. Доставка по Стамбулу сегодня.',
             'img': 'https://picsum.photos/id/0/800/600', 'type': 'IMAGE', 'hours_ago': 3, 'tags': ['новинка', 'топ']},
            {'text': '💻 MacBook Air M2 — новый запечатанный. 72 000 TRY с официальной гарантией. Дешевле чем в Apple Store Турции.',
             'img': 'https://picsum.photos/id/3/800/600', 'type': 'IMAGE', 'hours_ago': 20, 'tags': ['новинка']},
            {'text': 'Хочешь продать свой iPhone? Мы выкупим за 30 минут:\n✓ Наличные сразу\n✓ Оценка бесплатно\n✓ Принимаем любое состояние',
             'img': None, 'type': 'IMAGE', 'hours_ago': 60, 'tags': ['бизнес']},
        ],
        'comments': [
            'Купил iPhone 15 Pro — всё как описано, гарантия настоящая!',
            'Сдал старый Samsung, деньги выдали сразу. Честный магазин 👍',
            'Чехол доставили в тот же день, спасибо!',
        ],
        'inquiries': [
            'Есть ли iPhone 15 Plus в белом цвете?',
            'Принимаете Samsung Galaxy S22 в обмен на iPhone?',
            'Сколько дадите за iPhone 13 Pro Max 256 ГБ в хорошем состоянии?',
        ],
        'reviews': [
            {'rating': 5, 'pros': 'Честные цены, быстрая доставка', 'cons': '', 'text': 'Купил MacBook — всё запечатано, гарантия активирована. Доставили за 3 часа по Стамбулу!'},
            {'rating': 4, 'pros': 'Хорошие цены на б/у', 'cons': 'Мало б/у вариантов', 'text': 'Взял Galaxy S24 Ultra б/у — работает отлично. Хотелось бы больше выбора б/у техники.'},
            {'rating': 5, 'pros': 'Выкупили быстро и честно', 'cons': '', 'text': 'Продал iPhone 14 — оценили честно, деньги дали наличными сразу. Всё чётко!'},
        ],
    },
]


class Command(BaseCommand):
    help = 'Дополнительные тестовые данные (6 новых бизнесов, больше контента)'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true',
                            help='Удалить старые extra-данные перед созданием')

    def _out(self, msg):
        try:
            self.stdout.write(msg)
        except UnicodeEncodeError:
            self.stdout.write(msg.encode('cp1251', errors='replace').decode('cp1251'))

    def handle(self, *args, **options):
        out = self._out

        # ── Очистка ───────────────────────────────────────────────────────────
        if options['clear']:
            out('[seed_extra] Udalyaem extra-dannye...')
            emails = [b['email'] for b in EXTRA_BUSINESSES] + \
                     [u['email'] for u in EXTRA_USERS]
            User.objects.filter(email__in=emails).delete()
            out('[seed_extra] Ochishcheno.')

        cnt = {k: 0 for k in ('users', 'biz', 'products', 'stories', 'posts',
                               'comments', 'inquiries', 'reviews', 'subs', 'likes')}

        # ── Обычные пользователи ──────────────────────────────────────────────
        regular_users = []
        for u in EXTRA_USERS:
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
            regular_users.append(obj)

        out(f'[seed_extra] Polzovateli: {cnt["users"]} sozdano, {len(EXTRA_USERS)-cnt["users"]} sushch.')

        # ── Теги ─────────────────────────────────────────────────────────────
        extra_tags = ['транспорт', 'фото', 'электроника', 'фитнес', 'it', 'кавказ', 'грузинский']
        for name in extra_tags:
            Tag.objects.get_or_create(name=name)

        # ── Бизнесы ───────────────────────────────────────────────────────────
        biz_objects = []
        for data in EXTRA_BUSINESSES:
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

            biz, b_created = Business.objects.get_or_create(
                owner=biz_user,
                defaults={
                    'brand_name': data['brand_name'],
                    'description': data['description'],
                    'category': data['category'],
                    'city': data['city'],
                    'address': data['address'],
                    'phone': data['phone'],
                    'website': data.get('website', ''),
                    'plan_type': data['plan_type'],
                    'is_verified': data['is_verified'],
                    'rating': data['rating'],
                },
            )
            biz_objects.append(biz)

            if b_created:
                cnt['biz'] += 1
                out(f'  [+] Biz: {biz.brand_name}')

                # ── Продукты ──────────────────────────────────────────────────
                for p in data['products']:
                    prod = Product.objects.create(
                        business=biz,
                        name=p['name'],
                        description=p.get('desc', ''),
                        product_type=p['type'],
                        price=p['price'] if p.get('price') else None,
                        currency=p['currency'],
                        image_url=p.get('img', ''),
                        is_available=p.get('available', True),
                    )
                    for tag_name in p.get('tags', []):
                        tag, _ = Tag.objects.get_or_create(name=tag_name)
                        prod.tags.add(tag)
                    # Случайные лайки от пользователей
                    for u in random.sample(regular_users, k=min(random.randint(0, 4), len(regular_users))):
                        ProductLike.objects.get_or_create(user=u, product=prod)
                        cnt['likes'] += 1
                    cnt['products'] += 1

                # ── Истории ───────────────────────────────────────────────────
                for s in data['stories']:
                    hours = s.get('hours_ago', 5)
                    Story.objects.create(
                        author=biz_user,
                        media_url=s['url'],
                        media_type=s.get('type', 'IMAGE'),
                        caption=s['caption'],
                        expires_at=timezone.now() + timedelta(hours=24) - timedelta(hours=hours),
                    )
                    cnt['stories'] += 1

                # ── Посты ─────────────────────────────────────────────────────
                for p in data['posts']:
                    hours = p.get('hours_ago', 10)
                    post = Post.objects.create(
                        business=biz,
                        text=p['text'],
                        media_url=p.get('img') or '',
                        media_type=p.get('type', 'IMAGE'),
                    )
                    # Сдвигаем дату вручную
                    Post.objects.filter(pk=post.pk).update(
                        created_at=timezone.now() - timedelta(hours=hours)
                    )
                    for tag_name in p.get('tags', []):
                        tag, _ = Tag.objects.get_or_create(name=tag_name)
                        post.tags.add(tag)
                    # Лайки (избранное) от случайных пользователей
                    for u in random.sample(regular_users, k=min(random.randint(0, 3), len(regular_users))):
                        PostFavorite.objects.get_or_create(user=u, post=post)
                    cnt['posts'] += 1

                # ── Комментарии ───────────────────────────────────────────────
                all_stories = list(biz_user.stories.all()) if hasattr(biz_user, 'stories') else []
                for idx, text in enumerate(data.get('comments', [])):
                    author = regular_users[idx % len(regular_users)]
                    try:
                        target_story = all_stories[idx % len(all_stories)] if all_stories else None
                        if target_story:
                            Comment.objects.create(author=author, story=target_story, text=text)
                            cnt['comments'] += 1
                    except Exception:
                        pass

                # ── Запросы (инквайри) ────────────────────────────────────────
                for idx, text in enumerate(data.get('inquiries', [])):
                    sender = regular_users[idx % len(regular_users)]
                    products_list = list(biz.products.filter(is_available=True))
                    if not products_list:
                        continue
                    product = products_list[idx % len(products_list)]
                    ProductInquiry.objects.create(
                        sender=sender,
                        product=product,
                        message=text,
                    )
                    cnt['inquiries'] += 1

                # ── Отзывы ────────────────────────────────────────────────────
                for idx, r in enumerate(data.get('reviews', [])):
                    reviewer = regular_users[idx % len(regular_users)]
                    Review.objects.get_or_create(
                        business=biz,
                        author=reviewer,
                        defaults={
                            'rating': r['rating'],
                            'pros': r.get('pros', ''),
                            'cons': r.get('cons', ''),
                            'text': r.get('text', ''),
                        },
                    )
                    cnt['reviews'] += 1

                # ── Подписки ──────────────────────────────────────────────────
                for u in random.sample(regular_users, k=min(random.randint(2, 5), len(regular_users))):
                    BusinessSubscription.objects.get_or_create(user=u, business=biz)
                    cnt['subs'] += 1

            else:
                out(f'  [~] Biz exists: {biz.brand_name}')

        # ── Итог ──────────────────────────────────────────────────────────────
        out('')
        out('=' * 50)
        out(f'[seed_extra] DONE!')
        out(f'  Biznesov:   {cnt["biz"]}')
        out(f'  Produktov:  {cnt["products"]}')
        out(f'  Istoriy:    {cnt["stories"]}')
        out(f'  Postov:     {cnt["posts"]}')
        out(f'  Kommentariev: {cnt["comments"]}')
        out(f'  Zaprosov:   {cnt["inquiries"]}')
        out(f'  Otzyvov:    {cnt["reviews"]}')
        out(f'  Podpisok:   {cnt["subs"]}')
        out(f'  Lajkov:     {cnt["likes"]}')
        out('=' * 50)
        out('Vsyo gotovo! Zapusk: python manage.py seed_extra [--clear]')
