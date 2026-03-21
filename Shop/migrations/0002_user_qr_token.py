import uuid
from django.db import migrations, models


def populate_qr_tokens(apps, schema_editor):
    User = apps.get_model('Shop', 'User')
    for user in User.objects.all():
        user.qr_token = uuid.uuid4()
        user.save(update_fields=['qr_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('Shop', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='qr_token',
            field=models.UUIDField(null=True, editable=False),
        ),
        migrations.RunPython(populate_qr_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='qr_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
