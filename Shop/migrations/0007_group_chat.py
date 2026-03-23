from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Shop', '0006_business_subscription'),
    ]

    operations = [
        migrations.CreateModel(
            name='GroupChat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.CharField(blank=True, max_length=500)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='group_photos/')),
                ('photo_url', models.URLField(blank=True)),
                ('creator', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_groups',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'verbose_name': 'Group Chat', 'verbose_name_plural': 'Group Chats', 'ordering': ['-updated_at']},
        ),
        migrations.CreateModel(
            name='GroupMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(
                    choices=[('OWNER', 'Владелец'), ('ADMIN', 'Администратор'), ('MEMBER', 'Участник')],
                    default='MEMBER', max_length=10,
                )),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='Shop.groupchat')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': 'Group Member', 'verbose_name_plural': 'Group Members', 'unique_together': {('group', 'user')}},
        ),
        migrations.CreateModel(
            name='GroupMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('is_pinned', models.BooleanField(default=False)),
                ('is_deleted', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_messages', to='Shop.groupchat')),
                ('sender', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='group_messages_sent',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'verbose_name': 'Group Message', 'verbose_name_plural': 'Group Messages', 'ordering': ['created_at']},
        ),
    ]
