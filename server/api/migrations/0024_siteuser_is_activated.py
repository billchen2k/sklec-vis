# Generated by Django 4.0.2 on 2022-07-16 11:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_viewtifffile'),
    ]

    operations = [
        migrations.AddField(
            model_name='siteuser',
            name='is_activated',
            field=models.BooleanField(default=False),
        ),
    ]
