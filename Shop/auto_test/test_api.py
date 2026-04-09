"""
API-тесты для всех эндпоинтов.
Запуск: python manage.py test Shop.auto_test.test_api
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from Shop.models import User, Business, Story, Comment


def make_user(role=User.Role.USER, suffix='1', active=True):
    return User.objects.create_user(
        username=f'user_{suffix}',
        email=f'user_{suffix}@test.com',
        password='pass1234',
        role=role,
        is_active=active,
    )


def auth_client(user):
    client = APIClient()
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(token.access_token)}')
    return client

class RegisterAPITest(APITestCase):

    def test_register_success(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'newuser', 'email': 'new@test.com',
            'password': 'pass1234', 'password2': 'pass1234',
            'role': 'USER',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', resp.data)

    def test_register_business(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'bizuser', 'email': 'biz@test.com',
            'password': 'pass1234', 'password2': 'pass1234',
            'role': 'BUSINESS', 'city': 'Стамбул',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_register_duplicate_email(self):
        u = make_user(suffix='dup')
        resp = self.client.post('/api/auth/register/', {
            'username': 'dup2', 'email': u.email,  # тот же email
            'password': 'pass1234', 'password2': 'pass1234',
            'role': 'USER',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'x', 'email': 'x@test.com',
            'password': 'pass1234', 'password2': 'wrong',
            'role': 'USER',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields(self):
        resp = self.client.post('/api/auth/register/', {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(APITestCase):

    def setUp(self):
        self.user = make_user(suffix='login')

    def test_login_success(self):
        resp = self.client.post('/api/auth/login/', {
            'email': self.user.email, 'password': 'pass1234',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertIn('user', resp.data)

    def test_login_wrong_password(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'user_login@test.com', 'password': 'wrong',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_inactive_user(self):
        u = make_user(suffix='inact', active=False)
        resp = self.client.post('/api/auth/login/', {
            'email': u.email, 'password': 'pass1234',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_email(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'ghost@test.com', 'password': 'pass',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class MeAPITest(APITestCase):

    def setUp(self):
        self.user = make_user(suffix='me')
        self.client = auth_client(self.user)

    def test_get_me(self):
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], self.user.email)

    def test_patch_me_city(self):
        resp = self.client.patch('/api/auth/me/', {'city': 'Анкара'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_me_requires_auth(self):
        resp = self.client.get('/api/auth/me/')
        # Уже авторизован — 200
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_me_unauth(self):
        resp = APIClient().get('/api/auth/me/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Business API ──────────────────────────────────────────────────────────────

class BusinessAPITest(APITestCase):

    def setUp(self):
        self.regular  = make_user(suffix='reg_b')
        self.business = make_user(role=User.Role.BUSINESS, suffix='biz_b')
        self.biz_client = auth_client(self.business)
        self.reg_client = auth_client(self.regular)

    def test_list_businesses_public(self):
        Business.objects.create(owner=self.business, brand_name='Тест')
        resp = APIClient().get('/api/businesses/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_create_business_by_businessman(self):
        resp = self.biz_client.post('/api/businesses/create/', {
            'brand_name': 'Студия Лейла',
            'category': 'BEAUTY',
            'city': 'Стамбул',
            'description': 'Профессиональная студия красоты',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['brand_name'], 'Студия Лейла')

    def test_create_business_ignores_remove_audio_flag(self):
        resp = self.biz_client.post('/api/businesses/create/', {
            'brand_name': 'РЎС‚СѓРґРёСЏ Р‘РµР· РђСѓРґРёРѕ',
            'category': 'BEAUTY',
            'remove_audio': True,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['brand_name'], 'РЎС‚СѓРґРёСЏ Р‘РµР· РђСѓРґРёРѕ')
        self.assertTrue(Business.objects.filter(owner=self.business).exists())

    def test_create_business_by_regular_user_forbidden(self):
        resp = self.reg_client.post('/api/businesses/create/', {
            'brand_name': 'Попытка', 'category': 'OTHER',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_create_two_businesses(self):
        Business.objects.create(owner=self.business, brand_name='Первый')
        resp = self.biz_client.post('/api/businesses/create/', {
            'brand_name': 'Второй', 'category': 'OTHER',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_business_detail(self):
        biz = Business.objects.create(owner=self.business, brand_name='Мой Бизнес')
        resp = APIClient().get(f'/api/businesses/{biz.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['brand_name'], 'Мой Бизнес')

    def test_patch_business_by_owner(self):
        biz = Business.objects.create(owner=self.business, brand_name='Старое')
        resp = self.biz_client.patch(f'/api/businesses/{biz.pk}/', {
            'brand_name': 'Новое',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_patch_business_by_other_forbidden(self):
        other = make_user(role=User.Role.BUSINESS, suffix='other_biz')
        biz = Business.objects.create(owner=other, brand_name='Чужой')
        resp = self.biz_client.patch(f'/api/businesses/{biz.pk}/', {
            'brand_name': 'Взлом',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_business_by_owner(self):
        biz = Business.objects.create(owner=self.business, brand_name='Удалить')
        resp = self.biz_client.delete(f'/api/businesses/{biz.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_by_city(self):
        b1 = make_user(role=User.Role.BUSINESS, suffix='fcity1')
        b2 = make_user(role=User.Role.BUSINESS, suffix='fcity2')
        Business.objects.create(owner=b1, brand_name='Стамбул Бизнес', city='Стамбул')
        Business.objects.create(owner=b2, brand_name='Анкара Бизнес', city='Анкара')
        resp = APIClient().get('/api/businesses/?city=Стамбул')
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['city'], 'Стамбул')


# ── Stories API ───────────────────────────────────────────────────────────────

class StoryAPITest(APITestCase):

    def setUp(self):
        self.biz_user  = make_user(role=User.Role.BUSINESS, suffix='story_biz')
        self.reg_user  = make_user(suffix='story_reg')
        self.biz_client = auth_client(self.biz_user)
        self.reg_client = auth_client(self.reg_user)

    def test_list_stories_requires_auth(self):
        resp = APIClient().get('/api/stories/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_stories_authenticated(self):
        resp = self.reg_client.get('/api/stories/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_regular_user_cannot_create_story(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        img = SimpleUploadedFile('t.jpg', b'img', content_type='image/jpeg')
        resp = self.reg_client.post('/api/stories/', {'media': img, 'media_type': 'IMAGE'}, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_story_detail_and_view_count(self):
        story = Story.objects.create(author=self.biz_user, media='stories/t.jpg')
        resp = self.reg_client.get(f'/api/stories/{story.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['views_count'], 1)

    def test_delete_own_story(self):
        story = Story.objects.create(author=self.biz_user, media='stories/t.jpg')
        resp = self.biz_client.delete(f'/api/stories/{story.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_others_story_forbidden(self):
        story = Story.objects.create(author=self.biz_user, media='stories/t.jpg')
        resp = self.reg_client.delete(f'/api/stories/{story.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ── Comments API ──────────────────────────────────────────────────────────────

class CommentAPITest(APITestCase):

    def setUp(self):
        self.biz_user    = make_user(role=User.Role.BUSINESS, suffix='com_biz')
        self.reg_user    = make_user(suffix='com_reg')
        self.story       = Story.objects.create(author=self.biz_user, media='stories/c.jpg')
        self.biz_client  = auth_client(self.biz_user)
        self.reg_client  = auth_client(self.reg_user)

    def test_add_comment(self):
        resp = self.reg_client.post(
            f'/api/stories/{self.story.pk}/comments/',
            {'text': 'Отлично!'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['text'], 'Отлично!')

    def test_list_comments(self):
        Comment.objects.create(story=self.story, author=self.reg_user, text='Привет')
        resp = self.reg_client.get(f'/api/stories/{self.story.pk}/comments/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_reply_to_comment(self):
        parent = Comment.objects.create(story=self.story, author=self.reg_user, text='Корень')
        resp = self.reg_client.post(
            f'/api/stories/{self.story.pk}/comments/',
            {'text': 'Ответ', 'parent': parent.pk},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_edit_own_comment(self):
        c = Comment.objects.create(story=self.story, author=self.reg_user, text='Старый')
        resp = self.reg_client.patch(f'/api/comments/{c.pk}/', {'text': 'Новый'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['text'], 'Новый')

    def test_edit_others_comment_forbidden(self):
        c = Comment.objects.create(story=self.story, author=self.reg_user, text='Чужой')
        resp = self.biz_client.patch(f'/api/comments/{c.pk}/', {'text': 'Взлом'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_soft_delete_comment(self):
        c = Comment.objects.create(story=self.story, author=self.reg_user, text='Удали меня')
        resp = self.reg_client.delete(f'/api/comments/{c.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        c.refresh_from_db()
        self.assertTrue(c.is_deleted)

    def test_comment_requires_auth(self):
        resp = APIClient().post(
            f'/api/stories/{self.story.pk}/comments/',
            {'text': 'Анонимно'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
