"""
Django management command to test Brevo API configuration
Run: python manage.py test_brevo_api
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import requests


class Command(BaseCommand):
    help = 'Test Brevo API key configuration and connectivity'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Testing Brevo API Configuration'))
        self.stdout.write('-' * 60)

        # Step 1: Check if API key is configured
        api_key = settings.EMAIL_HOST_PASSWORD
        if not api_key:
            self.stdout.write(self.style.ERROR('❌ EMAIL_HOST_PASSWORD is empty!'))
            self.stdout.write('Make sure your .env file contains: EMAIL_HOST_PASSWORD=xsmtpsib-...')
            return

        # Mask the key for display
        key_display = api_key[:10] + '...' + api_key[-5:] if len(api_key) > 15 else '***'
        self.stdout.write(self.style.SUCCESS(f'✓ API Key found: {key_display}'))
        self.stdout.write(f'  Key length: {len(api_key)} chars')

        # Step 2: Check if key format looks valid
        if not api_key.startswith('xsmtpsib-'):
            self.stdout.write(self.style.WARNING('⚠ API key should start with "xsmtpsib-"'))
            self.stdout.write('   This might cause authentication errors')

        # Step 3: Test API connectivity with a simple request
        self.stdout.write('\n📡 Testing API connectivity...')
        headers = {
            'api-key': api_key,
            'Content-Type': 'application/json'
        }

        # Use a simple test endpoint: GET account info
        test_url = 'https://api.brevo.com/v3/account'
        try:
            response = requests.get(test_url, headers=headers, timeout=5)

            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS(f'✓ API connection successful! (Status: {response.status_code})'))
                data = response.json()
                self.stdout.write(f'  Account email: {data.get("email", "N/A")}')
                self.stdout.write(f'  Plan: {data.get("plan", "N/A")}')
            else:
                self.stdout.write(self.style.ERROR(f'❌ API request failed (Status: {response.status_code})'))
                self.stdout.write(f'  Response: {response.text}')
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f'❌ Connection error: {str(e)}'))

        # Step 4: Check DEFAULT_FROM_EMAIL
        self.stdout.write('\n📧 Email Configuration:')
        self.stdout.write(f'  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')
        self.stdout.write(f'  EMAIL_BACKEND: {settings.EMAIL_BACKEND}')

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✓ Test complete!'))
