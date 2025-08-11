from django.core.management.base import BaseCommand
from authentication.models import CustomUser


class Command(BaseCommand):
    help = 'Hacer administrador al usuario con email jiji@gmail.com'

    def handle(self, *args, **options):
        email = 'jiji@gmail.com'
        
        try:
            user = CustomUser.objects.get(email=email)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Usuario {email} ahora es administrador')
            )
            self.stdout.write(f'is_staff: {user.is_staff}')
            self.stdout.write(f'is_superuser: {user.is_superuser}')
            
        except CustomUser.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Usuario con email {email} no encontrado')
            )
