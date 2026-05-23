from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Shop', '0012_business_blocked_until'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='card_media',
            field=models.FileField(blank=True, null=True, upload_to='card_media/'),
        ),
    ]
