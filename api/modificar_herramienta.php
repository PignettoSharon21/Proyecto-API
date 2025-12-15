<?php
require_once 'session_utils.php';
require_role(['admin']);
header('Content-Type: application/json');
require 'conexion.php'; 

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_herramienta'], $data['nombre'], $data['stock'], $data['estado'], $data['cantidadAfectada'])) {
    http_response_code(400);
    echo json_encode(['exito' => false, 'mensaje' => 'Datos incompletos para modificar la herramienta.']);
    exit;
}

$id = $data['id_herramienta'];
$nombre = $data['nombre'];
$categoria = $data['categoria'];
$marca = $data['marca'];
$modelo = $data['modelo'];
$descripcion = $data['descripcion'];
$stock_disponible = $data['stock']; 
$estado = $data['estado'];
$cantidadAfectada = (int)$data['cantidadAfectada'];

try {
    $pdo->beginTransaction();

    $sql_update_main = "UPDATE herramientas SET 
                nombre = ?, 
                categoria = ?, 
                marca = ?, 
                modelo = ?, 
                descripcion = ?, 
                stock = ?, 
                estado = ?,
                cantidadAfectada = ?
            WHERE id_herramienta = ?";
    
    $stmt_update_main = $pdo->prepare($sql_update_main);
    $stmt_update_main->execute([
        $nombre, 
        $categoria, 
        $marca, 
        $modelo, 
        $descripcion, 
        $stock_disponible, 
        $estado,
        $cantidadAfectada,
        $id
    ]);

    $is_afectada = ($estado === "No-Funciona" || $estado === "Desaparecida");

    if ($is_afectada) {
        $sql_check_rotas = "SELECT COUNT(*) FROM herramientasrotas WHERE id_herramienta = ?";
        $stmt_check = $pdo->prepare($sql_check_rotas);
        $stmt_check->execute([$id]);
        
        if ($stmt_check->fetchColumn() == 0) {
            $sql_insert_rotas = "INSERT INTO herramientasrotas (id_hrotas, id_herramienta) 
                                 VALUES (NULL, ?)";
            $stmt_insert_rotas = $pdo->prepare($sql_insert_rotas);
            $stmt_insert_rotas->execute([$id]);
        }
        
    } else {
        $sql_delete_rotas = "DELETE FROM herramientasrotas WHERE id_herramienta = ?";
        $stmt_delete_rotas = $pdo->prepare($sql_delete_rotas);
        $stmt_delete_rotas->execute([$id]);
    }
    
    $pdo->commit();

    echo json_encode(['exito' => true, 'mensaje' => 'Herramienta modificada y estado sincronizado correctamente.']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Error al modificar herramienta: " . $e->getMessage());
    echo json_encode(['exito' => false, 'mensaje' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>