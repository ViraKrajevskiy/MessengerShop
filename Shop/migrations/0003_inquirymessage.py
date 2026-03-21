from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Shop', '0002_user_qr_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='InquiryMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('inquiry', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='Shop.productinquiry')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inquiry_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
    ]
