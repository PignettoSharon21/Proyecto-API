async function redirigirSiAutenticado() {
  try {
    const resp = await fetch('api/check_session.php');
    if (resp.ok) {
      const data = await resp.json();
      if (data.autenticado) {
        window.location.href = 'index.html';
      }
    }
  } catch (error) {
    console.warn('No se pudo verificar la sesión actual.', error);
  }
}

redirigirSiAutenticado();

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = document.getElementById('loginUsuario').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorBox = document.getElementById('loginError');
  errorBox.textContent = '';

  try {
    const resp = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await resp.json();

    if (!resp.ok || !data.exito) {
      throw new Error(data.mensaje || 'Credenciales inválidas.');
    }

    window.location.href = 'index.html';
  } catch (error) {
    console.error('Fallo al iniciar sesión:', error);
    errorBox.textContent = error.message || 'No se pudo iniciar sesión.';
  }
});

