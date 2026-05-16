"""
Custom email backend using Brevo (Sendinblue) API v3
"""
import json
import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import requests

logger = logging.getLogger(__name__)


class BrevoEmailBackend(BaseEmailBackend):
    """
    Email backend that sends emails through Brevo API v3
    instead of SMTP. Works immediately without account activation.

    Requires:
    - EMAIL_HOST_PASSWORD: Brevo API key (xsmtpsib-...)
    - DEFAULT_FROM_EMAIL: Sender email address
    """

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = settings.EMAIL_HOST_PASSWORD
        self.api_url = 'https://api.brevo.com/v3/smtp/email'
        self.fail_silently = fail_silently

    def send_messages(self, email_messages):
        """Send one or more EmailMessage objects and return the number sent."""
        if not email_messages:
            return 0

        msg_count = 0
        for message in email_messages:
            try:
                self.send_message(message)
                msg_count += 1
            except Exception as e:
                if not self.fail_silently:
                    raise
                logger.error(f'[EMAIL ERROR] Failed to send email: {str(e)}')

        return msg_count

    def send_message(self, message):
        """Send a single EmailMessage object."""
        if not self.api_key:
            raise ValueError('Brevo API key (EMAIL_HOST_PASSWORD) is not configured')

        # Prepare recipients
        to_emails = [{'email': addr, 'name': ''} for addr in message.to]
        cc_emails = [{'email': addr, 'name': ''} for addr in message.cc]
        bcc_emails = [{'email': addr, 'name': ''} for addr in message.bcc]

        # Prepare email data
        email_data = {
            'sender': {
                'email': message.from_email,
                'name': settings.DEFAULT_FROM_EMAIL.split('<')[0].strip() if '<' in settings.DEFAULT_FROM_EMAIL else 'System'
            },
            'to': to_emails,
            'subject': message.subject,
            'htmlContent': message.body if message.content_subtype == 'html' else None,
            'textContent': message.body if message.content_subtype == 'plain' else None,
        }

        # Add CC and BCC if present
        if cc_emails:
            email_data['cc'] = cc_emails
        if bcc_emails:
            email_data['bcc'] = bcc_emails

        # Send via API
        headers = {
            'api-key': self.api_key,
            'Content-Type': 'application/json'
        }

        try:
            response = requests.post(
                self.api_url,
                json=email_data,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            logger.info(f'[EMAIL SUCCESS] Email sent to {", ".join(message.to)}')
            return True
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e.response, 'text'):
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('message', str(e))
                except:
                    error_msg = e.response.text

            logger.error(f'[EMAIL ERROR] Failed to send email to {", ".join(message.to)}: {error_msg}')
            raise
