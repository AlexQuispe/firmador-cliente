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

// Llama a firmador-servicio; el usuario de la sesión va en X-Usuario.
export async function api(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}/api${ruta}`, {
    ...opciones,
    headers: { 'X-Usuario': usuarioActual(), ...opciones.headers },
  });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

export function formatearTamano(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}
