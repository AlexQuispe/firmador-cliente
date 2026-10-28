// Lo común a todas las vistas.
import { API_URL, JACOBITUS_URL } from './config.js';
const hojaFirma = document.querySelector('#hoja');
let resolverFirmaEscritorio = null;
let documentoEscritorio = null;
let certificadosEscritorio = [];
let certificadosCargados = false;
let firmaEscritorioEnCurso = false;

// Ingreso simulado (FC-01): usuarios fijos de demostración, no es un control de seguridad.
export const USUARIOS = ['operador', 'revisor'];
export const CLAVE_DEMO = 'demo';

export function usuarioActual() {
  return localStorage.getItem('usuario');
}

export function iniciarSesion(usuario) {
  localStorage.setItem('usuario', usuario);
}

export function cerrarSesion() {
  localStorage.removeItem('usuario');
  location.href = './';
}

// Para las vistas internas: vuelve al ingreso si no hay sesión.
export function requerirSesion() {
  const usuario = usuarioActual();
  if (!usuario) location.replace('./');
  return usuario;
}

export function urlApi(ruta) {
  const base = new URL(API_URL);
  if (location.hostname === 'localhost') {
    base.hostname = 'localhost';
  }
  return `${base.origin}/api${ruta}`;
}

// Llama a firmador-servicio; el usuario de la sesión va en X-Usuario.
export async function api(ruta, opciones = {}) {
  const respuesta = await fetch(urlApi(ruta), {
    ...opciones,
    headers: { 'X-Usuario': usuarioActual(), ...opciones.headers },
  });
  if (!respuesta.ok) throw Object.assign(new Error(`HTTP ${respuesta.status}`), { status: respuesta.status });
  return respuesta.json();
}

// Texto e ícono de Material Symbols de cada estado.
const ESTADOS = {
  SIN_FIRMA: ['Sin firma', 'draft'],
  EN_CURSO: ['Firma en curso', 'hourglass_top'],
  FIRMADO: ['Firmado', 'approval'],
  RECHAZADA: ['Rechazada', 'block'],
};

export function mostrarEstado(chip, estado, cantidadFirmas) {
  const [texto, nombreIcono] = ESTADOS[estado];
  const icono = document.createElement('span');
  icono.className = 'material-symbols-outlined';
  icono.ariaHidden = 'true';
  icono.textContent = nombreIcono;
  chip.dataset.estado = estado;
  chip.replaceChildren(icono, estado === 'FIRMADO' ? `${texto} (${cantidadFirmas})` : texto);
}

export function formatearTamano(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

export function mostrarSnackbar(texto) {
  const snackbar = document.querySelector('#snackbar');
  snackbar.textContent = texto;
  snackbar.hidden = false;
  setTimeout(() => { snackbar.hidden = true; }, 4000);
}

// FC-04: en Android, el Intent URI solo abre la app y depende de un toque directo del usuario.
async function solicitarFirmaMovil(documento) {
  const solicitud = await api(`/documentos/${encodeURIComponent(documento.id)}/solicitudes`, { method: 'POST' });
  localStorage.setItem('solicitud', JSON.stringify({ id: solicitud.id, documentoId: documento.id }));
  const { sha256Documento } = solicitud;
  document.querySelector('#hoja-nombre').textContent = documento.nombre;
  document.querySelector('#hoja-datos').textContent =
    `${formatearTamano(documento.tamano)} · subido por ${documento.subidoPor}`;
  document.querySelector('#hoja-sha256').textContent = `${sha256Documento.slice(0, 8)}…${sha256Documento.slice(-8)}`;
  document.querySelector('#abrir-firmador').href = solicitud.enlaceAplicacion;
  document.querySelector('#nota-movil').hidden = false;
  document.querySelector('#abrir-firmador').hidden = false;
  document.querySelector('#formulario-jacobitus').hidden = true;
  document.querySelector('#hoja-titulo').textContent = 'Firmar documento';
  document.querySelector('#hoja-hash').hidden = false;
  hojaFirma.showModal();
}

async function apiJacobitus(ruta, opciones = {}) {
  const encabezados = opciones.body ? { 'Content-Type': 'application/json' } : {};
  const respuesta = await fetch(`${JACOBITUS_URL}${ruta}`, {
    ...opciones,
    headers: { ...encabezados, ...opciones.headers },
  });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

function mostrarDatosHoja(documento, sha256, abreviar) {
  document.querySelector('#hoja-nombre').textContent = documento.nombre;
  document.querySelector('#hoja-datos').textContent =
    `${formatearTamano(documento.tamano)} · subido por ${documento.subidoPor}`;
  document.querySelector('#hoja-sha256').textContent = abreviar
    ? `${sha256.slice(0, 8)}…${sha256.slice(-8)}`
    : sha256;
  document.querySelector('#hoja-hash').hidden = false;
}

async function prepararFirmaEscritorio(documento) {
  if (!window.isSecureContext) {
    mostrarSnackbar('Abre esta página desde localhost o mediante HTTPS para firmar en escritorio.');
    return null;
  }

  mostrarSnackbar('Conectando con Jacobitus Escritorio…');
  const [conexion, detalle] = await Promise.all([
    apiJacobitus('/api/token/connected'),
    api(`/documentos/${encodeURIComponent(documento.id)}`),
  ]);
  const tokens = conexion.datos?.tokens ?? [];
  if (!conexion.finalizado || !conexion.datos?.connected || !tokens.length) throw new Error('Sin token');

  mostrarDatosHoja(documento, detalle.sha256, false);
  document.querySelector('#hoja-titulo').textContent = 'Firmar con Jacobitus Escritorio';
  document.querySelector('#nota-movil').hidden = true;
  document.querySelector('#abrir-firmador').hidden = true;
  document.querySelector('#formulario-jacobitus').hidden = false;

  const selectorToken = document.querySelector('#jacobitus-token');
  selectorToken.replaceChildren(...tokens.map((token) => {
    const opcion = document.createElement('option');
    opcion.value = token.slot;
    opcion.textContent = [token.model, token.name].filter(Boolean).join(' · ') || `Token ${token.slot}`;
    return opcion;
  }));
  document.querySelector('#jacobitus-pin').value = '';
  document.querySelector('#jacobitus-token').disabled = false;
  document.querySelector('#jacobitus-pin').disabled = false;
  document.querySelector('#campo-certificado').hidden = true;
  document.querySelector('#jacobitus-certificado').replaceChildren();
  document.querySelector('#jacobitus-certificado').disabled = false;
  document.querySelector('#firmar-jacobitus').textContent = 'Cargar certificados';

  documentoEscritorio = documento;
  certificadosEscritorio = [];
  certificadosCargados = false;
  hojaFirma.showModal();
  return new Promise((resolver) => { resolverFirmaEscritorio = resolver; });
}

async function cargarCertificadosEscritorio() {
  const respuesta = await apiJacobitus('/api/token/data', {
    method: 'POST',
    body: JSON.stringify({
      slot: Number(document.querySelector('#jacobitus-token').value),
      pin: document.querySelector('#jacobitus-pin').value,
    }),
  });
  certificadosEscritorio = (respuesta.datos?.data_token?.data ?? [])
    .filter((certificado) => certificado.tipo === 'X509_CERTIFICATE' && (certificado.alias || certificado.id));
  if (!respuesta.finalizado || !certificadosEscritorio.length) throw new Error('Sin certificados');

  const selectorCertificado = document.querySelector('#jacobitus-certificado');
  selectorCertificado.replaceChildren(...certificadosEscritorio.map((certificado) => {
    const opcion = document.createElement('option');
    opcion.value = certificado.alias || certificado.id;
    const titular = certificado.titular?.CN;
    const emisor = certificado.emisor?.CN;
    opcion.textContent = [titular, emisor].filter(Boolean).join(' · ') || opcion.value;
    return opcion;
  }));
  document.querySelector('#campo-certificado').hidden = false;
  document.querySelector('#firmar-jacobitus').textContent = 'Firmar con Jacobitus';
  certificadosCargados = true;
}

document.querySelector('#jacobitus-token')?.addEventListener('change', () => {
  certificadosEscritorio = [];
  certificadosCargados = false;
  document.querySelector('#campo-certificado').hidden = true;
  document.querySelector('#jacobitus-certificado').replaceChildren();
  document.querySelector('#firmar-jacobitus').textContent = 'Cargar certificados';
});

function blobABase64(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result.split(',')[1]);
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(blob);
  });
}

function base64ABytes(base64) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let indice = 0; indice < binario.length; indice += 1) bytes[indice] = binario.charCodeAt(indice);
  return bytes;
}

async function firmarConJacobitus() {
  const documento = documentoEscritorio;
  const slot = Number(document.querySelector('#jacobitus-token').value);
  const pin = document.querySelector('#jacobitus-pin').value;
  const alias = document.querySelector('#jacobitus-certificado').value;
  const solicitud = await api(`/documentos/${encodeURIComponent(documento.id)}/solicitudes`, { method: 'POST' });
  localStorage.setItem('solicitud', JSON.stringify({ id: solicitud.id, documentoId: documento.id }));
  await api(`/solicitudes/${encodeURIComponent(solicitud.id)}/iniciar`, { method: 'POST' });

  const respuestaPdf = await fetch(urlApi(`/solicitudes/${encodeURIComponent(solicitud.id)}/documento`), {
    headers: { 'X-Usuario': usuarioActual() },
  });
  if (!respuestaPdf.ok) throw new Error(`HTTP ${respuestaPdf.status}`);
  const pdf = await blobABase64(await respuestaPdf.blob());
  const resultadoJacobitus = await apiJacobitus('/api/token/firmar_pdf', {
    method: 'POST',
    body: JSON.stringify({ slot, pin, alias, pdf }),
  });
  if (!resultadoJacobitus.finalizado || !resultadoJacobitus.datos?.pdf_firmado) throw new Error('Sin PDF firmado');

  const respuestaResultado = await fetch(urlApi(`/solicitudes/${encodeURIComponent(solicitud.id)}/resultado`), {
    method: 'POST',
    headers: { 'X-Usuario': usuarioActual(), 'Content-Type': 'application/pdf' },
    body: base64ABytes(resultadoJacobitus.datos.pdf_firmado),
  });
  if (!respuestaResultado.ok) throw new Error(`HTTP ${respuestaResultado.status}`);

  const resolver = resolverFirmaEscritorio;
  resolverFirmaEscritorio = null;
  document.querySelector('#jacobitus-pin').value = '';
  hojaFirma.close();
  resolver?.('FIRMADA');
}

document.querySelector('#firmar-jacobitus')?.addEventListener('click', async (evento) => {
  const boton = evento.currentTarget;
  boton.disabled = true;
  try {
    if (certificadosCargados) {
      firmaEscritorioEnCurso = true;
      document.querySelector('#cancelar').disabled = true;
      document.querySelector('#jacobitus-token').disabled = true;
      document.querySelector('#jacobitus-pin').disabled = true;
      document.querySelector('#jacobitus-certificado').disabled = true;
      boton.textContent = 'Firmando…';
      await firmarConJacobitus();
    } else {
      await cargarCertificadosEscritorio();
    }
  } catch {
    document.querySelector('#jacobitus-pin').value = '';
    mostrarSnackbar('No se pudo completar la firma con Jacobitus Escritorio.');
  } finally {
    firmaEscritorioEnCurso = false;
    document.querySelector('#cancelar').disabled = false;
    if (hojaFirma.open) {
      document.querySelector('#jacobitus-token').disabled = false;
      document.querySelector('#jacobitus-pin').disabled = false;
      document.querySelector('#jacobitus-certificado').disabled = false;
      boton.disabled = false;
      boton.textContent = certificadosCargados ? 'Firmar con Jacobitus' : 'Cargar certificados';
    }
  }
});

hojaFirma?.addEventListener('close', () => {
  document.querySelector('#jacobitus-pin').value = '';
  document.querySelector('#cancelar').disabled = false;
  document.querySelector('#jacobitus-token').disabled = false;
  document.querySelector('#jacobitus-pin').disabled = false;
  document.querySelector('#jacobitus-certificado').disabled = false;
  firmaEscritorioEnCurso = false;
  if (resolverFirmaEscritorio) {
    const resolver = resolverFirmaEscritorio;
    resolverFirmaEscritorio = null;
    resolver(null);
  }
  documentoEscritorio = null;
  certificadosEscritorio = [];
  certificadosCargados = false;
});

hojaFirma?.addEventListener('cancel', (evento) => {
  if (firmaEscritorioEnCurso) evento.preventDefault();
});

// FC-04 y FC-11: Android abre Firmador Móvil con un toque directo; escritorio usa la API local.
export async function solicitarFirma(documento) {
  if (/Android/i.test(navigator.userAgent)) {
    await solicitarFirmaMovil(documento);
    return 'MOVIL';
  }

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    mostrarSnackbar('Firmador Móvil está disponible solo en Android.');
    return null;
  }
  return prepararFirmaEscritorio(documento);
}

// FC-05: al volver de la app se consulta el estado; nunca se asume el resultado.
// Devuelve el resultado solo cuando la solicitud terminó.
export async function verificarSolicitud() {
  const pendiente = JSON.parse(localStorage.getItem('solicitud'));
  if (!pendiente) return null;
  let solicitud;
  try {
    solicitud = await api(`/solicitudes/${encodeURIComponent(pendiente.id)}`);
  } catch (error) {
    // La solicitud ya no existe en el servicio: se descarta sin aviso.
    if (error.status === 404) {
      localStorage.removeItem('solicitud');
      return null;
    }
    throw error;
  }
  if (solicitud.estado !== 'FIRMADA' && solicitud.estado !== 'RECHAZADA') return null;
  localStorage.removeItem('solicitud');
  return { documentoId: pendiente.documentoId, estado: solicitud.estado };
}
