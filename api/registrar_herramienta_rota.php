<?php
require_once 'session_utils.php';
require_role(['admin']);
header('Content-Type: application/json');
require 'conexion.php'; 
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_herramienta'], $data['cantidad_afectada'])) {
    http_response_code(400);
    echo json_encode(['exito' => false, 'mensaje' => 'Datos incompletos para registrar la herramienta rota.']);
    exit;
}

$id_herramienta = $data['id_herramienta'];
$cantidad_afectada = (int)$data['cantidad_afectada'];

if ($cantidad_afectada <= 0) {
    http_response_code(400);
    echo json_encode(['exito' => false, 'mensaje' => 'La cantidad afectada debe ser positiva.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $sql_insert = "INSERT INTO herramientasrotas (id_herramienta) VALUES (:id_herramienta)";
    $stmt_insert = $pdo->prepare($sql_insert);
    $stmt_insert->execute([':id_herramienta' => $id_herramienta]);
    
    $sql_update = "UPDATE herramientas 
                   SET stock = stock - :cantidad_afectada, 
                       estado = 'No-Funciona' 
                   WHERE id_herramienta = :id_herramienta AND stock >= :cantidad_afectada";

    $stmt_update = $pdo->prepare($sql_update);
    $stmt_update->execute([
        ':cantidad_afectada' => $cantidad_afectada,
        ':id_herramienta' => $id_herramienta
    ]);

    if ($stmt_update->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(409); // Conflict
        echo json_encode(['exito' => false, 'mensaje' => 'Error: Stock insuficiente o ID de herramienta no existe.']);
        exit;
    }
    
    $pdo->commit();

    echo json_encode([
        'exito' => true, 
        'mensaje' => "Herramienta ID $id_herramienta registrada como rota y stock actualizado."
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Error de transacción al registrar herramienta rota: " . $e->getMessage());
    echo json_encode(['exito' => false, 'mensaje' => 'Error de base de datos: ' . $e->getMessage()]);
}

?>