# Brevo Email Setup Guide

## Problem
Getting `401 Unauthorized` or `Key not found` when trying to send emails via Brevo API v3.

## Solution

### Step 1: Get a Valid Brevo API Key

1. Go to https://app.brevo.com/settings/keys/api
2. Copy your **SMTP API Key** (should start with `xsmtpsib-`)
3. **DO NOT use the regular API key** - make sure it's the SMTP key

### Step 2: Update Server .env File

On your server (72.62.114.71), update `/srv/messhop/.env`:

```bash
# Edit the file
nano /srv/messhop/.env

# Find and update this line:
EMAIL_HOST_PASSWORD=xsmtpsib-your_actual_api_key_here

# Save with Ctrl+O, then Ctrl+X
```

### Step 3: Verify Configuration

Run one of these tests:

**Option A: Test with Python script (recommended)**
```bash
cd /srv/messhop
python test_brevo_api_direct.py
```

**Option B: Test with curl**
```bash
API_KEY="xsmtpsib-your_api_key_here"

curl -X GET https://api.brevo.com/v3/account \
  -H "api-key: $API_KEY" \
  -H "Content-Type: application/json"
```

If you see your account email - the key is valid! ✓

### Step 4: Restart Docker Containers

```bash
cd /srv/messhop
docker compose restart backend
```

Wait about 10 seconds for the backend to start.

### Step 5: Test Email Registration

Try registering a new account at your site. You should now receive the verification email.

---

## Troubleshooting

### Error: "Key not found" or 401 Unauthorized

**Most likely cause:** Invalid or expired API key

- ✓ Make sure it starts with `xsmtpsib-`
- ✓ Make sure you copied it exactly (no extra spaces)
- ✓ Make sure it's the **SMTP API key**, not the regular API key
- ✓ Check that it's not expired on the Brevo dashboard

### Error: Can't connect to Brevo API

- Check your internet connection: `curl https://api.brevo.com`
- Check if Brevo is down: https://status.brevo.com

### Emails are being sent but not arriving

- Check Brevo dashboard: https://app.brevo.com/sms
- May take 1-2 minutes to arrive
- Check spam folder
- Verify sender email matches DEFAULT_FROM_EMAIL in settings.py

---

## Debugging

### View Backend Logs

```bash
docker compose logs -f backend
```

Look for lines with `[EMAIL SUCCESS]` or `[EMAIL ERROR]`

### Test Email Backend Directly

```bash
cd /srv/messhop
docker compose exec backend python manage.py test_brevo_api
```

---

## Files Modified

- `Shop/email_backend.py` - Brevo API v3 implementation with better error logging
- `Config/settings.py` - EMAIL_BACKEND configuration
- `docker-compose.yml` - .env file mounting

All these are already deployed. Just make sure your API key is correct in `.env`!
