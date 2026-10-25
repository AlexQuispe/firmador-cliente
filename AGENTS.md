# AGENTS.md — firmador-cliente

Web _mobile-first_ en HTML, CSS y JavaScript sin framework, de prueba de concepto académica: simula un sistema de gestión documental interno que pide firmas de PDF a `firmador-movil` a través de `firmador-servicio`. No firma ni maneja claves.

## Fuente de verdad

- Requisitos FC-xx, vistas y reglas: `docs/ESPECIFICACIONES_TECNICAS.md`. Léela por secciones según la tarea; no la copies aquí ni la reformules en el código.
- API: `../firmador-servicio/docs/ESPECIFICACIONES_TECNICAS.md`. Si falta algo, se agrega primero allí; no inventes endpoints ni campos.
- Lado móvil (enlace, FM-13): `../firmador-movil/docs/ESPECIFICACIONES_TECNICAS.md`, §6.
- Contexto de la monografía: `../../AGENTS.md`, `../../docs/prueba_de_concepto.md`, `../../docs/indicadores.md`. Consúltalos solo si la tarea toca evaluación o redacción.

## Prioridad y orden

Todo el repositorio es P2 (iteración I5, RF07). Orden: ingreso (FC-01) → lista y carga (FC-02, FC-03) → firma y estado (FC-04 a FC-06) → detalle y descargas (FC-07, FC-08). P3 (FC-09, FC-10) solo con P2 cerrado. Si el tiempo no alcanza, lo pendiente se informa como no evaluado (riesgo R5).

## ▶️ Uso

No hay que instalar ni compilar nada. Con `firmador-servicio` en marcha en el puerto 3000 del mismo equipo:

```sh
docker build -t firmador-cliente .
docker run -d --name firmador-cliente -p 8080:80 --env-file .env firmador-cliente
```

y abrir `http://<IP-del-equipo>:8080` en Chrome del teléfono, conectado a la misma red. La URL de la API se define en `.env` (`API_URL`). Detalle en el [manual de instalación](INSTALL.md).

## Reglas no negociables

- HTML, CSS y JavaScript moderno (módulos ES, `fetch`) sin framework, sin _bundler_ y sin dependencias. Fuentes Roboto y Material Symbols desde Google Fonts.
- Solo casos ideales: sin validaciones ni ramas de error elaboradas mientras P2 no esté cerrado; un fallo muestra un mensaje genérico.
- La app móvil se abre solo con un botón que toca el usuario.
- Al volver del teléfono, consultar el estado; nunca asumir el resultado.
- Titular y fecha de una firma salen de lo que informa el servicio a partir del PDF, nunca de la sesión. Nunca mostrar «Firma válida»: el certificado es de laboratorio.
- El ingreso es simulado y se rotula como entorno de demostración.

## Evidencia

Cada ejecución de prueba se registra en `../../evidencias/I5_<nombre>/` con los campos de la §6 de la especificación. Ejecuciones previas a la definición de indicadores son de desarrollo, no resultados. No afirmar en código, commits ni docs facilidad de uso, ahorro de tiempo, validez legal ni compatibilidad institucional.

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
