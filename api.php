<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    if ($json === false || $json === '') {
        http_response_code(400);
        echo json_encode(['error' => 'No data received']);
        exit;
    }
    $result = file_put_contents($dataFile, $json, LOCK_EX);
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write data']);
        exit;
    }
    echo json_encode(['success' => true, 'timestamp' => time()]);
} else {
    if (file_exists($dataFile)) {
        $contents = file_get_contents($dataFile);
        if ($contents === false || trim($contents) === '') {
            echo json_encode(null);
        } else {
            echo $contents;
        }
    } else {
        echo json_encode(null);
    }
}
