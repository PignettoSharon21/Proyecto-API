let prestamos = [];
let devoluciones = [];
let nodevuelto = [];
let herramientasSeleccionadasParaPrestamo = [];

const formularioPrestamo = document.getElementById("formPrestamo");
const listaHerramientasPrestamo = document.getElementById("listaHerramientasPrestamo");
const agregarHerramientaBtn = document.getElementById("agregarHerramientaBtn");
const inputHerramienta = document.getElementById("herramientaInput");
const inputCantidad = document.getElementById("cantidad");

function renderizarHerramientasSeleccionadas() {
    if (!listaHerramientasPrestamo) return;

    if (!herramientasSeleccionadasParaPrestamo.length) {
        listaHerramientasPrestamo.innerHTML = `<p class="lista-herramientas-prestamo__empty">Agrega 1 o más herramientas para este préstamo.</p>`;
        return;
    }

    const filas = herramientasSeleccionadasParaPrestamo
        .map((h, index) => `
            <tr>
                <td>${h.nombre}</td>
                <td>${h.cantidad}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm btn-quitar-herramienta" data-index="${index}">
                        Quitar
                    </button>
                </td>
            </tr>
        `).join("");

    listaHerramientasPrestamo.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm table-bordered">
                <thead>
                    <tr>
                        <th>Herramienta</th>
                        <th>Cantidad</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>
        </div>
    `;
}

function agregarHerramientaALista() {
    if (!inputHerramienta || !inputCantidad) return;

    const idHerramienta = parseInt(inputHerramienta.value, 10);
    const cantidad = parseInt(inputCantidad.value, 10);

    if (isNaN(idHerramienta) || idHerramienta <= 0) {
        alert("Ingresa un ID de herramienta válido.");
        return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Ingresa una cantidad válida.");
        return;
    }

    const herramientaEnCatalogo = herramientas.find(
        h => h.id_herramienta === idHerramienta
    );

    if (!herramientaEnCatalogo) {
        alert("No se encontró una herramienta con ese ID.");
        return;
    }

    const existente = herramientasSeleccionadasParaPrestamo.find(item => item.id === herramientaEnCatalogo.id_herramienta);
    const cantidadDeseada = (existente ? existente.cantidad : 0) + cantidad;

    if (cantidadDeseada > herramientaEnCatalogo.stock) {
        alert(`No hay suficiente stock de ${herramientaEnCatalogo.nombre}. Disponible: ${herramientaEnCatalogo.stock}.`);
        return;
    }

    if (existente) {
        existente.cantidad = cantidadDeseada;
    } else {
        herramientasSeleccionadasParaPrestamo.push({
            id: herramientaEnCatalogo.id_herramienta,
            nombre: herramientaEnCatalogo.nombre,
            cantidad
        });
    }

    inputHerramienta.value = "";
    inputCantidad.value = 1;
    renderizarHerramientasSeleccionadas();
}

if (agregarHerramientaBtn) {
    agregarHerramientaBtn.addEventListener("click", agregarHerramientaALista);
}

if (listaHerramientasPrestamo) {
    listaHerramientasPrestamo.addEventListener("click", e => {
        if (!e.target.classList.contains("btn-quitar-herramienta")) return;
        const index = parseInt(e.target.dataset.index, 10);
        if (isNaN(index)) return;
        herramientasSeleccionadasParaPrestamo.splice(index, 1);
        renderizarHerramientasSeleccionadas();
    });

    renderizarHerramientasSeleccionadas();
}

function obtenerCursoFormateado() {
    const curso = document.getElementById("curso")?.value || "";
    const division = document.getElementById("division")?.value || "";
    return division ? `${curso} ${division}`.trim() : curso;
}

async function registrarPrestamosMultiples(datosGenerales) {
    for (const item of herramientasSeleccionadasParaPrestamo) {
        const payload = {
            ...datosGenerales,
            id_herramienta: item.id,
            cantidad: item.cantidad
        };

        const respuesta = await fetch('api/registrar_prestamos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!respuesta.ok) {
            throw new Error(`Error al registrar ${item.nombre}: ${respuesta.statusText}`);
        }

        const resultado = await respuesta.json();
        if (!resultado.exito) {
            throw new Error(resultado.mensaje || `No se pudo registrar ${item.nombre}.`);
        }
    }
}

if (formularioPrestamo) {
    formularioPrestamo.addEventListener("submit", async e => {
        e.preventDefault();

        if (!herramientasSeleccionadasParaPrestamo.length) {
            alert("Agrega al menos una herramienta antes de registrar el préstamo.");
            return;
        }

        const profesor = document.getElementById("profesor")?.value.trim();
        const curso = document.getElementById("curso")?.value;
        const division = document.getElementById("division")?.value;
        const turno = document.getElementById("turno")?.value;

        if (!profesor || !curso || !division || !turno) {
            alert("Completa los datos del profesor, curso, división y turno.");
            return;
        }

        const horaRetiro = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

        try {
            await registrarPrestamosMultiples({
                profesor,
                curso: obtenerCursoFormateado(),
                turno,
                horaRetiro
            });

            alert(`Préstamo registrado para ${herramientasSeleccionadasParaPrestamo.length} herramienta(s).`);
            formularioPrestamo.reset();
            herramientasSeleccionadasParaPrestamo = [];
            renderizarHerramientasSeleccionadas();
            await cargarHerramientasDesdeBD();
            await cargarPrestamosDesdeBD();
        } catch (error) {
            console.error(error);
            alert(`Ocurrió un error al registrar el préstamo: ${error.message}`);
        }
    });
}


async function cargarPrestamosDesdeBD() {
    try {
        const resp = await fetch('api/obtener_prestamos_data.php');
        if (!resp.ok) throw new Error('Error al cargar préstamos/devoluciones. Estado: ' + resp.status);

        const data = await resp.json();

        prestamos = data.prestamos || [];
        devoluciones = data.devoluciones || [];
        nodevuelto = data.nodevuelto || []; 

        actualizarTablaPrestamos();
        actualizarDashboard();
        generarHistorialDevoluciones(); 
        mostrarNoDevueltas();
    } catch (error) {
        console.error("Fallo al obtener datos de préstamos:", error);
    }
}



function actualizarTablaPrestamos() {
    const tabla = document.getElementById("tablaPrestamos");

    if (!prestamos || prestamos.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="12" style="text-align:center; padding:12px;">
                    <b>No hay préstamos registrados.</b>
                </td>
            </tr>
        `;
        return;
    }

    let tablaHTML = `
        <thead>
            <tr>
                <th>ID Préstamo</th>
                <th>ID Her.</th>
                <th>Nombre</th>
                <th>Cantidad por Devolver</th>
                <th>Profesor</th>
                <th>Curso</th>
                <th>Turno</th>
                <th>Fecha de Retiro</th>
                <th>H de Retiro</th>
                <th>H Lím. Dev.</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
    `;

    let totalPrestadas = 0;

    prestamos.slice().reverse().forEach(p => {
        const estado = p.estado_p ? p.estado_p : 'Desconocido';

        const estadoClase =
            estado === 'Vencido' || estado === 'Parcial Tarde' ? 'alerta-vencido' :
                estado === 'Transferido a No Devuelto' ? 'alerta-nodevuelto-cerrado' : '';

        let accionButton;
        if (estado === 'Devuelto' || estado === 'Devuelto Tarde' || p.cantidad <= 0) {
            accionButton = '<button disabled class="btn btn-secondary btn-sm" style="opacity: 0.6;">Cerrado</button>';
        } else if (estado === 'Transferido a No Devuelto') {
            accionButton = `<button onclick="prepararModalDeuda(${p.id_prestamo})" class="btn btn-danger btn-sm">Gestionar No Dev.</button>`;
        } else {
            accionButton = `<button class="btn btn-primary btn-sm" onclick="abrirModalPrestamo(${p.id_prestamo})">Modificar</button>`;
        }

        tablaHTML += `
            <tr class="${estadoClase}">
                <td>${p.id_prestamo}</td>
                <td>${p.id_herramienta}</td>
                <td>${p.nombre}</td>
                <td>${p.cantidad}</td>
                <td>${p.profesor}</td>
                <td>${p.curso}</td>
                <td>${p.turno}</td>
                <td>${p.fecha_p}</td>
                <td>${p.horaRetiro}</td>
                <td>${p.horaLimite}</td>
                <td>${estado}</td>
                <td>${accionButton}</td>
            </tr>
        `;

        if (estado === "Pendiente" || estado === "Vencido" || estado === "Parcial" || estado === "Parcial Tarde") {
            totalPrestadas += p.cantidad;
        }
    });

    tablaHTML += `</tbody>`;

    tabla.innerHTML = tablaHTML;
}

function abrirModalPrestamo(id) {
    const p = prestamos.find(pr => pr.id_prestamo === id);
    if (!p) return;

    document.getElementById("modId").value = p.id_prestamo;
    document.getElementById("modCantidadTotal").innerText = p.cantidad;
    document.getElementById("modCantidadDevuelta").value = 0;
    document.getElementById("modEstado").value = p.estado_p;

    document.getElementById("modalPrestamo").style.display = "flex";
}

function cerrarModalPrestamo() {
    document.getElementById("modalPrestamo").style.display = "none";
}

function abrirModalResolverDeuda(id_nodevuelto) {
    document.getElementById("modalResolverDeuda").style.display = "flex";
}

function cerrarModalResolverDeuda() {
    document.getElementById("modalResolverDeuda").style.display = "none";
    document.getElementById("formResolverDeuda").reset();
}

document.getElementById("formModificarPrestamo").addEventListener("submit", async e => {
    e.preventDefault();

    const id = parseInt(document.getElementById("modId").value);
    const devuelto = parseInt(document.getElementById("modCantidadDevuelta").value);
    const estado_p = document.getElementById("modEstado").value;

    const p = prestamos.find(pr => pr.id_prestamo === id);
    if (!p) {
        alert("Error: no se encontró el préstamo seleccionado.");
        return;
    }

    if (isNaN(devuelto) || devuelto < 0) {
        alert("Ingrese una cantidad válida.");
        return;
    }

    if (devuelto > p.cantidad) {
        alert(`No puede devolver más de lo que falta por devolver. Cantidad restante: ${p.cantidad}.`);
        return;
    }

    const datosModificacion = {
        id_prestamo: id,
        cantidad_devuelta: devuelto,
        nuevo_estado: estado_p,
        id_herramienta: p.id_herramienta,
        profesor: p.profesor
    };

    try {
        const respuesta = await fetch('api/modificar_prestamo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosModificacion)
        });

        if (!respuesta.ok) {
            throw new Error(`Error en la respuesta del servidor: ${respuesta.status} ${respuesta.statusText}`);
        }

        const resultado = await respuesta.json();

        if (resultado.exito) {
            alert("✅ ¡Préstamo Modificado correctamente y base de datos actualizada!");

            await cargarHerramientasDesdeBD();
            await cargarPrestamosDesdeBD();

            cerrarModalPrestamo();
        } else {
            alert("❌ Error al modificar el préstamo: " + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error de conexión o servidor:', error);
        alert('🚨 No se pudo conectar con el servidor para guardar los cambios o hubo un error interno. Revisa la consola.');
    }
});


// DEVOLUCIONES
function generarHistorialDevoluciones(listaDevoluciones = devoluciones) {
    const contenedor = document.getElementById("contenidoDevoluciones");

    if (listaDevoluciones.length === 0) {
        contenedor.innerHTML = "<p><b>No hay herramientas devueltas registradas que coincidan con la búsqueda.</b></p>";
        return;
    }

    let tabla = `
        <div class="table-responsive">
            <table class="table table-striped table-hover table-bordered">
                <tr>
                    <th>ID Devolución</th>
                    <th>ID Préstamo</th>
                    <th>Profesor</th>
                    <th>ID Herramienta</th>
                    <th>Herramienta</th>
                    <th>Cantidad Devuelta</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                </tr>`;

    listaDevoluciones.forEach(d => {
        const h = herramientas.find(hh => hh.id_herramienta === d.id_herramienta);
        tabla += `
            <tr>
                <td>${d.id_devolucion}</td>
                <td>${d.id_prestamo}</td>
                <td>${d.profesor}</td>
                <td>${d.id_herramienta}</td>
                <td>${h ? h.nombre : "Desconocida"}</td>
                <td>${d.cantidad}</td>
                <td>${d.fecha}</td>
                <td>${d.hora}</td>
            </tr>`;
    });

    tabla += "</table></div>";
    contenedor.innerHTML = tabla;
}


function filtrarDevoluciones() {
    const textoBusqueda = document.getElementById("filtroTextoDevoluciones").value.toLowerCase().trim();
    const fechaBusqueda = document.getElementById("filtroFechaDevolucion").value; 

    let resultados = devoluciones;

    if (textoBusqueda) {
        resultados = resultados.filter(d => {
            const h = herramientas.find(hh => hh.id_herramienta === d.id_herramienta);
            const nombreHerramienta = h ? h.nombre.toLowerCase() : '';

            return d.profesor.toLowerCase().includes(textoBusqueda) ||
                nombreHerramienta.includes(textoBusqueda);
        });
    }

    if (fechaBusqueda) {
        resultados = resultados.filter(d => d.fecha === fechaBusqueda);
    }

    generarHistorialDevoluciones(resultados);
}


function mostrarNoDevueltas() {
    const contenedor = document.getElementById("contenidoNoDevuelto");

    if (!nodevuelto || nodevuelto.length === 0) {
        contenedor.innerHTML = "<p><b>No hay herramientas marcadas como No Devueltas.</b></p>";
        return;
    }

    let tabla = `
        <div class="table-responsive">
            <table class="table table-striped table-hover table-bordered">
                <thead>
                    <tr>
                        <th>ID No Dev.</th>
                        <th>ID Préstamo</th>
                        <th>Herramienta</th>
                        <th>Profesor</th>
                        <th>Cantidad Pendiente</th>
                        <th>Fecha Registro No Dev.</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>`;

    nodevuelto.forEach(n => {
        tabla += `
            <tr>
                <td>${n.id_nodevuelto}</td>
                <td>${n.id_prestamo}</td>
                <td>${n.nombre}</td> 
                <td>${n.profesor}</td>
                <td>${n.cantidad}</td>
                <td>${n.fecha_registro}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="prepararModalDeuda(${n.id_nodevuelto})">Gestionar</button>
                </td>
            </tr>`;
    });

    tabla += "</tbody></table></div>";
    contenedor.innerHTML = tabla;
}

document.getElementById("formResolverDeuda").addEventListener("submit", async e => {
    e.preventDefault();

    const id_nodevuelto = parseInt(document.getElementById("deudaIdNodevuelto").value);
    const id_prestamo = parseInt(document.getElementById("deudaIdPrestamoHidden").value);
    const id_herramienta = parseInt(document.getElementById("deudaIdHerramientaHidden").value);
    const cantidad_recuperada = parseInt(document.getElementById("deudaCantidadRecuperada").value);
    const cantidad_pendiente = parseInt(document.getElementById("deudaCantidadPendiente").innerText);

    if (isNaN(cantidad_recuperada) || cantidad_recuperada <= 0 || cantidad_recuperada > cantidad_pendiente) {
        alert(`Cantidad inválida. Debe ser entre 1 y ${cantidad_pendiente}.`);
        return;
    }

    const exito = await ejecutarResolucionDeudaAPI(id_nodevuelto, id_prestamo, id_herramienta, cantidad_recuperada);

    if (exito) {
        cerrarModalResolverDeuda();
    }
});

function obtenerContextoDeudaModal() {
    const id_nodevuelto = parseInt(document.getElementById("deudaIdNodevuelto").value);
    const id_prestamo = parseInt(document.getElementById("deudaIdPrestamoHidden").value);
    const id_herramienta = parseInt(document.getElementById("deudaIdHerramientaHidden").value);
    const cantidad_pendiente = parseInt(document.getElementById("deudaCantidadPendiente").innerText);

    if ([id_nodevuelto, id_prestamo, id_herramienta, cantidad_pendiente].some(v => isNaN(v))) {
        alert("No se pudieron obtener los datos de la deuda. Cierra el modal e inténtalo nuevamente.");
        return null;
    }

    return { id_nodevuelto, id_prestamo, id_herramienta, cantidad_pendiente };
}

async function resolverDeudaRapida({ cantidadOverride = null, mensajeConfirmacion = "¿Confirmar operación?", marcarComoPerdida = false } = {}) {
    const contexto = obtenerContextoDeudaModal();
    if (!contexto) return;

    const cantidadARegistrar = cantidadOverride !== null ? cantidadOverride : contexto.cantidad_pendiente;

    if (cantidadARegistrar > contexto.cantidad_pendiente) {
        alert("La cantidad supera la deuda pendiente.");
        return;
    }

    if (!confirm(mensajeConfirmacion)) return;

    const exito = await ejecutarResolucionDeudaAPI(
        contexto.id_nodevuelto,
        contexto.id_prestamo,
        contexto.id_herramienta,
        cantidadARegistrar,
        marcarComoPerdida
    );

    if (!exito) return;

    if (marcarComoPerdida) {
        await registrarHerramientaComoDesaparecida(contexto.id_herramienta, contexto.cantidad_pendiente);
    }

    cerrarModalResolverDeuda();
}

const btnRegistrarPerdida = document.getElementById("btnRegistrarPerdida");
if (btnRegistrarPerdida) {
    btnRegistrarPerdida.addEventListener("click", () => {
        resolverDeudaRapida({
            cantidadOverride: 0,
            mensajeConfirmacion: "¿Confirmas que la herramienta se da por desaparecida o rota?",
            marcarComoPerdida: true
        });
    });
}

const btnDevolverCompleto = document.getElementById("btnDevolverCompleto");
if (btnDevolverCompleto) {
    btnDevolverCompleto.addEventListener("click", () => {
        const contexto = obtenerContextoDeudaModal();
        if (!contexto) return;
        resolverDeudaRapida({
            cantidadOverride: contexto.cantidad_pendiente,
            mensajeConfirmacion: `Se registrará la devolución completa de ${contexto.cantidad_pendiente} unidad(es). ¿Deseas continuar?`
        });
    });
}

async function ejecutarResolucionDeudaAPI(id_nodevuelto, id_prestamo, id_herramienta, cantidad_recuperada, esPerdida = false) {
    const datosResolucion = {
        id_nodevuelto: id_nodevuelto,
        id_prestamo: id_prestamo,
        id_herramienta: id_herramienta,
        cantidad_recuperada: cantidad_recuperada
    };

    try {
        const respuesta = await fetch('api/resolver_deuda.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosResolucion)
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            if (!esPerdida) {
                alert(`✅ Deuda resuelta. Cantidad devuelta/recuperada: ${cantidad_recuperada}.`);
            }
            await cargarHerramientasDesdeBD();
            await cargarPrestamosDesdeBD();
            return true;
        } else {
            alert("❌ Error al resolver la deuda: " + resultado.mensaje);
            return false;
        }
    } catch (error) {
        console.error('Error de conexión o servidor:', error);
        alert('🚨 No se pudo conectar con el servidor para guardar los cambios.');
        return false;
    }
}

async function registrarHerramientaComoDesaparecida(id_herramienta, cantidadPerdida) {
    const herramienta = herramientas.find(h => h.id_herramienta === id_herramienta);
    if (!herramienta) {
        alert("No se encontró la herramienta para registrar la pérdida.");
        return;
    }

    const cantidadAfectadaActual = parseInt(herramienta.cantidadAfectada || 0, 10);
    const stockDisponible = parseInt(herramienta.stock || 0, 10);

    const payload = {
        id_herramienta: herramienta.id_herramienta,
        nombre: herramienta.nombre,
        categoria: herramienta.categoria,
        marca: herramienta.marca,
        modelo: herramienta.modelo,
        descripcion: herramienta.descripcion || '',
        stock: isNaN(stockDisponible) ? 0 : stockDisponible,
        estado: "Desaparecida",
        cantidadAfectada: cantidadAfectadaActual + cantidadPerdida,
        cantidadRota: 0,
        cantidadDesaparecida: cantidadPerdida
    };

    try {
        const resp = await fetch('api/modificar_herramienta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await resp.json();
        if (!resultado.exito) {
            alert("No se pudo registrar la herramienta como desaparecida: " + resultado.mensaje);
            return;
        }

        await cargarHerramientasDesdeBD();
        mostrarHerramientasRotas();
        alert("Herramienta marcada como desaparecida. Podrás generar el acta desde la sección correspondiente.");
    } catch (error) {
        console.error('Error registrando herramienta desaparecida:', error);
        alert("No se pudo registrar la herramienta como desaparecida. Revisa la consola.");
    }
}

function prepararModalDeuda(id_nodevuelto) {
    const deuda = nodevuelto.find(n => n.id_nodevuelto === id_nodevuelto);
    if (!deuda) return alert("Error: No se encontró el registro de deuda.");

    document.getElementById("deudaIdPrestamo").innerText = deuda.id_prestamo;
    document.getElementById("deudaNombreHerramienta").innerText = deuda.nombre;
    document.getElementById("deudaProfesor").innerText = deuda.profesor;
    document.getElementById("deudaCantidadPendiente").innerText = deuda.cantidad;

    document.getElementById("deudaIdNodevuelto").value = deuda.id_nodevuelto;
    document.getElementById("deudaIdPrestamoHidden").value = deuda.id_prestamo;
    document.getElementById("deudaIdHerramientaHidden").value = deuda.id_herramienta;

    document.getElementById("deudaCantidadRecuperada").max = deuda.cantidad;
    document.getElementById("deudaCantidadRecuperada").value = deuda.cantidad; 

    abrirModalResolverDeuda();
}

function inicializarListenersDevoluciones() {
    const inputBusqueda = document.getElementById('filtroTextoDevoluciones');
    const inputFecha = document.getElementById('filtroFechaDevolucion');

    if (inputBusqueda) {
        inputBusqueda.removeEventListener('keyup', filtrarDevoluciones);
        inputBusqueda.addEventListener('keyup', filtrarDevoluciones);
    }

    if (inputFecha) {
        inputFecha.removeEventListener('change', filtrarDevoluciones);
        inputFecha.addEventListener('change', filtrarDevoluciones);
    }
}