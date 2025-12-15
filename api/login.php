<?php
header('Content-Type: application/json');
require_once 'session_utils.php';

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !isset($body['usuario'], $body['password'])) {
    http_response_code(400);
    echo json_encode(['exito' => false, 'mensaje' => 'Usuario y contraseña son requeridos.']);
    exit;
}

$usuario = strtolower(trim($body['usuario']));
$password = $body['password'];

$usuariosDisponibles = [
    'admin' => [
        'password' => 'admin123',
        'rol' => 'admin',
        'nombre' => 'Administrador'
    ],
    'registrador' => [
        'password' => 'registrador123',
        'rol' => 'registrador',
        'nombre' => 'Registrador'
    ]
];

if (!isset($usuariosDisponibles[$usuario]) || $usuariosDisponibles[$usuario]['password'] !== $password) {
    http_response_code(401);
    echo json_encode(['exito' => false, 'mensaje' => 'Credenciales inválidas.']);
    exit;
}

$_SESSION['usuario'] = [
    'usuario' => $usuario,
    'rol' => $usuariosDisponibles[$usuario]['rol'],
    'nombre' => $usuariosDisponibles[$usuario]['nombre']
];

echo json_encode([
    'exito' => true,
    'usuario' => $_SESSION['usuario']
]);

