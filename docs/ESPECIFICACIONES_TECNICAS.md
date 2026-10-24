# Especificaciones técnicas — Firmador cliente

**Versión:** 0.2 · **Estado:** borrador de diseño · **Prioridad:** P2 · **Trazabilidad:** requisito RF07 de la monografía (apartado 3.2.2).

## 1. Alcance

Web _responsive_ que consume `firmador-servicio`. Todo el flujo debe poder hacerse en un solo teléfono Android con el navegador y la app instalados. No ejecuta criptografía con claves privadas.

## 2. Vistas

| Vista     | Contenido                        | Acción                 |
| --------- | -------------------------------- | ---------------------- |
| Inicio    | Qué hace el flujo                | Seleccionar PDF        |
| Solicitud | Nombre, tamaño, SHA-256          | Solicitar firma        |
| Pendiente | ID abreviado, estado, expiración | Abrir firmador móvil   |
| Resultado | Estado final y metadatos         | Descargar o reintentar |

## 3. Requisitos

| ID    | Requisito                                               | Verificación              |
| ----- | ------------------------------------------------------- | ------------------------- |
| FC-01 | Seleccionar un PDF desde el navegador móvil             | Prueba en el S23 Ultra    |
| FC-02 | Validar extensión, tamaño y errores del servidor        | Casos válidos e inválidos |
| FC-03 | Crear la solicitud con el token del cliente             | Respuesta con ID          |
| FC-04 | Abrir la app solo con un botón que toca el usuario      | Apertura verificada       |
| FC-05 | Conservar el ID al cambiar de app y recuperar el estado | Prueba web → app → web    |
| FC-06 | Consultar el estado con intervalo limitado              | Prueba de polling         |
| FC-07 | Descargar el PDF firmado                                | Prueba extremo a extremo  |
| FC-08 | Manejar rechazo, expiración y ausencia de la app        | Pruebas negativas         |

## 4. Reglas

- 📱 Diseño táctil, contraste legible y mensajes de error claros.
- 🚫 Sin apertura automática ni ventanas emergentes; sin tokens en URLs ni en `localStorage`.
- 🔁 Al volver, consultar el estado; nunca asumir que la firma se completó.
- 🔗 Sin App Link verificado se usa un deep link, declarado como provisional.

## 5. Evaluación

Registrar por caso: versión del navegador y de Android, resultado y tiempo desde la selección hasta la descarga. No afirmar facilidad de uso ni ahorro de tiempo: no hay pruebas con usuarios (monografía, apartado 1.5.2).

## 6. Fuera de alcance

Firma en el navegador, otro cliente nativo, emisión de certificados y producción.
