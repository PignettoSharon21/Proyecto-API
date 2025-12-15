let herramientasRotas = [];
let herramientas = [];

async function cargarHerramientasDesdeBD() {
  try {
    const respuesta = await fetch('api/obtener_herramientas.php');

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    herramientas = await respuesta.json();

    renderHerramientas(herramientas);
    actualizarTablaHerramientas(); 
    actualizarDashboard();

  } catch (error) {
    console.error("Fallo al obtener herramientas desde la BD:", error);
  }
}

const contenedor = document.getElementById("listaHerramientas");

function renderHerramientas(lista) {
  const fragment = document.createDocumentFragment();
  lista.forEach((h, index) => {
    const card = document.createElement("div");
    card.className = "tool-card";
    card.innerHTML = `
            <img src="imagenespract/${h.img}" alt="${h.nombre}">
            <h4>${h.nombre}</h4>
            <p><strong>Marca:</strong> ${h.marca || "N/A"}</p>
            <p>${h.categoria}</p>
            <button class="btn btn-primary btn-sm" onclick="verDetalles(${h.id_herramienta})">Ver más</button>
        `;
    fragment.appendChild(card);
  });
  contenedor.innerHTML = "";
  contenedor.appendChild(fragment);
}

document.getElementById("formAgregar").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const categoria = document.getElementById("categoria").value;
  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const stock = parseInt(document.getElementById("stock").value);
  const descripcion = document.getElementById("descripcion").value;
  const imagen = document.getElementById("imagen").value;

  let imgUrl = "placeholder.jpg"; 
  if (fileInput.files.length > 0) {
    imgUrl = URL.createObjectURL(fileInput.files[0]);
  }

  const nuevaHerramienta = {
    nombre: nombre,
    categoria: categoria,
    marca: marca,
    modelo: modelo,
    stock: stock,
    descripcion: descripcion,
    img: imagen,
    estado: "Normal" 
  };


  try {
    const respuesta = await fetch('api/registrar_herramienta.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaHerramienta)
    });

    const resultado = await respuesta.json();

    if (resultado.exito) {
      alert("Herramienta registrada correctamente.");
      document.getElementById("formRegistroHerramienta").reset();
      await cargarHerramientasDesdeBD(); 
      cerrarModalRegistro();
    } else {
      alert("Error al registrar: " + resultado.mensaje);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    alert('No se pudo conectar con el servidor.');
  }
});

function abrirModalEditar(id) {
  const h = herramientas.find(h => h.id_herramienta === id);
  if (!h) return;

  document.getElementById("editId").value = h.id_herramienta;
  document.getElementById("editNombre").value = h.nombre;
  document.getElementById('editMarca').value = h.marca;
  document.getElementById('editModelo').value = h.modelo;
  document.getElementById("editDescripcion").value = h.descripcion;
  document.getElementById("editStock").value = h.stock;
  document.getElementById("editEstadoHerramienta").value = h.estado || "Normal";


  const cantidadAfectadaGuardada = h.cantidadAfectada || 0;
  document.getElementById("editCantidadRota").value = cantidadAfectadaGuardada;

  const selectCat = document.getElementById("editCategoria");
  for (let i = 0; i < selectCat.options.length; i++) {
    if (selectCat.options[i].value === h.categoria) {
      selectCat.selectedIndex = i;
      break;
    }
  }

  document.getElementById("modalEditar").style.display = "flex";
  actualizarColorModal(); 
}

function cerrarModalEditar() {
  document.getElementById("modalEditar").style.display = "none";
}


function actualizarTablaHerramientas() {
  const tbody = document.getElementById("herramientasTableBody");
  tbody.innerHTML = "";

  herramientas.forEach(h => {
    const estadoHerramienta = h.estado ? h.estado : "Normal";
    let estadoClase = "";

    if (estadoHerramienta === "Desaparecida") {
      estadoClase = "table-danger";
    } else if (estadoHerramienta === "No-Funciona") {
      estadoClase = "table-warning";
    }

    let descripcionMostrar = h.descripcion || "";
    const indiceActa = descripcionMostrar.indexOf("Acta (");
    if (indiceActa !== -1) {
      descripcionMostrar = descripcionMostrar.substring(0, indiceActa).trim();
    }

    const fila = `
      <tr class="${estadoClase}"> 
        <td>${h.id_herramienta}</td>
        <td>${h.nombre}</td>
        <td>${h.categoria}</td>
        <td>${h.marca}</td>
        <td>${h.modelo}</td>
        <td>${descripcionMostrar}</td>
        <td>${h.stock}</td>
        <td>${h.cantidadAfectada || 0}</td>
        <td>${estadoHerramienta}</td>
        <td><button class="btn btn-warning btn-sm" onclick="abrirModalEditar(${h.id_herramienta})">Modificar</button></td>
      </tr>`;
    tbody.innerHTML += fila;
  });
}

const modalEditar = document.getElementById("modalEditar");
const botonModificar = document.querySelector("#formEditar button[type='submit']");
const selectEstado = document.getElementById("editEstadoHerramienta");

function actualizarColorModal() {
  const grupoCantidad = document.getElementById("grupoCantidadRota");
  const labelCantidad = document.getElementById("labelCantidadRota");

  if (selectEstado.value === "No-Funciona" || selectEstado.value === "Desaparecida") {
    modalEditar.style.background = "rgba(255, 0, 0, 0.15)";
    botonModificar.style.background = "darkred";
    grupoCantidad.classList.remove("hidden");
    labelCantidad.textContent =
      selectEstado.value === "Desaparecida"
        ? "Cantidad desaparecida:"
        : "Cantidad rota:";
  } else {
    modalEditar.style.background = "";
    botonModificar.style.background = "";
    grupoCantidad.classList.add("hidden");
  }
}


if (selectEstado) {
  selectEstado.addEventListener("change", actualizarColorModal);
}



document.getElementById("formEditar").addEventListener("submit", async e => {
  e.preventDefault();

  const id = parseInt(document.getElementById("editId").value);
  const nombre = document.getElementById("editNombre").value;
  const categoria = document.getElementById("editCategoria").value;
  const marca = document.getElementById("editMarca").value;
  const modelo = document.getElementById("editModelo").value;
  const descripcion = document.getElementById("editDescripcion").value;
  const stockBase = parseInt(document.getElementById("editStock").value); // Stock Total o Base
  const estadoHerramienta = document.getElementById("editEstadoHerramienta").value;
  const cantidadAfectada = parseInt(document.getElementById("editCantidadRota").value) || 0;

  let stockFinal = stockBase;
  if (estadoHerramienta === "No-Funciona" || estadoHerramienta === "Desaparecida") {
    stockFinal = stockBase - cantidadAfectada;
  }

  if (stockFinal < 0) {
    alert("Error: El stock disponible no puede ser negativo. Revisa la Cantidad Rota/Desaparecida.");
    return;
  }

  const datosModificados = {
    id_herramienta: id,
    nombre: nombre,
    categoria: categoria,
    marca: marca,
    modelo: modelo,
    descripcion: descripcion,
    stock: stockFinal, 
    estado: estadoHerramienta,
    cantidadRota: estadoHerramienta === "No-Funciona" ? cantidadAfectada : 0,
    cantidadDesaparecida: estadoHerramienta === "Desaparecida" ? cantidadAfectada : 0,
    cantidadAfectada: cantidadAfectada
  };

  try {
    const respuesta = await fetch('api/modificar_herramienta.php', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosModificados)
    });

    const resultado = await respuesta.json();

    if (resultado.exito) {
      alert("Herramienta modificada correctamente.");
      await cargarHerramientasDesdeBD();
      cerrarModalEditar();
    } else {
      alert("Error al modificar: " + resultado.mensaje);
    }
  } catch (error) {
    console.error('Error de conexión o servidor:', error);
    alert('No se pudo conectar con el servidor.');
  }
});

function mostrarHerramientasRotas() {
  const contenedor = document.getElementById("contenidoRoto");
  const rotas = herramientas.filter(h => h.estado === "No-Funciona" || h.estado === "Desaparecida" || h.estado === "Acta Hecha");

  if (rotas.length === 0) {
    contenedor.innerHTML = "<p><b>No hay herramientas rotas ni desaparecidas.</b></p>";
    return;
  }

  let tabla = `
    <div class="table-responsive">
        <table class="table table-striped table-hover table-bordered">
        <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Estado</th>
            <th>Cantidad afectada</th>
            <th>Descripción</th>
            <th>Acta</th>
        </tr>`;

  rotas.forEach(h => {
    const cantidad = h.cantidadAfectada || 0;

    const descActual = String(h.descripcion || '');
    const reActa = /\n?Acta \(([^)]*)\) por:\s*([^\n]*)(?:\nObs:\s*(.*))?/;
    const match = descActual.match(reActa);
    const baseDesc = match ? descActual.replace(reActa, '').trim() : descActual;
    const descHtml = baseDesc ? baseDesc.replace(/\n/g, '<br>') : '-';

    const yaTieneActa = !!match;
    const actaDetalleHtml = yaTieneActa ? (
      `<div style="font-size:12px; color:#333; text-align:center;">
         <div><b>Fecha/Hora:</b> ${match[1]}</div>
       </div>`
    ) : '';

    const celdaActa = yaTieneActa
      ? `<div style="display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center;">
           <span style="color:green;font-weight:bold;">Acta registrada</span>
           ${actaDetalleHtml}
           <div style="display:flex; flex-direction:column; gap:6px; align-items:center;">
              <button class="btn btn-secondary btn-sm" onclick="editarImprimirActa(${h.id_herramienta})">Modificar</button>
           </div>
         </div>`
      : `<div style="display:flex; justify-content:center;">
            <button class="btn btn-secondary btn-sm" onclick="gestionarActa(${h.id_herramienta})">Gestionar</button>
         </div>`;

    tabla += `
      <tr>
        <td>${h.id_herramienta}</td>
        <td>${h.nombre}</td>
        <td>${h.categoria}</td>
        <td>${h.marca}</td>
        <td>${h.modelo}</td>
        <td>${h.estado}</td>
        <td>${cantidad}</td>
        <td>${descHtml}</td>
        <td>${celdaActa}</td>
      </tr>`;
  });

  tabla += "</table></div>";
  contenedor.innerHTML = tabla;
}

async function gestionarActa(idHerramienta, edicion = false) {
  const h = herramientas.find(x => x.id_herramienta === idHerramienta);
  if (!h) {
    alert("Herramienta no encontrada para gestionar el acta.");
    return;
  }

  const descActual = String(h.descripcion || '');
  let defResponsable = '', defCargo = '', defObs = '';
  const actaMatch = descActual.match(/Acta \(([^)]*)\) por:\s*([^\n]*)(?:\nObs:\s*(.*))?/);
  if (actaMatch) {
    const respCampo = (actaMatch[2] || '').trim();
    const nameCargo = respCampo.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (nameCargo) {
      defResponsable = nameCargo[1].trim();
      defCargo = nameCargo[2].trim();
    } else {
      defResponsable = respCampo;
    }
    defObs = (actaMatch[3] || '').trim();
  }

  const responsable = prompt('Ingrese el nombre del responsable que realiza el acta:', defResponsable);
  if (!responsable || !responsable.trim()) {
    alert('Debe ingresar el responsable para continuar.');
    return;
  }
  const cargo = prompt('Ingrese el cargo del responsable (opcional):', defCargo) || '';
  const observaciones = prompt('Ingrese observaciones (opcional):', defObs) || '';

  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const cantidad = h.cantidadAfectada || 0;

  const resumen = `Se generará el acta para:\n\n` +
    `Herramienta: ${h.nombre} (ID ${h.id_herramienta})\n` +
    `Estado: ${h.estado}\n` +
    `Cantidad afectada: ${cantidad}\n` +
    `Responsable: ${responsable} ${cargo ? '(' + cargo + ')' : ''}\n` +
    `Fecha/Hora: ${fechaStr} ${horaStr}\n` +
    `${observaciones ? 'Observaciones: ' + observaciones : ''}`;

  if (!confirm(resumen + '\n\n¿Confirmar acta?')) {
    return;
  }

  try {
    const sinActa = descActual.replace(/\n?Acta \([^\n]*\) por: [^\n]*(?:\nObs: [^\n]*)?/, '');
    const descripcionActa = `${sinActa}\nActa (${fechaStr} ${horaStr}) por: ${responsable}${cargo ? ' (' + cargo + ')' : ''}${observaciones ? '\nObs: ' + observaciones : ''}`.slice(0, 500);

    const payload = {
      id_herramienta: h.id_herramienta,
      nombre: h.nombre,
      categoria: h.categoria,
      marca: h.marca,
      modelo: h.modelo,
      descripcion: descripcionActa,
      stock: h.stock,
      estado: h.estado,
      cantidadRota: 0,
      cantidadDesaparecida: 0,
      cantidadAfectada: h.cantidadAfectada || 0
    };

    const resp = await fetch('api/modificar_herramienta.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    try { await resp.json(); } catch (_) { }

    await cargarHerramientasDesdeBD();
    mostrarHerramientasRotas();
    alert('Acta registrada. El estado de la herramienta no fue modificado.');
  } catch (err) {
    console.error('Fallo al registrar acta en la descripción:', err);
    alert('No se pudo registrar el acta. Revise la consola.');
  }
}

// Formulario imprimible de Acta
function ensureActaImpresionModal() {
  if (document.getElementById('modalActaImpresion')) return;

  const styleId = 'actaPrintStyles';
  if (!document.getElementById(styleId)) {
    const st = document.createElement('style');
    st.id = styleId;
    st.textContent = `@media print {
  @page { size: A4; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
  body * { visibility: hidden !important; }
  #modalActaImpresion, #modalActaImpresion * { visibility: visible !important; }
  #modalActaImpresion {
    position: static !important;
    inset: auto !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    page-break-before: auto !important;
    page-break-after: auto !important;
    page-break-inside: avoid !important;
  }
  /* Contenedor interno con padding seguro para evitar desborde en A4 */
  #modalActaImpresion > div {
    width: 100% !important;
    max-width: calc(210mm - 20mm) !important; /* A4 width - padding total */
    margin: 0 auto !important;
    border: none !important;
    box-shadow: none !important;
    padding: 10mm !important; /* padding lateral seguro */
    box-sizing: border-box !important;
  }
  /* Asegurar que todos los elementos respeten el ancho disponible */
  #modalActaImpresion *, #modalActaImpresion *::before, #modalActaImpresion *::after {
    box-sizing: border-box !important;
    max-width: 100% !important;
  }
  /* Ajuste Observaciones en impresión para no sobresalir */
  #actaObsInput {
    width: 100% !important;
    max-width: 100% !important; /* que no exceda el contenedor */
    min-height: 72px !important;
    font-size: 16px !important;
    font-family: inherit !important;
  }
  .no-print { display: none !important; }
}`;
    document.head.appendChild(st);
  }

  const modal = document.createElement('div');
  modal.id = 'modalActaImpresion';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); display:none; align-items:center; justify-content:center; z-index:10000;';
  modal.innerHTML = `
    <div style="background:#fff; width:min(900px, 95vw); max-height:90vh; overflow:auto; border-radius:8px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,.2);">
      <div style="display:flex; align-items:center; gap:12px; border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:16px;">
        <img src="imagenespract/logo.jpeg" alt="Logo" style="height:48px;">
        <div>
          <div style="font-size:18px; font-weight:700;">Acta de No Funcionamiento / Desaparición</div>
          <div id="actaFechaHora" style="font-size:12px; color:#666;"></div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
        <div><b>Herramienta:</b> <span id="actaHerramientaNombre"></span></div>
        <div><b>ID:</b> <span id="actaHerramientaId"></span></div>
        <div><b>Categoría:</b> <span id="actaCategoria"></span></div>
        <div><b>Marca/Modelo:</b> <span id="actaMarcaModelo"></span></div>
        <div><b>Estado:</b> <span id="actaEstado"></span></div>
        <div><b>Cant. afectada:</b> <span id="actaCantidad"></span></div>
      </div>

      <div style="margin:10px 0;">
        <div style="font-weight:700; margin-bottom:6px;">Descripción de la herramienta</div>
        <div id="actaDescripcionBase" style="border:1px solid #ddd; border-radius:6px; padding:10px; min-height:40px;"></div>
      </div>

      <div style="display:grid; grid-template-columns:3fr 1fr; column-gap:16px; margin:10px 0; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <label for="actaRespInput" style="font-weight:700; white-space:nowrap;">Responsable:</label>
          <input id="actaRespInput" type="text" style="flex:1; max-width:380px; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:16px;">
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label for="actaCargoInput" style="font-weight:700; white-space:nowrap;">Cargo:</label>
          <input id="actaCargoInput" type="text" style="flex:1; max-width:220px; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:16px;">
        </div>
      </div>

      <div style="margin:10px 0;">
        <div style="font-weight:700; margin-bottom:6px;">Observaciones</div>
        <textarea id="actaObsInput" style="width:100%; max-width:780px; min-height:72px; border:1px solid #ddd; border-radius:5px; padding:10px; font-size:16px; font-family: inherit;"></textarea>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:24px; align-items:end;">
        <div style="text-align:center;">
          <div style="height:48px;"></div>
          <div style="border-top:1px solid #333; padding-top:6px;">Firma del Responsable</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">Aclaración:</div>
        </div>
        <div style="text-align:center;">
          <div style="height:48px;"></div>
          <div style="border-top:1px solid #333; padding-top:6px;">Firma del Encargado de Pañol</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">Aclaración:</div>
        </div>
        <div style="text-align:center;">
          <div style="height:48px;"></div>
          <div style="border-top:1px solid #333; padding-top:6px;">Firma Equipo Directivo</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">Aclaración:</div>
        </div>
      </div>

      <div class="no-print" style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
        <button class="btn btn-secondary" onclick="cerrarActaImpresion()">Cerrar</button>
        <button class="btn btn-primary" onclick="guardarActaDesdeModal(false)">Guardar</button>
        <button class="btn btn-success" onclick="guardarActaDesdeModal(true)">Imprimir</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function abrirActaImpresion(datos) {
  ensureActaImpresionModal();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v || '-'; };
  set('actaFechaHora', `Fecha/Hora: ${datos.fechaHora || '-'}`);
  set('actaHerramientaNombre', datos.nombre);
  set('actaHerramientaId', datos.id);
  set('actaCategoria', datos.categoria);
  set('actaMarcaModelo', `${datos.marca || ''} ${datos.modelo || ''}`.trim());
  set('actaEstado', datos.estado);
  set('actaCantidad', String(datos.cantidad || 0));
  set('actaDescripcionBase', (datos.descripcionBase || '-').replace(/\n/g, '<br>'));

  const respEl = document.getElementById('actaRespInput');
  const cargoEl = document.getElementById('actaCargoInput');
  const obsEl = document.getElementById('actaObsInput');
  if (respEl) respEl.value = datos.responsable || '';
  if (cargoEl) cargoEl.value = datos.cargo || '';
  if (obsEl) obsEl.value = datos.observaciones || '';

  window.idActaEnEdicion = datos.id;

  const modal = document.getElementById('modalActaImpresion');
  if (modal) modal.style.display = 'flex';
}

function cerrarActaImpresion() {
  const modal = document.getElementById('modalActaImpresion');
  if (modal) modal.style.display = 'none';
}

function editarImprimirActa(idHerramienta) {
  const h = herramientas.find(x => x.id_herramienta === idHerramienta);
  if (!h) { alert('No se encontró la herramienta.'); return; }

  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const horaStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const descActual = String(h.descripcion || '');
  const reActa = /\n?Acta \(([^)]*)\) por:\s*([^\n]*)(?:\nObs:\s*(.*))?/;
  const match = descActual.match(reActa);
  const baseDesc = match ? descActual.replace(reActa, '').trim() : descActual;

  let responsable = '', cargo = '', obs = '';
  if (match) {
    const respCampo = (match[2] || '').trim();
    const nameCargo = respCampo.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (nameCargo) { responsable = nameCargo[1].trim(); cargo = nameCargo[2].trim(); }
    else { responsable = respCampo; }
    obs = (match[3] || '').trim();
  }

  const datos = {
    fechaHora: `${fechaStr} ${horaStr}`,
    nombre: h.nombre,
    id: h.id_herramienta,
    categoria: h.categoria,
    marca: h.marca,
    modelo: h.modelo,
    estado: h.estado,
    cantidad: h.cantidadAfectada || 0,
    descripcionBase: baseDesc,
    responsable,
    cargo,
    observaciones: obs
  };
  abrirActaImpresion(datos);
}

function imprimirActa(idHerramienta) {
  const h = herramientas.find(x => x.id_herramienta === idHerramienta);
  if (!h) {
    alert('No se encontró la herramienta para imprimir el acta.');
    return;
  }

  const descActual = String(h.descripcion || '');
  const reActa = /\n?Acta \(([^)]*)\) por:\s*([^\n]*)(?:\nObs:\s*(.*))?/;
  const match = descActual.match(reActa);
  if (!match) {
    alert('No hay un acta registrada para imprimir. Use "Gestionar" para registrar los datos.');
    return;
  }
  const baseDesc = descActual.replace(reActa, '').trim();

  let responsable = (match[2] || '').trim();
  let cargo = '';
  const nameCargo = responsable.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (nameCargo) { responsable = nameCargo[1].trim(); cargo = nameCargo[2].trim(); }

  const datos = {
    fechaHora: match[1] || '',
    nombre: h.nombre,
    id: h.id_herramienta,
    categoria: h.categoria,
    marca: h.marca,
    modelo: h.modelo,
    estado: h.estado,
    cantidad: h.cantidadAfectada || 0,
    descripcionBase: baseDesc,
    responsable,
    cargo,
    observaciones: (match[3] || '').trim()
  };

  abrirActaImpresion(datos);
}

async function generarActa(idHerramienta) {
  return gestionarActa(idHerramienta);
}

async function guardarActaDesdeModal(imprimir = false) {
  const id = window.idActaEnEdicion;
  const h = herramientas.find(x => x.id_herramienta === id);
  if (!h) { alert('No se encontró la herramienta para guardar el acta.'); return; }

  const respEl = document.getElementById('actaRespInput');
  const cargoEl = document.getElementById('actaCargoInput');
  const obsEl = document.getElementById('actaObsInput');
  const responsable = (respEl?.value || '').trim();
  const cargo = (cargoEl?.value || '').trim();
  const observaciones = (obsEl?.value || '').trim();
  if (!responsable) { alert('Ingrese el responsable.'); return; }

  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const horaStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const descActual = String(h.descripcion || '');
  const sinActa = descActual.replace(/\n?Acta \([^\n]*\) por: [^\n]*(?:\nObs: [^\n]*)?/, '');
  const descripcionActa = `${sinActa}\nActa (${fechaStr} ${horaStr}) por: ${responsable}${cargo ? ' (' + cargo + ')' : ''}${observaciones ? '\nObs: ' + observaciones : ''}`.slice(0, 500);

  try {
    const payload = {
      id_herramienta: h.id_herramienta,
      nombre: h.nombre,
      categoria: h.categoria,
      marca: h.marca,
      modelo: h.modelo,
      descripcion: descripcionActa,
      stock: h.stock,
      estado: h.estado,
      cantidadRota: 0,
      cantidadDesaparecida: 0,
      cantidadAfectada: h.cantidadAfectada || 0
    };

    const resp = await fetch('api/modificar_herramienta.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    try { await resp.json(); } catch (_) { }

    await cargarHerramientasDesdeBD();
    mostrarHerramientasRotas();

    if (imprimir) {
      window.print();
    } else {
      alert('Acta guardada.');
    }
  } catch (e) {
    console.error('Error guardando el acta desde modal:', e);
    alert('No se pudo guardar el acta.');
  }
}

actualizarTablaHerramientas();
mostrarHerramientasRotas(); 


document.getElementById("formAgregar").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this); 

  const imgFile = document.getElementById("imagen").files[0];
  const imgName = imgFile ? imgFile.name : 'default.jpg';

  formData.set('img', imgName);

  const stock = parseInt(document.getElementById("stock").value);
  if (isNaN(stock) || stock <= 0) {
    alert("¡Error! El Stock inicial debe ser un número positivo.");
    return;
  }

  try {
    const respuesta = await fetch('api/registrar_herramienta.php', {
      method: 'POST',
      body: formData 
    });

    if (!respuesta.ok) {
      const errorText = await respuesta.text();
      console.error('Error del Servidor (no JSON):', errorText);
      alert("Error: El servidor devolvió un error de formato o código. Revisa la consola para el error PHP.");
      return;
    }

    const resultado = await respuesta.json();

    if (resultado.exito) {
      alert(resultado.mensaje);
      this.reset();
      await cargarHerramientasDesdeBD(); 

    } else {
      alert("Error al registrar: " + resultado.mensaje);
    }

  } catch (error) {
    console.error('Error al intentar registrar la herramienta o fallo al parsear JSON:', error);
    alert("Ocurrió un error en la conexión o el servidor. Revisa la consola para más detalles.");
  }
});
