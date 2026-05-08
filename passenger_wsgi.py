import sys
import os

INTERP = '/home/goldenha/virtualenv/MessengerShop/3.12/bin/python3'
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.insert(0, '/home/goldenha/MessengerShop')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Config.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
