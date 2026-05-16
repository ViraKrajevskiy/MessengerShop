#!/bin/bash

# Debug script to test Brevo email setup on the server
# Run: bash test_email_debug.sh

echo "🔍 Brevo Email Setup Debug"
echo "======================================"

# Check if .env file exists
if [ -f .env ]; then
    echo "✓ .env file found"

    # Extract EMAIL_HOST_PASSWORD
    EMAIL_KEY=$(grep 'EMAIL_HOST_PASSWORD=' .env | cut -d '=' -f 2-)

    if [ -z "$EMAIL_KEY" ]; then
        echo "❌ EMAIL_HOST_PASSWORD is not set in .env"
        exit 1
    fi

    # Display masked key
    key_display="${EMAIL_KEY:0:10}...${EMAIL_KEY: -5}"
    echo "✓ API Key found: $key_display (length: ${#EMAIL_KEY})"

    # Check format
    if [[ $EMAIL_KEY == xsmtpsib-* ]]; then
        echo "✓ API key format looks valid"
    else
        echo "⚠ WARNING: API key should start with 'xsmtpsib-'"
    fi
else
    echo "❌ .env file not found"
    exit 1
fi

echo ""
echo "📡 Testing Brevo API connectivity..."
echo "======================================"

# Test API with curl
curl -X GET https://api.brevo.com/v3/account \
  -H "api-key: $EMAIL_KEY" \
  -H "Content-Type: application/json" \
  -s -w "\nStatus: %{http_code}\n"

echo ""
echo "Done!"
