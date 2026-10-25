# Especificaciones técnicas — Firmador cliente

**Versión:** 0.4 · **Estado:** listo para implementar · **Prioridad:** P2 · **Trazabilidad:** requisito RF07 y criterio V5 de la monografía (apartados 3.2.2 y 3.2.6).

## 1. Alcance

Web _mobile-first_ que simula un **sistema de gestión documental interno** con lo mínimo para las pruebas: ingreso simulado, lista de documentos, carga de PDF, solicitud de firma al teléfono y detalle de las firmas. El frontend y el backend corren en un equipo (la laptop o un servidor con dominio) y el flujo se hace en un solo teléfono Android con Chrome y `firmador-movil`, que llegan a ellos por IP o dominio.

No firma, no maneja claves y no emite certificados. La identidad del firmante la da el certificado del teléfono, no la sesión web.

**Simplificación declarada:** se implementan solo los casos ideales. Sin validaciones de entrada ni manejo detallado de errores; un fallo se muestra con un mensaje genérico. Las validaciones quedan como mejora si sobra tiempo.

## 2. Arquitectura

```mermaid
flowchart LR
    C[firmador-cliente<br/>frontend] -- API REST --> S[firmador-servicio<br/>backend]
    C -- Intent URI firmar/id --> M[firmador-movil]
    M -- inicia, descarga y entrega por ID --> S
```

- El frontend se ejecuta en Chrome del teléfono y consume la API de `firmador-servicio`. Los PDF los guarda y los entrega el servicio.
- **Ingreso simulado:** usuarios fijos de demostración. El usuario de la sesión se envía al servicio para registrar quién sube y quién solicita. No es un control de seguridad.
- **Estado de la firma:** el enlace solo abre la app y no devuelve nada a la web, a diferencia del servicio local de Jacobitus Escritorio, que responde con el PDF firmado. El resultado llega por `firmador-servicio`: al terminar, la app se cierra y Android vuelve a Chrome; la web consulta entonces el estado una vez. Un botón **Actualizar** permite repetir la consulta.
- **Datos de la firma:** los extrae `firmador-servicio` del PDF firmado; la web solo los muestra.

## 3. Vistas

| Vista      | Contenido                                                                 | Acciones                                    |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| Ingreso    | Nombre del sistema, aviso «entorno de demostración», usuario y contraseña | Ingresar                                    |
| Documentos | Lista: nombre, tamaño, fecha, subido por, estado y último firmante        | Subir PDF, seleccionar uno, Firmar, Detalle |
| Detalle    | Metadatos y SHA-256, firmas aplicadas, eventos de la solicitud            | Firmar, descargar                           |

**Interacción (Material Design 3):**

- Barra superior con el título, el usuario, **Actualizar** y un botón para salir.
- FAB extendido «Subir PDF», que abre el selector de archivos del teléfono filtrado a PDF.
- Tocar una fila la selecciona (una a la vez) y aparece una barra inferior con **Firmar** y **Ver detalle**.
- **Firmar** crea la solicitud y abre una hoja inferior con nombre, SHA-256 abreviado y el botón **Abrir firmador**. Son dos toques a propósito: la app se abre con un gesto directo del usuario y no después de una espera de red, que Chrome puede bloquear.
- Estado de la fila como _chip_: `Sin firma`, `Firma en curso`, `Firmado (n)`, `Rechazada`.
- Al detectarse una firma nueva, la fila se resalta unos segundos y aparece un _snackbar_ «Firmado por {titular}». La fila conserva un ícono de sello y el texto «{titular} · {fecha}».
- En el detalle, cada firma es una tarjeta con titular, emisor, fecha declarada y la nota «Certificado de CA de laboratorio, no reconocido por validadores oficiales». Nunca se muestra «Firma válida».

## 4. Requisitos

| ID    | Requisito                                                                | Prioridad | Verificación                      |
| ----- | ------------------------------------------------------------------------ | --------- | --------------------------------- |
| FC-01 | Ingresar con un usuario de demostración                                  | P2        | Prueba en el S23 Ultra            |
| FC-02 | Listar los documentos con su estado de firma                             | P2        | Prueba en el S23 Ultra            |
| FC-03 | Subir un PDF                                                             | P2        | Documento nuevo en la lista       |
| FC-04 | Seleccionar un documento y abrir la app con un botón que toca el usuario | P2        | Apertura verificada               |
| FC-05 | Detectar el resultado al volver al navegador                             | P2        | Prueba web → app → web            |
| FC-06 | Marcar el documento firmado con titular y fecha                          | P2        | Comparación con el certificado    |
| FC-07 | Mostrar el detalle de cada firma                                         | P2        | Comparación con validador externo |
| FC-08 | Descargar la versión actual del documento                                | P2        | Archivo abierto en el teléfono    |
| FC-09 | Mostrar los eventos de la solicitud con su hora                          | P3        | Registro de un caso completo      |
| FC-10 | Validaciones y mensajes de error específicos                             | P3        | Casos inválidos                   |

P3 se implementa solo con P2 cerrado y si hay tiempo.

## 5. Reglas

- 📱 _Mobile-first_: diseñar a 360 px, objetivos táctiles de 48 px, contraste legible, tema claro y oscuro según el sistema.
- 🚫 Sin apertura automática de la app ni ventanas emergentes; sin tokens en el navegador.
- 🔁 Al volver, consultar el estado; nunca asumir que la firma se completó.
- 🧾 La fecha mostrada es la **declarada por el firmante** (PAdES B-B, sin sello de tiempo) y se rotula así.
- 👤 «Subido por» y «solicitado por» vienen de la sesión simulada; «firmado por» viene solo del certificado.

## 6. Evaluación

Registrar por caso: versión de Chrome y de Android, documento, resultado y horas de creación de la solicitud, inicio en el móvil y resultado. Aporta evidencia descriptiva a RF07 y V5. No afirmar facilidad de uso ni ahorro de tiempo: no hay pruebas con usuarios (monografía, apartado 1.5.2).

## 7. Fuera de alcance

Autenticación real, validaciones, casos de error, firma en el navegador, firma visible, firma por lotes, vista previa del PDF, flujo desde computadora con código QR y producción.
