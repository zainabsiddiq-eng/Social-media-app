from django.db import migrations, models


PERMISSIONS = [
    ("view", "Can view post list"),
    ("update", "Can update any post"),
    ("delete", "Can delete any post"),
]


def seed_post_permissions(apps, schema_editor):
    PostPermission = apps.get_model("app", "PostPermission")
    for code, name in PERMISSIONS:
        PostPermission.objects.get_or_create(code=code, defaults={"name": name})


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0005_increase_phone_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostPermission",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "code",
                    models.CharField(
                        choices=[
                            ("view", "Can view post list"),
                            ("update", "Can update any post"),
                            ("delete", "Can delete any post"),
                        ],
                        max_length=20,
                        unique=True,
                    ),
                ),
                ("name", models.CharField(max_length=100)),
            ],
            options={
                "verbose_name": "Post permission",
                "verbose_name_plural": "Post permissions",
                "ordering": ["id"],
            },
        ),
        migrations.AddField(
            model_name="user",
            name="post_permissions",
            field=models.ManyToManyField(
                blank=True,
                help_text="Select permissions for this user with the arrows.",
                related_name="users",
                to="app.postpermission",
                verbose_name="Permissions",
            ),
        ),
        migrations.CreateModel(
            name="UserPostPermission",
            fields=[],
            options={
                "verbose_name": "User permission",
                "verbose_name_plural": "User permissions",
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("app.user",),
        ),
        migrations.RunPython(seed_post_permissions, migrations.RunPython.noop),
    ]
