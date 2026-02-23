<?php
// Router for PHP built-in server
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// If requesting /api.php or any /api/* endpoint, include api.php
if (strpos($uri, '/api') === 0 || $uri === '/api.php') {
    include __DIR__ . '/api.php';
    exit;
}

// For all other requests, serve the file if it exists
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false; // Let PHP serve the file
}

// Otherwise serve index.html
include __DIR__ . '/index.html';
?>
