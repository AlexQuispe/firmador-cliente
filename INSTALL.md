# 🛠️ Manual de instalación

## 📋 Requerimientos

- Docker ^24.
- `firmador-servicio` en marcha (puerto 3000), con `ORIGEN_CLIENTE` igual a la dirección de esta web (p. ej. `http://192.168.1.10:8080`).
- Teléfono Android con Chrome y `firmador-movil`, en la misma red que el equipo.

## ⚙️ Configuración

```sh
cp public/js/config.js.sample public/js/config.js
```

Editar `API_URL` en `public/js/config.js` con la URL de la API (p. ej. `http://192.168.1.10:3000`).

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
