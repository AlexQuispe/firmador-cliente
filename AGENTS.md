# AGENTS.md — firmador-cliente

Web _mobile-first_ en HTML, CSS y JavaScript sin framework, de prueba de concepto académica: simula un sistema de gestión documental interno que pide firmas de PDF a `firmador-movil` a través de `firmador-servicio`. No firma ni maneja claves.

## ▶️ Uso

No hay que instalar ni compilar nada. Con `firmador-servicio` en marcha en el puerto 3000 del mismo equipo:

```sh
docker build -t firmador-cliente .
docker run -d --name firmador-cliente -p 8080:80 firmador-cliente
```

y abrir `http://<IP-del-equipo>:8080` en Chrome del teléfono, conectado a la misma red. La URL de la API (`API_URL`) y la de Jacobitus (`JACOBITUS_URL`) se definen en `public/js/config.js`, copiado de `config.js.sample`. Detalle en el [manual de instalación](INSTALL.md).

## Reglas no negociables

- HTML, CSS y JavaScript moderno (módulos ES, `fetch`) sin framework, sin _bundler_ y sin dependencias. Fuentes Roboto y Material Symbols desde Google Fonts.
- Solo casos ideales: sin validaciones ni ramas de error elaboradas mientras P2 no esté cerrado; un fallo muestra un mensaje genérico.
- La app móvil se abre solo con un botón que toca el usuario.
- Al volver del teléfono, consultar el estado; nunca asumir el resultado.
- Titular y fecha de una firma salen de lo que informa el servicio a partir del PDF, nunca de la sesión. Nunca mostrar «Firma válida»: el servicio solo extrae metadatos y no valida la firma ni la cadena de certificados. Mostrar el aviso de laboratorio solo cuando el emisor extraído del certificado lo indique.
- El ingreso es simulado y se rotula como entorno de demostración.

## Forma de trabajo

- Git: el usuario gestiona _staging_ y commits. No ejecutes `git add/commit/mv/rm/stash/restore --staged`; usa `mv`/`rm`.
- Cambios mínimos y directos; indica qué FC-xx cubre cada cambio.
- Ante ambigüedad en un requisito, pregunta antes de implementar. No pidas confirmación para lo ya autorizado.
- Español en la comunicación, la interfaz y en nombres de archivos, funciones y variables; en inglés los términos de estándares y APIs (PAdES, SHA-256, `fetch`). Comentarios solo donde aporten.
- Código corto y legible: lo común en `app.js`, una página por vista, sin capas ni abstracciones que no se usen.
- README solo cambia si queda incorrecto o hace falta para usar la web; breve y fiel al código.

## Verificación y cierre

- Sin pruebas automatizadas. La verificación es el flujo completo en el teléfono.
- Al cerrar: qué cambió y dónde, cómo se verificó y limitaciones. No afirmes prueba visual ni ejecución en el teléfono que no ocurrieron.

## UX/UI

- Material 3 en CSS propio: variables para color, tipografía, forma y elevación en `:root`, con tema oscuro por `prefers-color-scheme`. Sin valores sueltos repetidos.
- _Mobile-first_: diseñar a 360 px y ampliar; objetivos táctiles de 48 px, foco visible y etiquetas accesibles.
- Cada vista muestra al menos los estados de carga, vacío y, en la firma, en curso, firmado y rechazado.
- Cambios visuales importantes: propuesta concreta (mockup si ayuda o se pide) antes de implementar; luego verifica en el teléfono.
- Antes de cerrar un cambio visual, pide revisión al revisor UX/UI de la sesión si existe; si no, dilo. Nunca inventes su aprobación.
- Sin imágenes ni adornos que no mejoren la experiencia.
