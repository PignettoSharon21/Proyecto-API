<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function get_usuario_actual() {
    return $_SESSION['usuario'] ?? null;
}

function require_login() {
    if (!isset($_SESSION['usuario'])) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['exito' => false, 'mensaje' => 'Sesión no válida. Inicie sesión nuevamente.']);
        exit;
    }
}

function require_role(array $rolesPermitidos) {
    require_login();
    $usuario = get_usuario_actual();
    if (!$usuario || !in_array($usuario['rol'], $rolesPermitidos, true)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['exito' => false, 'mensaje' => 'No tiene permisos para realizar esta acción.']);
        exit;
    }
}

