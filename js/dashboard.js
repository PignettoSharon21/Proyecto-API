function actualizarDashboard() {
const prestamosPendientes = prestamos.reduce((acc, p) => acc + p.cantidad, 0); 

    const deudaTotal = nodevuelto.reduce((acc, n) => acc + parseInt(n.cantidad), 0); 
    
    const totalPrestadas = prestamosPendientes + deudaTotal;
    
    const totalStock = herramientas.reduce((acc, h) => acc + h.stock, 0);

    document.getElementById("prestadasCount").textContent = totalPrestadas;
    document.getElementById("stockCount").textContent = totalStock;

    const vencidas = deudaTotal; 
    const alerta = document.getElementById("alertaPendientes");

    if (vencidas > 0) {
        alerta.innerHTML = `<strong>Importante:</strong> ${vencidas} herramienta${vencidas > 1 ? 's' : ''} no han sido devueltas.`;
        alerta.classList.remove("alerta-ok");
        alerta.classList.add("alerta-pendiente");
    } else {
        alerta.innerHTML = `<strong>Todo en orden:</strong> No hay herramientas pendientes de devolución.`;
        alerta.classList.remove("alerta-pendiente");
        alerta.classList.add("alerta-ok");
    }
}

