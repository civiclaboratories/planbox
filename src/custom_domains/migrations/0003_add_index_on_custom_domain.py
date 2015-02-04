# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('custom_domains', '0002_remove_tilde_from_project_urls'),
    ]

    operations = [
        migrations.AlterField(
            model_name='domainmapping',
            name='domain',
            field=models.CharField(max_length=250, verbose_name='Custom domain', db_index=True),
            preserve_default=True,
        ),
    ]
