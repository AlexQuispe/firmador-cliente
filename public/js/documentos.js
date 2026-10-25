import { requerirSesion, cerrarSesion } from './app.js';

document.querySelector('#usuario').textContent = requerirSesion();
document.querySelector('#salir').addEventListener('click', cerrarSesion);
