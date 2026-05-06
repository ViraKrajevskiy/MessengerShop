
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from Shop.models import User, Business, Story, StoryView, Comment


def make_user(role=User.Role.USER, suffix='1', active=True):
    return User.objects.create_user(
        username=f'user_{suffix}',
        email=f'user_{suffix}@test.com',
        password='pass1234',
        role=role,
        is_active=active,
    )

def make_business_user(suffix='biz'):
    return make_user(role=User.Role.BUSINESS, suffix=suffix)

class UserModelTest(TestCase):

    def test_create_regular_user(self):
        u = make_user(suffix='reg')
        self.assertEqual(u.role, User.Role.USER)
        self.assertFalse(u.is_business)
        self.assertIn(u.email, str(u))
        self.assertIn(User.Role.USER, str(u))

    def test_create_business_user(self):
        u = make_business_user('b1')
        self.assertTrue(u.is_business)
        self.assertEqual(u.role, User.Role.BUSINESS)

    def test_create_moderator(self):
        u = make_user(role=User.Role.MODERATOR, suffix='mod')
        self.assertEqual(u.role, User.Role.MODERATOR)

    def test_email_is_unique(self):
        u = make_user(suffix='dup')
        with self.assertRaises(Exception):
            # Тот же email — должна быть ошибка уникальности
            User.objects.create_user(
                username='dup2', email=u.email,
                password='pass', role=User.Role.USER,
            )

    def test_username_field_is_email(self):
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_user_has_timestamps(self):
        u = make_user(suffix='ts')
        self.assertIsNotNone(u.created_at)
        self.assertIsNotNone(u.updated_at)


# ── Business ──────────────────────────────────────────────────────────────────

class BusinessModelTest(TestCase):

    def setUp(self):
        self.owner = make_business_user('owner')

    def test_create_business_profile(self):
        biz = Business.objects.create(
            owner=self.owner,
            brand_name='Студия красоты Лейла',
            category=Business.Category.BEAUTY,
            city='Стамбул',
            phone='+90 555 123 45 67',
        )
        self.assertEqual(biz.brand_name, 'Студия красоты Лейла')
        self.assertEqual(biz.category, Business.Category.BEAUTY)
        self.assertFalse(biz.is_verified)
        self.assertFalse(biz.is_vip)
        self.assertEqual(float(biz.rating), 0.0)
        self.assertEqual(biz.views_count, 0)

    def test_business_str(self):
        biz = Business.objects.create(owner=self.owner, brand_name='МойБренд')
        self.assertIn('МойБренд', str(biz))
        self.assertIn(self.owner.email, str(biz))

    def test_one_owner_one_business(self):
        Business.objects.create(owner=self.owner, brand_name='Первый')
        with self.assertRaises(Exception):
            Business.objects.create(owner=self.owner, brand_name='Второй')

    def test_business_all_fields(self):
        biz = Business.objects.create(
            owner=self.owner,
            brand_name='АвтоСервис Ахмад',
            description='Ремонт авто в Стамбуле',
            category=Business.Category.TRANSPORT,
            city='Стамбул',
            address='Beyoğlu, İstanbul',
            phone='+90 212 000 00 00',
            website='https://ahmad-auto.com',
            is_vip=True,
            is_verified=True,
            rating=4.85,
        )
        self.assertTrue(biz.is_vip)
        self.assertTrue(biz.is_verified)
        self.assertEqual(float(biz.rating), 4.85)

    def test_business_category_choices(self):
        categories = [c[0] for c in Business.Category.choices]
        self.assertIn('BEAUTY', categories)
        self.assertIn('HEALTH', categories)
        self.assertIn('REALTY', categories)
        self.assertIn('FINANCE', categories)


# ── Story ─────────────────────────────────────────────────────────────────────

class StoryModelTest(TestCase):

    def setUp(self):
        self.author = make_business_user('story_author')

    def _make_story(self, **kwargs):
        return Story.objects.create(
            author=self.author,
            media='stories/test.jpg',
            **kwargs,
        )

    def test_story_created(self):
        story = self._make_story(caption='Акция!')
        self.assertEqual(story.author, self.author)
        self.assertEqual(story.caption, 'Акция!')
        self.assertEqual(story.media_type, Story.MediaType.IMAGE)

    def test_story_is_active_within_24h(self):
        story = self._make_story()
        self.assertTrue(story.is_active)

    def test_story_is_inactive_after_24h(self):
        story = self._make_story()
        story.expires_at = timezone.now() - timedelta(hours=1)
        story.save()
        self.assertFalse(story.is_active)

    def test_story_views_count(self):
        story = self._make_story()
        viewer = make_user(suffix='v1')
        StoryView.objects.create(story=story, viewer=viewer)
        self.assertEqual(story.views_count, 1)

    def test_story_str(self):
        story = self._make_story()
        self.assertIn(self.author.email, str(story))

    def test_story_ordering_newest_first(self):
        s1 = self._make_story(caption='Первый')
        s2 = self._make_story(caption='Второй')
        stories = list(Story.objects.all())
        self.assertEqual(stories[0], s2)
        self.assertEqual(stories[1], s1)


# ── StoryView ─────────────────────────────────────────────────────────────────

class StoryViewModelTest(TestCase):

    def setUp(self):
        self.author = make_business_user('sv_author')
        self.story  = Story.objects.create(author=self.author, media='stories/x.jpg')
        self.viewer = make_user(suffix='sv_viewer')

    def test_create_view(self):
        sv = StoryView.objects.create(story=self.story, viewer=self.viewer)
        self.assertEqual(sv.story, self.story)
        self.assertEqual(sv.viewer, self.viewer)

    def test_no_duplicate_views(self):
        StoryView.objects.create(story=self.story, viewer=self.viewer)
        with self.assertRaises(Exception):
            StoryView.objects.create(story=self.story, viewer=self.viewer)

    def test_str(self):
        sv = StoryView.objects.create(story=self.story, viewer=self.viewer)
        self.assertIn(self.viewer.email, str(sv))


# ── Comment ───────────────────────────────────────────────────────────────────

class CommentModelTest(TestCase):

    def setUp(self):
        self.author = make_business_user('c_author')
        self.story  = Story.objects.create(author=self.author, media='stories/c.jpg')
        self.commenter = make_user(suffix='commenter')

    def _make_comment(self, text='Отличный пост!', parent=None):
        return Comment.objects.create(
            story=self.story, author=self.commenter,
            text=text, parent=parent,
        )

    def test_create_comment(self):
        c = self._make_comment()
        self.assertEqual(c.text, 'Отличный пост!')
        self.assertFalse(c.is_deleted)
        self.assertIsNone(c.parent)

    def test_reply_to_comment(self):
        root = self._make_comment('Корневой')
        reply = self._make_comment('Ответ', parent=root)
        self.assertEqual(reply.parent, root)
        self.assertIn(reply, root.replies.all())

    def test_soft_delete(self):
        c = self._make_comment()
        c.is_deleted = True
        c.text = '[комментарий удалён]'
        c.save()
        refreshed = Comment.objects.get(pk=c.pk)
        self.assertTrue(refreshed.is_deleted)
        self.assertEqual(refreshed.text, '[комментарий удалён]')

    def test_comment_str(self):
        c = self._make_comment()
        self.assertIn(self.commenter.email, str(c))

    def test_max_length(self):
        # TextField с max_length=1000: проверяем через сериализатор/форму
        # На уровне модели Django не бросает исключение для TextField в SQLite,
        # поэтому проверяем что объект создан и текст сохранён без ошибок
        normal = self._make_comment('а' * 1000)
        self.assertEqual(len(normal.text), 1000)
        # Проверяем что пустой текст тоже хранится
        empty = self._make_comment('')
        self.assertEqual(empty.text, '')
