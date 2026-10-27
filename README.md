# Proyecto 03: aplicación multicontenedor con Docker Compose

Aplicación demostrativa de infraestructura computacional. Un panel web en Node.js consulta un servicio Flask; Flask registra cada procesamiento en Redis, y los resultados permanecen guardados en un volumen de Docker.

## Arquitectura

| Servicio | Tecnología | Función | Puerto en el equipo |
| --- | --- | --- | --- |
| `node` | Node.js 20, Express | Interfaz web y solicitudes al servicio Python | `3000` |
| `python` | Python 3.12, Flask y Gunicorn | Procesamiento, API y comprobación de salud | `5000` |
| `redis` | Redis 7 | Contador y fecha de la última ejecución | Solo red interna |

Los tres contenedores se conectan a la red `proyecto_red`. Redis guarda sus datos en el volumen persistente `redis_data`. Compose espera a que Redis y Python estén saludables antes de iniciar el servicio que depende de cada uno.

## Requisitos

- Docker Desktop instalado y en ejecución.
- Docker Compose v2 (`docker compose`).
- Conexión a Internet la primera vez para descargar imágenes base y dependencias.

## Ejecutar y comprobar

Desde PowerShell, abre esta carpeta y ejecuta:

```powershell
docker compose config
docker compose up --build -d
docker compose ps
```

Abre [http://localhost:3000](http://localhost:3000), pulsa **Procesar nuevos datos** y confirma que aumenta el contador. También puedes verificar la API directamente:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/resultados
Invoke-RestMethod -Method Post http://localhost:5000/procesar
Invoke-RestMethod http://localhost:5000/resultados
```

Consulta los registros si algún servicio no llega al estado saludable:

```powershell
docker compose logs --tail 100 node python redis
```

Para detener los contenedores sin borrar los resultados:

```powershell
docker compose down
```

Los datos se conservan en `redis_data`. Para borrar también ese volumen y reiniciar el contador, ejecuta `docker compose down --volumes`; esta acción elimina permanentemente los datos guardados.

## Rutas

### Servicio Python (`http://localhost:5000`)

- `GET /`: página informativa.
- `GET /health`: comprueba la conexión a Redis; responde `503` si Redis no está disponible.
- `GET /resultados`: devuelve el contador y la fecha de la última ejecución.
- `POST /procesar`: registra un procesamiento y devuelve el resultado en JSON.

### Aplicación Node.js (`http://localhost:3000`)

- `GET /`: panel actualizado con los resultados persistidos.
- `GET /health`: comprobación de salud de la aplicación.
- `POST /procesar`: solicita un procesamiento a Python y vuelve al panel.

## Publicar imágenes en Docker Hub

Las imágenes de aplicación quedan construidas localmente como `proyecto-python:1.0.0` y `proyecto-node:1.0.0`. Reemplaza `tu_usuario` por tu nombre de usuario de Docker Hub:

```powershell
docker login
$env:DOCKERHUB_USERNAME = "tu_usuario"
docker tag proyecto-python:1.0.0 "$env:DOCKERHUB_USERNAME/proyecto-python:1.0.0"
docker tag proyecto-node:1.0.0 "$env:DOCKERHUB_USERNAME/proyecto-node:1.0.0"
docker push "$env:DOCKERHUB_USERNAME/proyecto-python:1.0.0"
docker push "$env:DOCKERHUB_USERNAME/proyecto-node:1.0.0"
```

En Docker Hub, confirma que ambos repositorios sean visibles como públicos si así lo solicita la entrega. No guardes contraseñas ni tokens en los archivos del proyecto.

Para ejecutar Compose en otro equipo usando esas imágenes, cambia los valores `image` de `python` y `node` en `docker-compose.yml` a `tu_usuario/proyecto-python:1.0.0` y `tu_usuario/proyecto-node:1.0.0`, respectivamente, y sustituye `build` por `image` en cada servicio. Después, comparte el archivo actualizado junto con los enlaces a ambos repositorios.

## Publicar el proyecto en GitHub

1. Crea en GitHub un repositorio público vacío (sin README ni licencia precreados).
2. Desde esta carpeta, inicializa Git, registra los archivos del proyecto y publica la rama principal. Sustituye `USUARIO` y `REPOSITORIO` por los valores reales:

```powershell
git init
git add README.md .dockerignore .gitignore docker-compose.yml node-app python-app
git status
git commit -m "Completa aplicación multicontenedor Docker"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

3. Revisa el repositorio público y comparte su enlace junto con los enlaces de las imágenes Docker Hub.

El instructivo PDF se conserva localmente, pero no se incluye en el comando `git add` de ejemplo.

## Criterios de entrega cubiertos

- Archivo `docker-compose.yml` con sintaxis y servicios declarados.
- Tres servicios coordinados: Python, Node.js y Redis.
- Imágenes de aplicación construibles, etiquetables y publicables en Docker Hub.
- Volumen persistente para Redis, puertos publicados para las aplicaciones y red dedicada.
- Comprobaciones de salud y dependencias con orden de inicio.
- Pasos documentados para ejecutar, verificar y publicar el proyecto.
