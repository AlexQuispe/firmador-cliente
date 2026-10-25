import {
  requerirSesion, api, urlApi, mostrarEstado, formatearTamano, formatearFecha,
  mostrarSnackbar, solicitarFirma, verificarSolicitud,
} from './app.js';

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
  return tarjeta;
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
  mostrarAviso('');
  contenido.hidden = false;
}

botonFirmar.addEventListener('click', async () => {
  botonFirmar.disabled = true;
  try {
    await solicitarFirma(documento);
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
