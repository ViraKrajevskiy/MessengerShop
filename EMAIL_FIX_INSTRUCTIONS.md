# Email Setup - Quick Fix Instructions

## What was the problem?
Your registration emails weren't being sent. Error: `401 Unauthorized - Key not found`

This means the Brevo API key in your `.env` file is either:
- ❌ Not set (empty)
- ❌ Invalid or expired
- ❌ Wrong format (should start with `xsmtpsib-`)

## What to do now?

### 1. SSH to your server
```bash
ssh root@72.62.114.71
cd /srv/messhop
```

### 2. Pull the latest code (includes debugging tools)
```bash
git pull origin master
```

### 3. Get a valid Brevo API key
Go to: https://app.brevo.com/settings/keys/api

⚠️ **Important:** Copy the **SMTP API Key** (not the regular API key)
It should look like: `xsmtpsib-...`

### 4. Update your .env file
```bash
nano /srv/messhop/.env

# Find this line:
EMAIL_HOST_PASSWORD=

# Update it with your API key:
EMAIL_HOST_PASSWORD=xsmtpsib-your_actual_key_here

# Save: Ctrl+O, then Enter, then Ctrl+X
```

### 5. Test the API key (to verify it's valid)
```bash
# Quick test with Python
python test_brevo_api_direct.py

# Or test with curl
API_KEY="your_key_here"
curl -X GET https://api.brevo.com/v3/account \
  -H "api-key: $API_KEY" \
  -H "Content-Type: application/json"
```

You should see your Brevo account info. If you get `401` error - the key is wrong.

### 6. Restart Docker
```bash
docker compose restart backend
```

### 7. Test email registration
Go to your site and try to register. You should now receive a verification email!

---

## If it still doesn't work:

### Check the logs
```bash
docker compose logs -f backend | grep EMAIL
```

### Test within Django
```bash
docker compose exec backend python manage.py test_brevo_api
```

This will show:
- ✓ Whether EMAIL_HOST_PASSWORD is configured
- ✓ Whether the API key has the right format
- ✓ Whether the API is reachable
- ✓ Whether authentication works

---

## Common Issues

| Error | Solution |
|-------|----------|
| `Key not found` | API key is invalid. Get a new one from Brevo dashboard |
| `401 Unauthorized` | Same as above - API key is wrong |
| Empty EMAIL_HOST_PASSWORD | You didn't set it in .env |
| Wrong format (doesn't start with `xsmtpsib-`) | Make sure you copied the SMTP API key, not something else |

---

## Files Changed

These files were updated to make debugging easier:

- `Shop/email_backend.py` - Better error logging
- `Shop/management/commands/test_brevo_api.py` - Django test command
- `test_brevo_api_direct.py` - Python script to test API key
- `test_email_debug.sh` - Bash script to verify .env
- `BREVO_EMAIL_SETUP.md` - Detailed troubleshooting guide

All ready to use!
