<?php
$host = "db.tecnica4berazategui.edu.ar";  
$usuario = "jmyedro_panol_udb"; 
$contrasena = 'tshEr[j!N?-CS7dQ3([bm$T/T3ABe7S-&93eGDnSYZ#L#N3o'; 
$base_de_datos = "jmyedro_panol"; 

// === VALIDACIÓN ===
if (!$host || !$usuario || !$contrasena || !$base_de_datos) {
    http_response_code(500);
    echo json_encode(["error" => "Error: Faltan variables de entorno de la Base de Datos."]);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$base_de_datos;charset=utf8", $usuario, $contrasena);
    // Establecer el modo de error de PDO a excepción
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Si la conexión falla, muestra un error y detén el script
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión a la base de datos: " . $e->getMessage()]);
    exit();
}
?>