<?php
require_once 'session_utils.php';
require_login();
header('Content-Type: application/json');
require 'conexion.php'; 

date_default_timezone_set('America/Argentina/Buenos_Aires');

try {
    $pdo->beginTransaction();

    $sql_vencidos = "
        SELECT id_prestamo, cantidad, id_herramienta, profesor 
        FROM prestamos 
        WHERE estado_p = 'Pendiente' 
        AND fecha_p = CURRENT_DATE() 
        AND horaLimite < CURRENT_TIME()";

    $stmt_vencidos = $pdo->query($sql_vencidos);
    $vencidos = $stmt_vencidos->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($vencidos)) {
        $fecha_registro = date('Y-m-d');
        $hora_registro = date('H:i:s');

        foreach ($vencidos as $v) {
            $sql_insert_nodev = "INSERT INTO nodevuelto (id_prestamo, id_herramienta, profesor, cantidad, fecha_registro) 
                                 VALUES (?, ?, ?, ?, ?)";
            $stmt_insert_nodev = $pdo->prepare($sql_insert_nodev);
            $stmt_insert_nodev->execute([$v['id_prestamo'], $v['id_herramienta'], $v['profesor'], $v['cantidad'], $fecha_registro]);

            $sql_update_prestamo = "UPDATE prestamos SET estado_p = 'Vencido' WHERE id_prestamo = ?";
            $stmt_update_prestamo = $pdo->prepare($sql_update_prestamo);
            $stmt_update_prestamo->execute([$v['id_prestamo']]);
        }
    }
    
    $pdo->commit();

    
    $sqlPrestamos = "
        SELECT 
            p.*, 
            h.nombre,
            h.stock AS stock_actual_herramienta 
        FROM prestamos p 
        JOIN herramientas h ON p.id_herramienta = h.id_herramienta
        ORDER BY p.id_prestamo DESC"; 

    $stmtPrestamos = $pdo->query($sqlPrestamos);
    $prestamos = $stmtPrestamos->fetchAll(PDO::FETCH_ASSOC);

    $sqlDevoluciones = "
        SELECT 
            d.id_devolucion, 
            d.id_prestamo, 
            d.cantidad_devuelta AS cantidad, 
            d.hora, 
            d.fecha, 
            p.profesor, 
            p.id_herramienta
        FROM devoluciones d
        JOIN prestamos p ON d.id_prestamo = p.id_prestamo
        ORDER BY d.id_devolucion DESC"; 

    $stmtDevoluciones = $pdo->query($sqlDevoluciones);
    $devoluciones = $stmtDevoluciones->fetchAll(PDO::FETCH_ASSOC);

    $sqlNoDevuelto = "
        SELECT 
            nd.*, 
            h.nombre 
        FROM nodevuelto nd 
        JOIN herramientas h ON nd.id_herramienta = h.id_herramienta
        ORDER BY nd.id_nodevuelto DESC";

    $stmtNoDevuelto = $pdo->query($sqlNoDevuelto);
    $nodevuelto = $stmtNoDevuelto->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'prestamos' => $prestamos,
        'devoluciones' => $devoluciones,
        'nodevuelto' => $nodevuelto
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "Error de base de datos: " . $e->getMessage()]);
}

?>