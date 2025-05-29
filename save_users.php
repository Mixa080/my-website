<?php
header('Content-Type: application/json');

// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['users'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data format']);
    exit();
}

// Save to users.json
$result = file_put_contents('../data/users.json', json_encode($data, JSON_PRETTY_PRINT));

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save data']);
    exit();
}

echo json_encode(['success' => true]);
?> 