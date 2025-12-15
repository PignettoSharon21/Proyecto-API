<?php
require_once 'session_utils.php';
require_login();
header('Content-Type: application/json');
require 'conexion.php'; 

try {
    
    $sql = "
        SELECT 
            h.id_herramienta, 
            h.nombre, 
            h.categoria, 
            h.marca, 
            h.modelo, 
            h.descripcion,
            h.stock,
            h.cantidadAfectada,
            h.img,
            h.estado 
        FROM 
            herramientas h
        LEFT JOIN 
            herramientasrotas hr ON h.id_herramienta = hr.id_herramienta
        ORDER BY 
            h.id_herramienta;
    ";

    $stmt = $pdo->query($sql);
    $herramientas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($herramientas);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error al obtener herramientas: " . $e->getMessage());
    echo json_encode(["error" => "Error al obtener herramientas: " . $e->getMessage()]);
}
?>