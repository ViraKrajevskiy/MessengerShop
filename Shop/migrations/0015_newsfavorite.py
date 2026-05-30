import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Shop', '0014_businessfavorite'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewsFavorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('news', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='Shop.news')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorite_news', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'News Favorite',
                'verbose_name_plural': 'News Favorites',
                'ordering': ['-created_at'],
                'unique_together': {('user', 'news')},
            },
        ),
    ]
