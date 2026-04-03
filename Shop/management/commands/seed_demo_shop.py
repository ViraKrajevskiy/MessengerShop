"""
python manage.py seed_demo_shop          -- создать демо-магазин
python manage.py seed_demo_shop --clear  -- удалить и пересоздать
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from Shop.models import (
    User, Business, Story, Product, Post,
    ProductInquiry, InquiryMessage,
)
from Shop.models.models import (
    Tag, GroupChat, GroupMember, GroupMessage,
)

DEMO_EMAIL = 'demo_shop@test.ru'
DEMO_USERNAME = 'demo_shop'

CUSTOMER_EMAILS = [
    'customer1@test.ru',
    'customer2@test.ru',
]

FAQ_DATA = [
    {
        'question': 'Как сделать заказ?',
        'answer': 'Выберите товар или услугу, нажмите «Написать» и наш менеджер свяжется с вами в течение 15 минут. Также можно позвонить напрямую по номеру телефона.',
    },
    {
        'question': 'Какие способы оплаты вы принимаете?',
        'answer': 'Принимаем наличные (TRY, USD, EUR, RUB), банковские карты VISA/MasterCard, переводы через SWIFT и крипту (USDT TRC-20).',
    },
    {
        'question': 'Есть ли доставка?',
        'answer': 'Да, доставляем по Стамбулу курьером — 1-2 часа. По всей Турции — 1-3 рабочих дня через Yurtiçi Kargo. Международная доставка обсуждается индивидуально.',
    },
    {
        'question': 'Можно ли вернуть товар?',
        'answer': 'Да, в течение 14 дней с момента получения при условии сохранения товарного вида. Услуги возврату не подлежат, но мы готовы обсудить компенсацию если результат вас не устроил.',
    },
    {
        'question': 'Работаете ли вы в выходные?',
        'answer': 'Режим работы: Пн-Пт 09:00–20:00, Сб 10:00–18:00, Вс — только онлайн-заявки. На срочные вопросы отвечаем в Telegram 24/7.',
    },
    {
        'question': 'Есть ли скидки для постоянных клиентов?',
        'answer': 'Конечно! После 3-й покупки вы получаете карту постоянного клиента со скидкой 10%. После 10-й — скидка 20% и бесплатная доставка навсегда.',
    },
]

POSTS_DATA = [
    {
        'text': '🔥 Большая весенняя распродажа уже началась! Скидки до 40% на все товары. Успейте воспользоваться — акция действует только до конца апреля. Пишите нам прямо сейчас!',
        'media_url': 'https://picsum.photos/id/20/800/600',
    },
    {
        'text': '✨ Представляем новую коллекцию 2026 года! Свежие поступления уже в наличии. Качество на высшем уровне, цены — вас приятно удивят. Загляните в наш каталог товаров.',
        'media_url': 'https://picsum.photos/id/26/800/600',
    },
    {
        'text': '📦 Доставка за 2 часа по всему Стамбулу! Мы ценим ваше время. Закажите прямо сейчас и получите свой заказ ещё сегодня. Работаем 7 дней в неделю!',
        'media_url': 'https://picsum.photos/id/48/800/600',
    },
    {
        'text': '⭐️ Спасибо нашим клиентам за доверие! Уже более 500 довольных покупателей по всей Турции. Присоединяйтесь и убедитесь сами в качестве нашей продукции.',
        'media_url': 'https://picsum.photos/id/65/800/600',
    },
    {
        'text': '🎁 Подарочные наборы на любой вкус и бюджет! Идеально для корпоративных подарков, дней рождения, юбилеев. Оформление, упаковка и доставка — всё включено.',
        'media_url': 'https://picsum.photos/id/96/800/600',
    },
    {
        'text': '🛡️ Гарантия качества на все товары! Мы работаем только с проверенными поставщиками и несём полную ответственность за каждый заказ. Ваше удовлетворение — наш приоритет.',
        'media_url': 'https://picsum.photos/id/106/800/600',
    },
    {
        'text': '💬 Консультация бесплатно! Наши специалисты помогут подобрать оптимальный вариант под ваши нужды и бюджет. Просто напишите нам — ответим в течение 15 минут.',
        'media_url': 'https://picsum.photos/id/119/800/600',
    },
    {
        'text': '🌟 Эксклюзивные товары, которых нет больше нигде в Турции! Мы сотрудничаем с лучшими производителями напрямую. Гарантируем оригинальность каждого изделия.',
        'media_url': 'https://picsum.photos/id/143/800/600',
    },
    {
        'text': '📸 За кулисами нашего бизнеса — как мы работаем! Каждый день наша команда из 12 человек трудится чтобы ваши заказы обрабатывались быстро и качественно. Мы — семья!',
        'media_url': 'https://picsum.photos/id/177/800/600',
    },
    {
        'text': '🚀 Запускаем программу лояльности! Копите баллы за каждую покупку и обменивайте их на скидки и подарки. Зарегистрируйтесь уже сегодня и получите 100 приветственных баллов.',
        'media_url': 'https://picsum.photos/id/200/800/600',
    },
]

PRODUCTS_DATA = [
    {
        'name': 'Набор для домашнего ухода «Люкс»',
        'description': 'Профессиональный набор косметики для ухода за кожей лица и тела. В комплект входят: сыворотка с гиалуроновой кислотой, увлажняющий крем, тоник и маска для лица. Подходит для всех типов кожи.',
        'product_type': 'PRODUCT',
        'price': '1250.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/30/400/400',
    },
    {
        'name': 'Органический чай «Анатолия» (50 пакетиков)',
        'description': 'Смесь 7 турецких трав — ромашка, шалфей, тимьян, мята, розмарин, лаванда и чабер. Собраны вручную на плантациях Анатолии. Без ГМО, красителей и ароматизаторов.',
        'product_type': 'PRODUCT',
        'price': '380.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/42/400/400',
    },
    {
        'name': 'Турецкий халат ручной работы',
        'description': '100% хлопок, плетение «вафля». Размеры S–XXL. Доступен в 8 цветах. Идеальный подарок — поставляется в фирменной подарочной коробке с открыткой.',
        'product_type': 'PRODUCT',
        'price': '2800.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/57/400/400',
    },
    {
        'name': 'Набор турецкой керамики (6 предметов)',
        'description': 'Расписная керамика ручной работы из Кютахьи. Набор включает 6 тарелок с уникальным орнаментом. Подходит для ежедневного использования и в качестве декора. Сертификат подлинности прилагается.',
        'product_type': 'PRODUCT',
        'price': '4500.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/75/400/400',
    },
    {
        'name': 'Оливковое масло Extra Virgin «Эгейское» 1л',
        'description': 'Масло холодного отжима первого прессования с оливковых плантаций Эгейского побережья. Кислотность < 0.3%. Подходит для готовки и заправок. Сертифицировано по стандарту EU Organic.',
        'product_type': 'PRODUCT',
        'price': '650.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/89/400/400',
    },
    # Услуги
    {
        'name': 'Персональная консультация по подбору товаров',
        'description': 'Видеоконсультация 60 минут с нашим экспертом. Мы поможем подобрать оптимальные товары под ваши нужды, расскажем об особенностях продуктов и ответим на все вопросы. Запись на удобное время.',
        'product_type': 'SERVICE',
        'price': '500.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/100/400/400',
    },
    {
        'name': 'Срочная доставка «Экспресс» (до 2 часов)',
        'description': 'Гарантированная доставка вашего заказа в любую точку Стамбула в течение 2 часов. Услуга доступна ежедневно с 08:00 до 22:00. Трекинг заказа в реальном времени.',
        'product_type': 'SERVICE',
        'price': '250.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/111/400/400',
    },
    {
        'name': 'Подарочная упаковка с персонализацией',
        'description': 'Красивая подарочная упаковка для любого товара из нашего каталога. Выберите дизайн коробки, ленту, открытку с вашим текстом и добавьте персональную гравировку на выбранные предметы.',
        'product_type': 'SERVICE',
        'price': '150.00',
        'currency': 'TRY',
        'image_url': 'https://picsum.photos/id/126/400/400',
    },
]

GROUP_MESSAGES = [
    'Добро пожаловать в официальный канал нашего магазина! 🎉',
    'Здесь мы публикуем актуальные акции, новости и специальные предложения.',
    'Подписывайтесь и будьте первыми кто узнает о наших новинках!',
    'Весенняя распродажа уже началась — успейте купить по лучшим ценам!',
    'Сегодня поступила новая партия товаров. Ссылка на каталог в профиле.',
    'Спасибо всем кто оставил отзывы — вы помогаете нам становиться лучше! ❤️',
    'Напоминаем: бесплатная консультация доступна каждый день с 9 до 20.',
    'Ближайшая акция — 10 апреля. Следите за обновлениями!',
]

INQUIRY_DIALOGS = [
    {
        'product_idx': 0,  # Набор «Люкс»
        'messages': [
            ('customer', 'Добрый день! Интересует набор «Люкс». Есть ли он в наличии?'),
            ('business', 'Добрый день! Да, набор есть в наличии, можем отправить сегодня. Вам нужна доставка по Стамбулу?'),
            ('customer', 'Да, в районе Бешикташ. Сколько времени займёт?'),
            ('business', 'Бешикташ — около 1,5 часов. Стоимость доставки 250 TRY или бесплатно при заказе от 2000 TRY. Оформляем?'),
            ('customer', 'Отлично, оформляем! Оплата картой возможна?'),
            ('business', 'Конечно, принимаем Visa и MasterCard. Пришлите ваш адрес в личные сообщения, и мы сразу подтвердим заказ. 👍'),
        ],
    },
    {
        'product_idx': 5,  # Консультация
        'messages': [
            ('customer', 'Здравствуйте, хочу записаться на консультацию. Как это работает?'),
            ('business', 'Здравствуйте! Консультация проходит в Zoom или WhatsApp, длительность 60 минут. Наш эксперт поможет подобрать товары под ваш запрос.'),
            ('customer', 'Хорошо. Есть ли свободное время на эту неделю?'),
            ('business', 'Да! Свободны четверг 15:00 и пятница 11:00 и 17:00. Какое время вам удобно?'),
            ('customer', 'Пятница 17:00 подойдёт. Как оплатить?'),
            ('business', 'Отправлю вам ссылку на оплату. После подтверждения пришлю данные для входа в конференцию. Ждём вас в пятницу! 🙂'),
        ],
    },
]


class Command(BaseCommand):
    help = 'Создать демо-магазин с полным набором тестовых данных'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Удалить демо-данные перед созданием')

    def handle(self, *args, **options):
        if options['clear']:
            self._clear()

        owner = self._get_or_create_owner()
        business = self._get_or_create_business(owner)
        customers = self._get_or_create_customers()
        tags = self._get_or_create_tags()

        self._create_story(owner)
        self._create_posts(business, tags)
        products = self._create_products(business, tags)
        group = self._create_group(business, owner, customers)
        self._create_inquiries(business, products, customers)

        self.stdout.write(self.style.SUCCESS(
            f'\nDemo shop "{business.brand_name}" created!\n'
            f'   Email: {DEMO_EMAIL}  |  Pass: demo1234\n'
            f'   Posts: 10  |  Story: 1  |  Group: {group.name}\n'
            f'   Products: {len(PRODUCTS_DATA)}  |  Chats: 2  |  FAQ: {len(FAQ_DATA)}\n'
        ))

    # ─── helpers ──────────────────────────────────────────────────────────────

    def _clear(self):
        self.stdout.write('Удаляем демо-данные...')
        User.objects.filter(email__in=[DEMO_EMAIL] + CUSTOMER_EMAILS).delete()
        self.stdout.write('  Готово.')

    def _get_or_create_owner(self):
        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={
                'username': DEMO_USERNAME,
                'role': User.Role.BUSINESS,
                'city': 'Стамбул',
                'is_active': True,
            },
        )
        if created:
            user.set_password('demo1234')
            user.save()
            self.stdout.write(f'  Создан пользователь-бизнес: {DEMO_EMAIL}')
        return user

    def _get_or_create_business(self, owner):
        if hasattr(owner, 'business_profile'):
            biz = owner.business_profile
            self.stdout.write(f'  Бизнес уже существует: {biz.brand_name}')
            return biz

        biz = Business.objects.create(
            owner=owner,
            brand_name='Demo Shop Istanbul',
            description=(
                'Многофункциональный магазин премиум-товаров и услуг в Стамбуле. '
                'Специализируемся на натуральной косметике, турецких деликатесах, '
                'хэнд-мейд изделиях и подарочных наборах. '
                'Доставка по всей Турции и международная пересылка. '
                'Работаем с 2020 года, более 5000 довольных клиентов.'
            ),
            category='BEAUTY',
            city='Стамбул',
            address='Nişantaşı, Abdi İpekçi Cad. 18, İstanbul',
            phone='+90 212 999 88 77',
            website='https://demoshop.istanbul',
            is_verified=True,
            plan_type='VIP',
            plan_period='YEAR',
            plan_expires_at=timezone.now() + timedelta(days=365),
            rating=4.85,
            views_count=3240,
            faq=FAQ_DATA,
        )
        self.stdout.write(f'  Создан бизнес: {biz.brand_name}')
        return biz

    def _get_or_create_customers(self):
        customers = []
        for i, email in enumerate(CUSTOMER_EMAILS, 1):
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': f'customer{i}_demo',
                    'role': User.Role.USER,
                    'city': 'Стамбул',
                    'is_active': True,
                },
            )
            if created:
                user.set_password('test1234')
                user.save()
            customers.append(user)
        self.stdout.write(f'  Покупатели: {len(customers)}')
        return customers

    def _get_or_create_tags(self):
        names = ['демо', 'топ', 'акция', 'стамбул', 'доставка', 'подарок', 'новинка', 'качество']
        tags = []
        for name in names:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        return tags

    def _create_story(self, owner):
        Story.objects.filter(author=owner).delete()
        story = Story.objects.create(
            author=owner,
            media_url='https://picsum.photos/id/15/600/1000',
            media_type='IMAGE',
            caption='🌟 Demo Shop — лучшие товары и услуги Стамбула! Скидка 15% по промокоду DEMO2026',
            expires_at=timezone.now() + timedelta(hours=24),
        )
        self.stdout.write(f'  Создан сторис: #{story.id}')
        return story

    def _create_posts(self, business, tags):
        Post.objects.filter(business=business).delete()
        posts = []
        for i, data in enumerate(POSTS_DATA):
            post = Post.objects.create(
                business=business,
                text=data['text'],
                media_url=data['media_url'],
                media_type='IMAGE',
                views_count=(10 - i) * 87 + 42,
            )
            post.tags.set(tags[:3])
            posts.append(post)
        self.stdout.write(f'  Создано постов: {len(posts)}')
        return posts

    def _create_products(self, business, tags):
        Product.objects.filter(business=business).delete()
        products = []
        for i, data in enumerate(PRODUCTS_DATA):
            product = Product.objects.create(
                business=business,
                name=data['name'],
                description=data['description'],
                product_type=data['product_type'],
                price=data['price'],
                currency=data['currency'],
                image_url=data['image_url'],
                is_available=True,
                views_count=(8 - i % 8) * 55 + 20,
            )
            product.tags.set(tags[i % len(tags): i % len(tags) + 2] or tags[:2])
            products.append(product)
        self.stdout.write(f'  Создано продуктов/услуг: {len(products)}')
        return products

    def _create_group(self, business, owner, customers):
        # Удаляем старую группу если есть
        if business.group:
            old_group = business.group
            business.group = None
            business.save()
            old_group.delete()

        group = GroupChat.objects.create(
            name='Demo Shop — Официальный канал',
            description='Новости, акции и специальные предложения Demo Shop Istanbul. Подписывайтесь чтобы не пропустить ничего важного!',
            photo_url='https://picsum.photos/id/20/200/200',
            creator=owner,
        )

        # Владелец
        GroupMember.objects.create(group=group, user=owner, role='OWNER')
        # Покупатели
        for customer in customers:
            GroupMember.objects.create(group=group, user=customer, role='MEMBER')

        # Сообщения
        for i, text in enumerate(GROUP_MESSAGES):
            GroupMessage.objects.create(group=group, sender=owner, text=text)

        # Привязываем группу к бизнесу
        business.group = group
        business.save()

        self.stdout.write(f'  Создана группа: {group.name} ({group.members.count()} участников)')
        return group

    def _create_inquiries(self, business, products, customers):
        ProductInquiry.objects.filter(product__business=business).delete()

        for i, dialog in enumerate(INQUIRY_DIALOGS):
            product = products[dialog['product_idx']]
            customer = customers[i % len(customers)]

            inquiry = ProductInquiry.objects.create(
                product=product,
                sender=customer,
                message=dialog['messages'][0][1],
                is_read=True,
            )

            for role, text in dialog['messages'][1:]:
                sender = business.owner if role == 'business' else customer
                InquiryMessage.objects.create(
                    inquiry=inquiry,
                    sender=sender,
                    text=text,
                )

        self.stdout.write(f'  Создано чатов (inquiries): {len(INQUIRY_DIALOGS)}')
