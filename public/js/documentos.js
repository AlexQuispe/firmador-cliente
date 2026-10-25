import {
  requerirSesion, cerrarSesion, api, mostrarEstado, formatearTamano, formatearFecha,
  mostrarSnackbar, solicitarFirma, verificarSolicitud,
} from './app.js';

const lista = document.querySelector('#lista');
const aviso = document.querySelector('#aviso');
const plantilla = document.querySelector('#fila');
const selector = document.querySelector('#selector');
const botonSubir = document.querySelector('#subir');
const acciones = document.querySelector('#acciones');
const botonFirmar = document.querySelector('#firmar');
const hoja = document.querySelector('#hoja');

let documentos = [];
let seleccionado = null;

document.querySelector('#usuario').textContent = requerirSesion();
document.querySelector('#salir').addEventListener('click', cerrarSesion);
document.querySelector('#actualizar').addEventListener('click', actualizar);

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = !texto;
}

function crearFila(documento) {
  const fila = plantilla.content.cloneNode(true);
  const boton = fila.querySelector('.fila');
  boton.dataset.id = documento.id;
  boton.addEventListener('click', () => seleccionar(documento));

  fila.querySelector('.fila-nombre').textContent = documento.nombre;
  fila.querySelector('.fila-datos').textContent =
    `${formatearTamano(documento.tamano)} · ${formatearFecha(documento.subidoEn)} · ${documento.subidoPor}`;
  mostrarEstado(fila.querySelector('.chip-estado'), documento.estado, documento.cantidadFirmas);

  // Titular y fecha vienen del PDF firmado, informados por el servicio (FC-06).
  if (documento.ultimaFirma) {
    const { titular, fechaDeclarada } = documento.ultimaFirma;
    fila.querySelector('.fila-firmante').textContent =
      `${titular} · ${formatearFecha(fechaDeclarada)} (declarada)`;
  } else {
    fila.querySelector('.fila-firma').remove();
  }
  return fila;
}

// FC-02
async function cargar() {
  seleccionar(null);
  lista.replaceChildren();
  mostrarAviso('Cargando documentos…');
  try {
    documentos = await api('/documentos');
    lista.replaceChildren(...documentos.map(crearFila));
    mostrarAviso(documentos.length ? '' : 'No hay documentos. Sube un PDF para empezar.');
  } catch {
    mostrarAviso('No se pudo cargar la lista. Intenta actualizar.');
  }
}

// FC-03
botonSubir.addEventListener('click', () => selector.click());
selector.addEventListener('change', async () => {
  const archivo = selector.files[0];
  if (!archivo) return;
  botonSubir.disabled = true;
  try {
    await api('/documentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-Nombre-Archivo': encodeURIComponent(archivo.name),
      },
      body: archivo,
    });
    await cargar();
  } catch {
    mostrarAviso('No se pudo subir el documento.');
  } finally {
    botonSubir.disabled = false;
    selector.value = '';
  }
});

// FC-04: una fila seleccionada a la vez, con sus acciones en la barra inferior.
function seleccionar(documento) {
  seleccionado = seleccionado?.id === documento?.id ? null : documento;
  for (const fila of lista.querySelectorAll('.fila')) {
    fila.setAttribute('aria-pressed', fila.dataset.id === seleccionado?.id);
  }
  acciones.hidden = !seleccionado;
  document.body.classList.toggle('con-acciones', Boolean(seleccionado));
  if (seleccionado) {
    document.querySelector('#ver-detalle').href = `documento?id=${encodeURIComponent(seleccionado.id)}`;
  }
}

botonFirmar.addEventListener('click', async () => {
  botonFirmar.disabled = true;
  try {
    await solicitarFirma(seleccionado);
  } catch {
    mostrarSnackbar('No se pudo crear la solicitud de firma.');
  } finally {
    botonFirmar.disabled = false;
  }
});

document.querySelector('#cancelar').addEventListener('click', () => {
  hoja.close();
  cargar();
});

// FC-06
function avisarResultado({ documentoId, estado }) {
  const documento = documentos.find((d) => d.id === documentoId);
  if (estado === 'RECHAZADA') {
    mostrarSnackbar(`Firma rechazada: ${documento?.nombre ?? 'documento'}`);
    return;
  }
  if (documento?.ultimaFirma) mostrarSnackbar(`Firmado por ${documento.ultimaFirma.titular}`);
  const fila = lista.querySelector(`.fila[data-id="${CSS.escape(documentoId)}"]`);
  fila?.classList.add('resaltada');
  setTimeout(() => fila?.classList.remove('resaltada'), 4000);
}

async function actualizar() {
  if (hoja.open) hoja.close();
  let resultado = null;
  try {
    resultado = await verificarSolicitud();
  } catch {
    mostrarSnackbar('No se pudo consultar el estado de la firma.');
  }
  await cargar();
  if (resultado) avisarResultado(resultado);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') actualizar();
});

actualizar();
