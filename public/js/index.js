import { USUARIOS, CLAVE_DEMO, iniciarSesion } from './app.js';

const formulario = document.querySelector('#ingreso');
const mensaje = document.querySelector('#mensaje');

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const usuario = formulario.usuario.value.trim();
  if (!USUARIOS.includes(usuario) || formulario.clave.value !== CLAVE_DEMO) {
    mensaje.hidden = false;
    return;
  }
  iniciarSesion(usuario);
  location.href = 'documentos';
});
