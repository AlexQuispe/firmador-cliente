// Lo común a todas las vistas.
import { API_URL } from './config.js';

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
  return `${API_URL}/api${ruta}`;
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

const ESTADOS = {
  SIN_FIRMA: 'Sin firma',
  EN_CURSO: 'Firma en curso',
  FIRMADO: 'Firmado',
  RECHAZADA: 'Rechazada',
};

export function mostrarEstado(chip, estado, cantidadFirmas) {
  chip.dataset.estado = estado;
  chip.textContent = estado === 'FIRMADO' ? `${ESTADOS.FIRMADO} (${cantidadFirmas})` : ESTADOS[estado];
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

// FC-04: crea la solicitud y muestra la hoja con «Abrir firmador». Son dos toques
// porque Chrome puede bloquear la apertura si no sigue directamente a un gesto del usuario.
// El Intent URI solo abre la app en Android; fuera de él no se crea la solicitud.
export async function solicitarFirma(documento) {
  if (!/Android/i.test(navigator.userAgent)) {
    mostrarSnackbar('La firma se hace desde Chrome en el teléfono Android.');
    return;
  }
  const solicitud = await api(`/documentos/${encodeURIComponent(documento.id)}/solicitudes`, { method: 'POST' });
  localStorage.setItem('solicitud', JSON.stringify({ id: solicitud.id, documentoId: documento.id }));
  const { sha256Documento } = solicitud;
  document.querySelector('#hoja-nombre').textContent = documento.nombre;
  document.querySelector('#hoja-sha256').textContent = `${sha256Documento.slice(0, 8)}…${sha256Documento.slice(-8)}`;
  document.querySelector('#abrir-firmador').href = solicitud.enlaceAplicacion;
  document.querySelector('#hoja').showModal();
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
