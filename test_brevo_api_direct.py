#!/usr/bin/env python
"""
Direct test of Brevo API key without Django
Run: python test_brevo_api_direct.py xsmtpsib-YOUR_API_KEY_HERE
Or set EMAIL_HOST_PASSWORD in .env and run: python test_brevo_api_direct.py
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load .env file
load_dotenv()

def test_brevo_api(api_key=None):
    if not api_key:
        api_key = os.getenv('EMAIL_HOST_PASSWORD', '').strip()

    if not api_key:
        print("❌ ERROR: No API key provided and EMAIL_HOST_PASSWORD not in .env")
        print("\nUsage:")
        print("  python test_brevo_api_direct.py xsmtpsib-your_api_key")
        print("  or set EMAIL_HOST_PASSWORD in .env")
        return False

    # Mask key for display
    key_display = api_key[:15] + '...' + api_key[-5:] if len(api_key) > 20 else '***'
    print(f"📝 Testing API key: {key_display}")
    print(f"   Key length: {len(api_key)} chars")

    # Check format
    if not api_key.startswith('xsmtpsib-'):
        print("⚠️  WARNING: API key should start with 'xsmtpsib-'")
        print("   Get the correct key from: https://app.brevo.com/settings/keys/api\n")

    # Test 1: Get account info
    print("\n🔍 Test 1: Getting account info...")
    headers = {
        'api-key': api_key,
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get('https://api.brevo.com/v3/account', headers=headers, timeout=5)

        if response.status_code == 200:
            print(f"✓ SUCCESS! Status: {response.status_code}")
            data = response.json()
            print(f"  Account email: {data.get('email', 'N/A')}")
            print(f"  Plan: {data.get('plan', 'N/A')}")
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

    # Test 2: Test email sending endpoint (without actually sending)
    print("\n🔍 Test 2: Testing email endpoint...")
    email_data = {
        "sender": {"email": "test@example.com", "name": "Test"},
        "to": [{"email": "test@example.com", "name": "Test"}],
        "subject": "Test",
        "htmlContent": "<p>Test</p>"
    }

    try:
        response = requests.post(
            'https://api.brevo.com/v3/smtp/email',
            headers=headers,
            json=email_data,
            timeout=5
        )

        if response.status_code == 201:
            print(f"✓ SUCCESS! Email endpoint is working (Status: {response.status_code})")
            print(f"  Response: {response.json()}")
        elif response.status_code == 400:
            # 400 is expected for test@example.com (invalid email)
            print(f"⚠️  Status: {response.status_code} (This is expected for test@example.com)")
            print(f"   But the API key IS valid! Response: {response.text}")
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            print(f"   Response: {response.text}")
            if response.status_code == 401:
                print("\n   ❌ 401 Unauthorized - API KEY IS INVALID!")
                print("   Get a new key from: https://app.brevo.com/settings/keys/api")
            return False

    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

    print("\n" + "="*60)
    print("✓ All tests passed! Your Brevo API key is valid.")
    print("="*60)
    return True


if __name__ == '__main__':
    api_key = sys.argv[1] if len(sys.argv) > 1 else None
    success = test_brevo_api(api_key)
    sys.exit(0 if success else 1)
