<?php
// Set Telegram webhook for button callbacks
$botToken = '5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00';
$webhookUrl = 'https://YOUR_DOMAIN.com/zelle/telegram-webhook';

// For local testing, use ngrok or similar
// For now, we'll use getUpdates polling instead

echo "Webhook setup:\n";
echo "Bot Token: {$botToken}\n";
echo "Webhook URL: {$webhookUrl}\n\n";

echo "For LOCAL testing: Buttons will be checked via polling (already implemented in React)\n";
echo "For CPANEL: Set webhook URL to: https://yourdomain.com/zelle/telegram-webhook\n\n";

echo "To set webhook on cPanel:\n";
echo "Run: curl -X POST https://api.telegram.org/bot{$botToken}/setWebhook -d 'url={$webhookUrl}'\n";
?>
