import {
  requerirSesion, api, urlApi, mostrarEstado, formatearTamano, formatearFecha,
  mostrarSnackbar, solicitarFirma, verificarSolicitud,
} from './app.js';

const EVENTOS = {
  PENDIENTE: 'Solicitud creada',
  EN_PROCESO: 'Firma iniciada',
  FIRMADA: 'Firmada',
  RECHAZADA: 'Rechazada en el teléfono',
};

const id = new URLSearchParams(location.search).get('id');
const contenido = document.querySelector('#contenido');
const aviso = document.querySelector('#aviso');
const firmas = document.querySelector('#firmas');
const plantilla = document.querySelector('#tarjeta-firma');
const botonFirmar = document.querySelector('#firmar');
const hoja = document.querySelector('#hoja');

let documento = null;

requerirSesion();
document.querySelector('#actualizar').addEventListener('click', actualizar);

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = !texto;
}

// FC-07: titular, emisor y fecha salen de lo que el servicio extrae del PDF firmado.
function crearTarjeta(firma) {
  const tarjeta = plantilla.content.cloneNode(true);
  tarjeta.querySelector('.firma-titular').textContent = firma.titular;
  tarjeta.querySelector('.firma-emisor').textContent = firma.emisor;
  tarjeta.querySelector('.firma-fecha').textContent = formatearFecha(firma.fechaDeclarada);
  tarjeta.querySelector('.firma-nota').hidden =
    !String(firma.emisor ?? '').toLowerCase().includes('laboratorio');
  return tarjeta;
}

// FC-09: hora con segundos, útil para registrar los casos de prueba.
function crearEvento({ estado, hora }) {
  const evento = document.createElement('li');
  const momento = document.createElement('time');
  momento.dateTime = hora;
  momento.textContent = new Date(hora).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'medium' });
  evento.append(EVENTOS[estado], momento);
  return evento;
}

async function cargar() {
  contenido.hidden = true;
  mostrarAviso('Cargando documento…');
  try {
    documento = await api(`/documentos/${encodeURIComponent(id)}`);
  } catch {
    mostrarAviso('No se pudo cargar el documento. Intenta actualizar.');
    return;
  }
  document.querySelector('#nombre').textContent = documento.nombre;
  mostrarEstado(document.querySelector('#estado'), documento.estado, documento.firmas.length);
  document.querySelector('#tamano').textContent = formatearTamano(documento.tamano);
  document.querySelector('#subido-por').textContent = documento.subidoPor;
  document.querySelector('#subido-en').textContent = formatearFecha(documento.subidoEn);
  document.querySelector('#sha256').textContent = documento.sha256;
  // FC-08: la versión actual, que el servicio reemplaza con cada firma.
  document.querySelector('#descargar').href = urlApi(`/documentos/${encodeURIComponent(id)}/archivo`);
  firmas.replaceChildren(...documento.firmas.map(crearTarjeta));
  document.querySelector('#sin-firmas').hidden = documento.firmas.length > 0;
  const { solicitudActual } = documento;
  document.querySelector('#solicitud').hidden = !solicitudActual;
  if (solicitudActual) {
    document.querySelector('#solicitado-por').textContent = solicitudActual.solicitadoPor;
    document.querySelector('#eventos').replaceChildren(...solicitudActual.eventos.map(crearEvento));
  }
  mostrarAviso('');
  contenido.hidden = false;
}

botonFirmar.addEventListener('click', async () => {
  botonFirmar.disabled = true;
  try {
    const resultado = await solicitarFirma(documento);
    if (resultado === 'FIRMADA') await actualizar();
  } catch {
    mostrarSnackbar('No se pudo completar la firma.');
  } finally {
    botonFirmar.disabled = false;
  }
});

document.querySelector('#cancelar').addEventListener('click', () => {
  hoja.close();
  cargar();
});

async function actualizar() {
  if (hoja.open) hoja.close();
  let resultado = null;
  try {
    resultado = await verificarSolicitud();
  } catch {
    mostrarSnackbar('No se pudo consultar el estado de la firma.');
  }
  await cargar();
  if (resultado?.estado === 'RECHAZADA') mostrarSnackbar('Firma rechazada.');
  if (resultado?.estado === 'FIRMADA' && documento?.firmas.length) {
    mostrarSnackbar(`Firmado por ${documento.firmas.at(-1).titular}`);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') actualizar();
});

actualizar();
