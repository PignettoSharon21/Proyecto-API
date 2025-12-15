<?php
header('Content-Type: application/json');
require_once 'session_utils.php';

$usuario = get_usuario_actual();

if (!$usuario) {
    http_response_code(401);
    echo json_encode(['autenticado' => false]);
    exit;
}

echo json_encode([
    'autenticado' => true,
    'usuario' => $usuario
]);

