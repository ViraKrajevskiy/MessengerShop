from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Shop', '0011_business_is_blocked'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='blocked_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
