<?php
// Direct Telegram test
echo "Testing Telegram...\n";
$result = file_get_contents("https://api.telegram.org/bot5787969678:AAHZEGiwGsdH8o_70cMIKqIJcNyDExKfQ00/sendMessage?chat_id=5514645660&text=TEST_FROM_PHP");
echo "Result: " . $result;
?>
