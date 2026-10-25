// Lo común a todas las vistas.
export { API_URL } from './config.js';

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
