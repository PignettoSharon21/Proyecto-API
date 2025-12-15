let historialDevoluciones = [];

function showView(viewId) {
  if (viewId === 'inventario' && usuarioActual && usuarioActual.rol !== 'admin') {
    alert('Acceso restringido. Solo el administrador puede ingresar al inventario.');
    return;
  }

  if (viewId === 'roto' && usuarioActual && usuarioActual.rol !== 'admin') {
    alert('Acceso restringido. Solo el administrador puede ingresar al apartado de herramientas Rotas/Desaparecidas.');
    return;
  }

  // Oculta todas las secciones
  ["dashboard", "prestamos", "devoluciones", "inventario", "nodevuelto", "roto"].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  
  // Muestra la sección solicitada
  document.getElementById(viewId).classList.remove('hidden');
  
  // Manejo de estilos de navegación
  const links = document.querySelectorAll('nav a');
 links.forEach(link => link.classList.remove('active'));
    links.forEach(link => {
      if(link.getAttribute('onclick')?.includes(viewId)) link.classList.add('active');
 });
 
 // Lógica específica para cada vista
 if (viewId === "devoluciones") {
     generarHistorialDevoluciones();
    }

    if (viewId === "nodevuelto") {
       cargarPrestamosDesdeBD(); 
    }

    if (viewId === "roto") {
      mostrarHerramientasRotas();
    }
  
   // Añadir esta condición para cargar la tabla de Inventario
 if (viewId === "inventario") {
 actualizarTablaHerramientas(); 
}
}

window.addEventListener("load", () => {
  const iniciar = async () => {
    try {
      if (window.authReady) {
        await window.authReady;
      }
      await cargarHerramientasDesdeBD();
      await cargarPrestamosDesdeBD();
    } catch (error) {
      console.error('No se pudieron cargar los datos iniciales:', error);
    }
  };

  iniciar();
});
