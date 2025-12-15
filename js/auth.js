let usuarioActual = null;

function domReady() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
      resolve();
    }
  });
}

async function verificarSesion() {
  try {
    const resp = await fetch('api/check_session.php');
    if (!resp.ok) throw new Error('Sesión inválida');
    const data = await resp.json();
    if (!data.autenticado) throw new Error('Sesión no iniciada');
    usuarioActual = data.usuario;
  } catch (error) {
    console.warn('Sesión no válida o expirada:', error);
    window.location.href = 'login.html';
    throw error;
  }
}

function aplicarRestriccionesPorRol() {
  const nombreEl = document.getElementById('userName');
  const rolEl = document.getElementById('userRole');
  const navInventario = document.getElementById('navInventario');
  const navRoto = document.getElementById('navRoto');

  if (nombreEl) nombreEl.textContent = usuarioActual?.nombre || usuarioActual?.usuario || 'Usuario';
  if (rolEl) rolEl.textContent = usuarioActual ? usuarioActual.rol.toUpperCase() : '';

  if (navInventario) {
    navInventario.style.display = (usuarioActual?.rol === 'admin') ? 'block' : 'none';
  }

  if (navRoto) {
    navRoto.style.display = (usuarioActual?.rol === 'admin') ? 'block' : 'none';
  }
}

function configurarLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('api/logout.php', { method: 'POST' });
    } finally {
      window.location.href = 'login.html';
    }
  });
}

window.authReady = (async () => {
  await verificarSesion();
  await domReady();
  aplicarRestriccionesPorRol();
  configurarLogout();
})();

