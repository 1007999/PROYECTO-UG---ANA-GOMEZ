'use strict';

requireRole('estudiante');

let registros = [];


/* =========================================================
   MATERIALES
   ========================================================= */

function addItem(datos = {}) {
  const valores = {
    concepto: datos.concepto ?? 'Plywood 3 mm',
    cantidad: datos.cantidad ?? 1,
    unidad: datos.unidad ?? 'plancha',
    precio: datos.precio ?? 0
  };

  const template = $('#itemTemplate');
  const itemsBody = $('#itemsBody');

  if (!template) {
    console.error('No se encontró el template #itemTemplate');
    return;
  }

  if (!itemsBody) {
    console.error('No se encontró el contenedor #itemsBody');
    return;
  }

  const fragmento = template.content.cloneNode(true);
  const fila = fragmento.querySelector('tr');

  if (!fila) {
    console.error('El template #itemTemplate no contiene una fila <tr>');
    return;
  }

  const concepto = fila.querySelector('.concepto');
  const cantidad = fila.querySelector('.cantidad');
  const unidad = fila.querySelector('.unidad');
  const precio = fila.querySelector('.precio');
  const botonEliminar = fila.querySelector('.btnEliminar');

  if (concepto) {
    concepto.value = valores.concepto;
  }

  if (cantidad) {
    cantidad.value = valores.cantidad;
  }

  if (unidad) {
    unidad.value = valores.unidad;
  }

  if (precio) {
    precio.value = valores.precio;
  }

  fila.addEventListener('input', calculate);
  fila.addEventListener('change', calculate);

  botonEliminar?.addEventListener('click', (event) => {
    event.preventDefault();
    fila.remove();

    /*
     * Mantiene al menos una fila disponible.
     */
    if ($$('#itemsBody tr').length === 0) {
      addItem({
        concepto: '',
        cantidad: 1,
        unidad: 'unidad',
        precio: 0
      });
    }

    calculate();
  });

  itemsBody.appendChild(fila);
  calculate();
}


function getItems() {
  return $$('#itemsBody tr')
    .map((fila) => {
      const concepto = fila.querySelector('.concepto');
      const cantidad = fila.querySelector('.cantidad');
      const unidad = fila.querySelector('.unidad');
      const precio = fila.querySelector('.precio');

      return {
        concepto: concepto?.value.trim() || '',
        cantidad: num(cantidad?.value),
        unidad: unidad?.value || '',
        precio: num(precio?.value)
      };
    })
    .filter((item) => {
      return (
        item.concepto !== '' ||
        item.cantidad > 0 ||
        item.precio > 0
      );
    });
}


/* =========================================================
   CÁLCULOS
   ========================================================= */

function calculate() {
  let subtotal = 0;

  $$('#itemsBody tr').forEach((fila) => {
    const cantidadInput = fila.querySelector('.cantidad');
    const precioInput = fila.querySelector('.precio');
    const subtotalElemento = fila.querySelector('.itemSubtotal');

    const cantidad = Math.max(0, num(cantidadInput?.value));
    const precio = Math.max(0, num(precioInput?.value));
    const valor = cantidad * precio;

    subtotal += valor;

    if (subtotalElemento) {
      subtotalElemento.textContent = money(valor);
    }
  });

  const descuentoInput = $('#descuento');
  const ivaInput = $('#iva');

  const descuentoPct = Math.min(
    100,
    Math.max(0, num(descuentoInput?.value))
  );

  const ivaPct = Math.min(
    100,
    Math.max(0, num(ivaInput?.value))
  );

  const descuento = subtotal * descuentoPct / 100;
  const baseImponible = Math.max(0, subtotal - descuento);
  const iva = baseImponible * ivaPct / 100;
  const total = baseImponible + iva;

  const subtotalElemento = $('#subtotal');
  const descuentoElemento = $('#descuentoValor');
  const ivaElemento = $('#ivaValor');
  const totalElemento = $('#total');

  if (subtotalElemento) {
    subtotalElemento.textContent = money(subtotal);
  }

  if (descuentoElemento) {
    descuentoElemento.textContent = money(descuento);
  }

  if (ivaElemento) {
    ivaElemento.textContent = money(iva);
  }

  if (totalElemento) {
    totalElemento.textContent = money(total);
  }

  return {
    subtotal,
    descuentoPct,
    descuento,
    ivaPct,
    iva,
    total
  };
}


/* =========================================================
   DATOS DE LA SOLICITUD
   ========================================================= */

function obtenerValor(selector) {
  const elemento = $(selector);

  if (!elemento) {
    return '';
  }

  return String(elemento.value ?? '').trim();
}


function payload() {
  return {
    action: 'guardar',
    codigo: `TALLER-${Date.now().toString().slice(-8)}`,
    fechaRegistro: new Date().toISOString(),

    estudiante: obtenerValor('#estudiante'),
    identificacion: obtenerValor('#identificacion'),
    codigoEstudiante: obtenerValor('#codigoEstudiante'),
    carrera: obtenerValor('#carrera'),
    semestre: obtenerValor('#semestre'),
    paralelo: obtenerValor('#paralelo'),
    correo: obtenerValor('#correo'),
    telefono: obtenerValor('#telefono'),

    docente: obtenerValor('#docente'),
    asignatura: obtenerValor('#asignatura'),

    fechaUso: obtenerValor('#fechaUso'),
    horarioUso: obtenerValor('#horarioUso'),

    tipoProyecto: obtenerValor('#tipoProyecto'),
    escala: obtenerValor('#escala'),
    maquinaPrincipal: obtenerValor('#maquinaPrincipal'),

    numeroEstudiantes:
      Math.max(1, num(obtenerValor('#numeroEstudiantes'))),

    descripcion: obtenerValor('#descripcion'),
    herramientas: obtenerValor('#herramientas'),

    aceptaNormas: Boolean($('#aceptaNormas')?.checked),

    items: getItems(),

    estado: 'Pendiente',

    ...calculate()
  };
}


/* =========================================================
   VALIDACIÓN
   ========================================================= */

function validate(datos) {
  const camposObligatorios = [
    'estudiante',
    'identificacion',
    'codigoEstudiante',
    'carrera',
    'semestre',
    'paralelo',
    'correo',
    'telefono',
    'docente',
    'asignatura',
    'fechaUso',
    'horarioUso',
    'tipoProyecto',
    'descripcion',
    'herramientas'
  ];

  for (const campo of camposObligatorios) {
    if (!String(datos[campo] ?? '').trim()) {
      return 'Complete todos los campos obligatorios.';
    }
  }

  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formatoCorreo.test(datos.correo)) {
    return 'Ingrese un correo electrónico válido.';
  }

  if (!datos.aceptaNormas) {
    return 'Debe aceptar las normas de seguridad y uso del taller.';
  }

  if (!Array.isArray(datos.items) || datos.items.length === 0) {
    return 'Agregue al menos un material.';
  }

  const materialInvalido = datos.items.some((item) => {
    return (
      !String(item.concepto ?? '').trim() ||
      item.cantidad <= 0 ||
      item.precio < 0
    );
  });

  if (materialInvalido) {
    return 'Revise el concepto, la cantidad y el precio de los materiales.';
  }

  if (datos.numeroEstudiantes < 1) {
    return 'El número de estudiantes debe ser mayor que cero.';
  }

  return '';
}


/* =========================================================
   MENSAJES
   ========================================================= */

function message(texto, error = false) {
  const elemento = $('#mensaje');

  if (!elemento) {
    if (error) {
      console.error(texto);
    } else {
      console.log(texto);
    }

    return;
  }

  elemento.textContent = texto;
  elemento.className = error
    ? 'message error'
    : 'message';
}


/* =========================================================
   REGISTRAR SOLICITUD
   ========================================================= */

async function save() {
  const botonGuardar = $('#btnGuardar');

  try {
    const datos = payload();
    const errorValidacion = validate(datos);

    if (errorValidacion) {
      message(errorValidacion, true);
      return;
    }

    if (botonGuardar) {
      botonGuardar.disabled = true;
    }

    message('Registrando solicitud...');

    const respuesta = await api(datos);

    localStorage.setItem(
      'taller_correo_estudiante',
      datos.correo.toLowerCase()
    );

    if (respuesta.correoEnviado) {
      message(
        `Solicitud ${respuesta.codigo} registrada y enviada al correo.`
      );
    } else if (respuesta.modoLocal) {
      message(
        `Solicitud ${respuesta.codigo} guardada correctamente en modo local.`
      );
    } else {
      message(
        `Solicitud ${respuesta.codigo} registrada correctamente.`
      );
    }

    await loadRecords();
  } catch (error) {
    console.error('Error al registrar la solicitud:', error);

    message(
      `Error al registrar: ${
        error?.message || 'Ocurrió un error inesperado.'
      }`,
      true
    );
  } finally {
    if (botonGuardar) {
      botonGuardar.disabled = false;
    }
  }
}


/* =========================================================
   LISTAR SOLICITUDES
   ========================================================= */

async function loadRecords() {
  const cuerpoTabla = $('#misRegistrosBody');

  try {
    const respuesta = await api({
      action: 'listar'
    });

    const correoIngresado = obtenerValor('#correo');
    const correoGuardado =
      localStorage.getItem('taller_correo_estudiante') || '';

    const correo = (
      correoIngresado ||
      correoGuardado
    ).trim().toLowerCase();

    const lista = Array.isArray(respuesta.registros)
      ? respuesta.registros
      : [];

    registros = lista.filter((registro) => {
      if (!correo) {
        return false;
      }

      return String(registro.correo ?? '')
        .trim()
        .toLowerCase() === correo;
    });

    if (cuerpoTabla) {
      if (registros.length === 0) {
        cuerpoTabla.innerHTML = `
          <tr>
            <td colspan="6">
              No hay solicitudes para mostrar.
              Ingrese su correo y pulse Actualizar.
            </td>
          </tr>
        `;
      } else {
        cuerpoTabla.innerHTML = registros
          .map((registro) => {
            return `
              <tr>
                <td>${esc(registro.codigo || '-')}</td>
                <td>${esc(registro.fechaUso || '-')}</td>
                <td>${esc(registro.horarioUso || '-')}</td>
                <td>${esc(registro.tipoProyecto || '-')}</td>
                <td>${money(registro.total)}</td>
                <td>
                  <span class="badge">
                    ${esc(registro.estado || 'Pendiente')}
                  </span>
                </td>
              </tr>
            `;
          })
          .join('');
      }
    }

    const kpiSolicitudes = $('#kpiMisSolicitudes');
    const kpiPendientes = $('#kpiMisPendientes');
    const kpiTotal = $('#kpiMiTotal');

    if (kpiSolicitudes) {
      kpiSolicitudes.textContent = registros.length;
    }

    if (kpiPendientes) {
      kpiPendientes.textContent = registros.filter(
        (registro) =>
          String(registro.estado ?? '').toLowerCase() ===
          'pendiente'
      ).length;
    }

    if (kpiTotal) {
      const totalAcumulado = registros.reduce(
        (acumulado, registro) =>
          acumulado + num(registro.total),
        0
      );

      kpiTotal.textContent = money(totalAcumulado);
    }
  } catch (error) {
    console.error('Error al cargar las solicitudes:', error);

    if (cuerpoTabla) {
      cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="6">
            No se pudieron cargar las solicitudes.
          </td>
        </tr>
      `;
    }

    message(
      error?.message || 'No se pudieron cargar las solicitudes.',
      true
    );
  }
}


/* =========================================================
   REINICIAR FORMULARIO
   ========================================================= */

function reset() {
  const formulario =
    $('#formSolicitud') ||
    $('form');

  if (formulario) {
    formulario.reset();
  }

  const itemsBody = $('#itemsBody');

  if (itemsBody) {
    itemsBody.innerHTML = '';
  }

  const descuento = $('#descuento');
  const iva = $('#iva');
  const numeroEstudiantes = $('#numeroEstudiantes');

  if (descuento) {
    descuento.value = 0;
  }

  if (iva) {
    iva.value = 15;
  }

  if (numeroEstudiantes) {
    numeroEstudiantes.value = 1;
  }

  addItem({
    concepto: 'Plywood 3 mm',
    cantidad: 1,
    unidad: 'plancha',
    precio: 0
  });

  calculate();
  message('');
}


/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const btnGuardar = $('#btnGuardar');
  const btnAgregarItem = $('#btnAgregarItem');
  const btnImprimir = $('#btnImprimir');
  const btnNueva = $('#btnNueva');
  const btnActualizar = $('#btnActualizar');
  const descuento = $('#descuento');
  const iva = $('#iva');

  if (btnGuardar) {
    btnGuardar.addEventListener('click', async (event) => {
      event.preventDefault();
      await save();
    });
  } else {
    console.error('No se encontró el botón #btnGuardar');
  }

  if (btnAgregarItem) {
    btnAgregarItem.addEventListener('click', (event) => {
      event.preventDefault();

      addItem({
        concepto: '',
        cantidad: 1,
        unidad: 'unidad',
        precio: 0
      });
    });
  }

  descuento?.addEventListener('input', calculate);
  iva?.addEventListener('input', calculate);

  btnImprimir?.addEventListener('click', (event) => {
    event.preventDefault();
    window.print();
  });

  btnNueva?.addEventListener('click', (event) => {
    event.preventDefault();
    reset();
  });

  btnActualizar?.addEventListener('click', async (event) => {
    event.preventDefault();

    const correo = obtenerValor('#correo');

    if (correo) {
      localStorage.setItem(
        'taller_correo_estudiante',
        correo.toLowerCase()
      );
    }

    await loadRecords();
  });

  addItem();
  loadRecords();
});