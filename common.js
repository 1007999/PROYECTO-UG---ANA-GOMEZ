'use strict';

/* =========================
   SELECTORES
   ========================= */

/**
 * Selecciona un solo elemento.
 */
const $ = (selector, contexto = document) =>
  contexto.querySelector(selector);

/**
 * Selecciona varios elementos y devuelve un arreglo.
 */
const $$ = (selector, contexto = document) =>
  Array.from(contexto.querySelectorAll(selector));


/* =========================
   UTILIDADES
   ========================= */

const num = (valor) => {
  const numero = Number(
    String(valor ?? '')
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.')
  );

  return Number.isFinite(numero) ? numero : 0;
};


const money = (valor) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(valor) || 0);


const esc = (valor) =>
  String(valor ?? '').replace(/[&<>'"]/g, (caracter) => {
    const entidades = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };

    return entidades[caracter];
  });


/* =========================
   SESIÓN
   ========================= */

function requireRole(role) {
  try {
    const sesion = JSON.parse(
      sessionStorage.getItem('tallerSesion') || 'null'
    );

    if (!sesion || sesion.rol !== role) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Error al validar la sesión:', error);
    window.location.href = 'index.html';
  }
}


function cerrarSesion() {
  sessionStorage.removeItem('tallerSesion');
  window.location.href = 'index.html';
}


document.addEventListener('DOMContentLoaded', () => {
  $$('[data-logout]').forEach((boton) => {
    boton.addEventListener('click', cerrarSesion);
  });
});


/* =========================
   API
   ========================= */

/**
 * Determina si la URL configurada es realmente utilizable.
 * Devuelve false si está vacía o si todavía contiene el texto
 * de plantilla, para evitar el error "Failed to fetch".
 */
function urlAppsScriptValida(url) {
  if (!url) {
    return false;
  }

  // Todavía es la URL de ejemplo sin reemplazar.
  if (url.includes('TU_ID_DE_IMPLEMENTACION')) {
    return false;
  }

  // Debe ser la URL pública que termina en /exec (no la /dev).
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
    return false;
  }

  return true;
}


async function api(payload) {
  const url = String(
    window.APP_CONFIG?.APPS_SCRIPT_URL ?? ''
  ).trim();

  // Sin URL válida => se trabaja en modo local (localStorage).
  if (!urlAppsScriptValida(url)) {
    return localApi(payload);
  }

  let respuesta;

  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Errores de red (URL inexistente, redirección a login,
    // sin conexión, CORS). Mensaje claro en vez de "Failed to fetch".
    throw new Error(
      'No se pudo conectar con Google Apps Script. Verifique que la URL ' +
      'termine en /exec y que la implementación tenga acceso ' +
      '"Cualquier usuario".'
    );
  }

  if (!respuesta.ok) {
    throw new Error(
      `No se pudo conectar con Google Apps Script. Código: ${respuesta.status}`
    );
  }

  let resultado;

  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error(
      'Google Apps Script no devolvió una respuesta JSON válida. ' +
      'Esto suele ocurrir cuando la URL redirige a una pantalla de ' +
      'inicio de sesión de Google.'
    );
  }

  if (resultado?.ok === false) {
    throw new Error(
      resultado.error || 'Ocurrió un error.'
    );
  }

  return resultado;
}


/* =========================
   ALMACENAMIENTO LOCAL
   ========================= */

function leerSolicitudesLocales() {
  const clave = 'taller_solicitudes_estudiantes';

  try {
    const contenido = localStorage.getItem(clave);
    const registros = JSON.parse(contenido || '[]');

    return Array.isArray(registros)
      ? registros
      : [];
  } catch (error) {
    console.error(
      'No se pudieron leer las solicitudes locales:',
      error
    );

    return [];
  }
}


function guardarSolicitudesLocales(registros) {
  const clave = 'taller_solicitudes_estudiantes';

  localStorage.setItem(
    clave,
    JSON.stringify(registros)
  );
}


/* =========================
   API LOCAL
   ========================= */

function localApi(payload = {}) {
  const registros = leerSolicitudesLocales();
  const accion = String(payload.action ?? '').trim();

  if (accion === 'guardar') {
    const solicitud = {
      ...payload,
      codigo:
        payload.codigo ||
        `TALLER-${Date.now().toString().slice(-8)}`,
      fechaRegistro:
        payload.fechaRegistro ||
        new Date().toISOString(),
      estado:
        payload.estado ||
        'Pendiente',
      correoEnviado: false
    };

    registros.unshift(solicitud);
    guardarSolicitudesLocales(registros);

    return {
      ok: true,
      codigo: solicitud.codigo,
      correoEnviado: false,
      modoLocal: true
    };
  }

  if (accion === 'listar') {
    return {
      ok: true,
      registros
    };
  }

  if (accion === 'estado') {
    const codigo = String(payload.codigo ?? '').trim();
    const estado = String(payload.estado ?? '').trim();

    const solicitud = registros.find(
      (registro) =>
        String(registro.codigo) === codigo
    );

    if (!solicitud) {
      return {
        ok: false,
        error: 'Solicitud no encontrada.'
      };
    }

    solicitud.estado = estado;
    solicitud.fechaActualizacion =
      new Date().toISOString();

    guardarSolicitudesLocales(registros);

    return {
      ok: true,
      codigo,
      estado
    };
  }

  return {
    ok: false,
    error: 'Acción no válida.'
  };
}