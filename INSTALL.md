# 🛠️ Manual de instalación

## 📋 Requerimientos

- Docker ^24.
- `firmador-servicio` en marcha, con `ORIGEN_CLIENTE` configurado para aceptar el origen exacto desde el que se abre la web.
- Teléfono Android con Chrome y `firmador-movil`, en la misma red que el equipo.
- Para firmar en escritorio: Jacobitus Escritorio instalado y abierto en esa misma computadora, con su certificado de servicio local instalado desde **Ayuda → Verificar servicio**.

## ⚙️ Configuración

```sh
cp public/js/config.js.sample public/js/config.js
```

Editar `API_URL` en `public/js/config.js` con el origen de la API (p. ej. `http://192.168.1.10:3000`) y `JACOBITUS_URL` con la dirección base del Jacobitus que se ejecuta en la computadora del usuario (por defecto `https://localhost:9000`). Al abrir la web desde `http://localhost:8080`, la aplicación cambia el host de `API_URL` a `localhost` y conserva su protocolo y puerto; en cualquier otro host, incluida la web de producción, usa `API_URL` sin cambiarlo.

En producción, configura `API_URL` con el origen HTTPS de la API, por ejemplo `https://api.ejemplo.bo`. Si la página y la API comparten dominio, el proxy debe enviar `/api` al servicio. Configura `ORIGEN_CLIENTE` en `firmador-servicio/.env` con el origen HTTPS exacto de la página, por ejemplo `https://firma.ejemplo.bo`. `JACOBITUS_URL` sigue apuntando al servicio local de la computadora que firma; no es el dominio de la web ni de la API.

## 🚀 Despliegue

```sh
docker build -t firmador-cliente .
docker run -d --name firmador-cliente -p 8080:80 firmador-cliente
```

Tras cualquier cambio en `public/`, recrear:

```sh
docker rm -f firmador-cliente
docker build -t firmador-cliente . && docker run -d --name firmador-cliente -p 8080:80 firmador-cliente
```

## ✅ Acceso y verificación

```sh
hostname -I | awk '{print $1}'               # IP del equipo
curl -I http://localhost:8080/               # debe responder 200
```

En Chrome del teléfono, abrir `http://<IP-del-equipo>:8080`. En Chrome de la computadora, abrir `http://localhost:8080` para que el navegador pueda solicitar permiso de acceso al servicio local de Jacobitus. Si se sirve la web por un dominio, debe usar HTTPS. La primera conexión de escritorio puede mostrar el permiso de Chrome para acceder a la red local; hay que permitirlo.
