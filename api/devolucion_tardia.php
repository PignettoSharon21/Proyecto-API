<?php
require_once 'session_utils.php';
require_login();
header('Content-Type: application/json');
require 'conexion.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_prestamo'], $data['cantidad_devuelta'], $data['id_nodevuelto'], $data['id_herramienta']) || $data['cantidad_devuelta'] <= 0) {
    http_response_code(400);
    echo json_encode(['exito' => false, 'mensaje' => 'Datos incompletos para la devolución tardía.']);
    exit;
}

$id_prestamo = $data['id_prestamo'];
$devuelto = (int)$data['cantidad_devuelta'];
$id_nodevuelto = $data['id_nodevuelto'];
$id_herramienta = $data['id_herramienta'];

$fecha = date('Y-m-d');
$hora = date('H:i:s');

try {
    $pdo->beginTransaction();

    $sql_devolucion = "INSERT INTO devoluciones (id_prestamo, cantidad_devuelta, hora, fecha) 
                       VALUES (?, ?, ?, ?)";
    $stmt_devolucion = $pdo->prepare($sql_devolucion);
    $stmt_devolucion->execute([$id_prestamo, $devuelto, $hora, $fecha]);
    
    $sql_delete_nodevuelto = "DELETE FROM nodevuelto WHERE id_nodevuelto = ?";
    $stmt_delete_nodevuelto = $pdo->prepare($sql_delete_nodevuelto);
    $stmt_delete_nodevuelto->execute([$id_nodevuelto]);

    $sql_stock = "UPDATE herramientas SET stock = stock + ? WHERE id_herramienta = ?";
    $stmt_stock = $pdo->prepare($sql_stock);
    $stmt_stock->execute([$devuelto, $id_herramienta]);
    
    $sql_prestamo = "UPDATE prestamos SET estado_p = 'Devuelto Tarde' WHERE id_prestamo = ?";
    $stmt_prestamo = $pdo->prepare($sql_prestamo);
    $stmt_prestamo->execute([$id_prestamo]);
    
    $pdo->commit();
    echo json_encode(['exito' => true, 'mensaje' => 'Devolución tardía registrada y deuda cerrada con éxito.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    error_log("Fallo al registrar devolución tardía: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['exito' => false, 'mensaje' => 'Error de base de datos al gestionar la devolución: ' . $e->getMessage()]);
}
?>