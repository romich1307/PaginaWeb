from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0016_curso_imagen_pregunta_respuesta_correcta'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pregunta',
            name='imagen_pregunta',
            field=models.URLField(max_length=500, blank=True, null=True, verbose_name="Imagen de la Pregunta"),
        ),
    ]
