<?php
require_once 'session_utils.php';
require_login();
header('Content-Type: application/json');
require 'conexion.php'; 

$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!isset($data['id_herramienta'], $data['cantidad'], $data['profesor'], $data['curso'], $data['turno'], $data['horaRetiro'])) {
    echo json_encode(["exito" => false, "mensaje" => "Faltan datos requeridos (ID Herramienta, Cantidad, Profesor, Curso, Turno, Hora Retiro)."]);
    exit;
}

$id_herramienta = $data['id_herramienta'];
$cantidad = $data['cantidad'];
$profesor = $data['profesor'];
$curso = $data['curso'];
$turno = $data['turno'];
$horaRetiro = $data['horaRetiro'];

$fecha_p = date('Y-m-d');
$horaLimite = null; 

switch ($turno) {
    case 'Mañana':
        $horaLimite = '11:30:00'; 
        break;
    case 'Tarde':
        $horaLimite = '16:30:00'; 
        break;
    default:
        $horaLimite = '18:00:00';
}

$estado_p = "Pendiente";

try {
    $pdo->beginTransaction();

    $sqlInsert = "INSERT INTO prestamos (id_herramienta, profesor, curso, turno, cantidad, fecha_p, horaRetiro, horaLimite, estado_p) 
                  VALUES (:id_herramienta, :profesor, :curso, :turno, :cantidad, :fecha_p, :horaRetiro, :horaLimite, :estado_p)";
    
    $stmt = $pdo->prepare($sqlInsert);
    $stmt->execute([
        'id_herramienta' => $id_herramienta,
        'profesor' => $profesor,
        'curso' => $curso,
        'turno' => $turno,
        'cantidad' => $cantidad,
        'fecha_p' => $fecha_p,
        'horaRetiro' => $horaRetiro,
        'horaLimite' => $horaLimite, 
        'estado_p' => $estado_p
    ]);
    
    $sqlUpdate = "UPDATE herramientas SET stock = stock - :cantidad WHERE id_herramienta = :id_herramienta";
    
    $stmt = $pdo->prepare($sqlUpdate);
    $stmt->execute([
        'cantidad' => $cantidad,
        'id_herramienta' => $id_herramienta
    ]);

    $pdo->commit();

    echo json_encode(["exito" => true, "mensaje" => "Préstamo registrado correctamente."]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error al registrar préstamo: " . $e->getMessage());
    echo json_encode(["exito" => false, "mensaje" => "Fallo en la base de datos al registrar: " . $e->getMessage()]);
}
?>