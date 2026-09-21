# Sistema de Monitoreo de Perifoneo — Tacna

## Guía completa de implementación

| | |
|---|---|
| Versión | 2.0 — incluye todas las decisiones acordadas |
| Fecha | Septiembre 2026 |
| Público | Equipo de desarrollo y responsable técnico de la campaña |

**Cómo leer este documento:** la Parte 1 da la visión general y todos deberían leerla. La Parte 2 es el paso a paso para poner en marcha la API, en orden, sin saltarse pasos. La Parte 3 es la especificación del panel web que falta construir. Las Partes 4 y 5 cubren los celulares y la puesta en producción.

---

# PARTE 1 — VISIÓN GENERAL

## 1.1 Qué problema resolvemos

La campaña tiene unos 60 perifoneadores recorriendo Tacna con parlantes. Cada uno tiene asignado un sector de la ciudad. Hoy no hay forma confiable de saber cuándo salieron, por dónde anduvieron y si trabajaron en su zona.

El sistema responde tres preguntas con evidencia, por persona y por día:

1. **¿Cuándo?** Hora de inicio y fin de cada recorrido. Si salió 4 veces en el día, 4 registros.
2. **¿Por dónde?** La ruta exacta sobre el mapa, reproducible en el tiempo.
3. **¿En su zona?** Minutos y kilómetros dentro y fuera del sector asignado.

## 1.2 Decisiones de negocio definitivas

Estas decisiones ya fueron tomadas y el código las respeta. No deben cambiarse sin consultar.

| Decisión | Qué significa en la práctica |
|---|---|
| **Sin horarios fijos** | El perifoneador sale cuando puede. No hay turnos ni cuota de horas. |
| **Sin veredicto automático** | El sistema no dice "válido" ni "inválido". Entrega datos objetivos y **el supervisor evalúa** en su informe. |
| **Sesiones automáticas** | Nadie presiona "iniciar jornada". El sistema detecta los recorridos por la continuidad de los puntos GPS. |
| **Medición por tramos** | Un desvío de 20 minutos resta 20 minutos del tiempo en sector; no anula el recorrido. |
| **Tolerancia de 50 m** | Compensa el error normal del GPS al circular por calles del borde del sector. |
| **Configuración centralizada** | El perifoneador solo instala la app y escanea un QR. Toda la configuración viene en el QR. |

## 1.3 Las tres piezas

```
 PIEZA 1: CAPTURA                PIEZA 2: CEREBRO              PIEZA 3: PANTALLA
 (ya funciona)                   (código listo)                (por construir)

┌────────────────┐           ┌─────────────────────┐        ┌──────────────────┐
│ Traccar Client │  GPS      │   API Perifoneo     │  JSON  │   Panel web      │
│ en el celular  ├──────┐    │   Node.js :3001     │◄───────┤   React          │
└────────────────┘      │    │                     │        │   Supervisores   │
                        ▼    │ • Detecta recorridos│        └──────────────────┘
               ┌─────────────┤ • Mide dentro/fuera │
               │ Traccar     │ • Calcula km, tiempo│
               │ Server:8082 │ • Login y permisos  │
               │ (geocercas) │                     │
               └──────┬──────┴──────────┬──────────┘
                      │                 │
               ┌──────▼─────────────────▼──────┐
               │          MySQL 8              │
               │  BD "traccar"  │ BD "perifoneo"│
               │  (NO TOCAR)    │ (nuestra)     │
               └───────────────────────────────┘
```

**Pieza 1, Traccar:** producto de código abierto que recibe y guarda las coordenadas. No se programa nada, solo se configura. Ya está funcionando.

**Pieza 2, la API:** nuestro código. Cada 2 minutos pregunta a Traccar por puntos nuevos, los agrupa en recorridos y calcula todas las métricas. Expone esa información a la Pieza 3 de forma segura.

**Pieza 3, el panel web:** lo que ve el supervisor. Mapa en vivo, historial de recorridos, reproducción de rutas y reportes exportables.

### Regla que nunca se rompe

**La API nunca escribe en la base de datos de Traccar.** Solo lee su API REST. Escribir directamente corrompe el historial y se rompe con cada actualización de Traccar.

## 1.4 Estado actual

| Componente | Estado |
|---|---|
| VPS con Dokploy (`13.140.40.204`, panel en `:3000`) | ✅ Funcionando |
| Traccar Server + MySQL (`:8082`) | ✅ Funcionando |
| Traccar Client en celulares de prueba | ✅ Registrando recorridos sin cortes |
| Geocercas (sectores) dibujadas | ✅ En progreso |
| Dispositivos con atributos `dni`, `placa`, `sector_asignado` | ✅ Creados |
| Generador de QR de configuración | ✅ Listo |
| **API Perifoneo** | 🟡 Código completo y probado, falta desplegar |
| **Panel web** | 🔴 Por construir |

---

# PARTE 2 — LA API, PASO A PASO

## 2.1 Qué hace la API, explicado sin tecnicismos

Imagina que Traccar es una libreta donde se anota cada 20 metros "Breyan estuvo aquí a esta hora". Al final del día hay 2,000 anotaciones sueltas por persona. Útil, pero nadie puede leerlas.

La API es quien lee esa libreta cada 2 minutos y hace el resumen:

1. **Agrupa** las anotaciones en recorridos. Si hay un silencio de más de 25 minutos, entiende que terminó un recorrido y que el siguiente punto empieza otro.
2. **Revisa cada anotación** contra el mapa del sector asignado: ¿cayó dentro o fuera?
3. **Suma**: cuántos minutos dentro, cuántos fuera, cuántos detenido, cuántos kilómetros.
4. **Guarda** el resumen en su propia base de datos.
5. **Responde** al panel web cuando un supervisor pregunta algo.

## 2.2 Estructura del proyecto

```
perifoneo-api/
├── src/
│   ├── index.js        Arranque: conecta, importa y lanza el ciclo de 2 minutos
│   ├── config.js       Lee las variables de entorno (todas las reglas ajustables)
│   ├── db.js           Conexión a MySQL
│   ├── traccar.js      Cliente de la API de Traccar
│   ├── geo.js          Cálculos geográficos: dentro/fuera, distancias, tolerancia
│   ├── sectores.js     Importa geocercas y dispositivos desde Traccar
│   ├── sync.js         EL MOTOR: detecta recorridos y calcula métricas
│   ├── auth.js         Login, contraseñas, permisos por rol, auditoría
│   └── api.js          Todos los endpoints que consume el panel
├── scripts/
│   └── crear-admin.js  Crea el primer usuario administrador
├── schema.sql          Estructura de la base de datos
├── Dockerfile          Receta para que Dokploy construya el contenedor
├── .env.example        Plantilla de variables de entorno
└── package.json        Dependencias
```

## 2.3 Cómo funciona el motor por dentro

### El ciclo de sincronización

En `index.js`:

```javascript
setInterval(() => sincronizar(), config.reglas.intervaloSyncSeg * 1000);
```

`intervaloSyncSeg` vale 120, así que se ejecuta cada 2 minutos. En cada ciclo, por cada dispositivo:

```
1. Leer en sync_estado: "¿hasta qué momento ya traje datos de este dispositivo?"
2. Pedir a Traccar SOLO los puntos posteriores a ese momento
3. Descartar puntos malos (precisión > 100 m, velocidad > 80 km/h, GPS simulado)
4. Para cada punto:
     ¿Pasaron más de 25 min desde el punto anterior?
        SÍ → cerrar el recorrido anterior, abrir uno nuevo
        NO → agregar al recorrido actual
     ¿Está dentro del polígono del sector (con 50 m de tolerancia)?
        Marcar dentro_sector = 1 ó 0
5. Recalcular las métricas de los recorridos tocados
6. Guardar en sync_estado: "llegué hasta aquí"
```

El paso 6 es lo que permite reiniciar el servicio sin perder ni duplicar datos: siempre retoma donde quedó. Además, cada punto se guarda con el identificador único que le asigna Traccar, así que un reintento nunca crea duplicados.

### Cómo se calculan las métricas

Se recorren los puntos de a pares consecutivos. Cada par forma un **tramo**:

| Condición del tramo | Se suma a |
|---|---|
| Separación mayor a 20 minutos | `minutos_descartados` (corte de señal, no es tiempo verificable) |
| Ambos puntos dentro del sector | `minutos_dentro` y `km_dentro` |
| Al menos un punto fuera | `minutos_fuera` |
| Ambos puntos con velocidad menor a 3 km/h | además, `minutos_detenido` |

El `minutos_detenido` es independiente: un tramo puede estar dentro del sector **y** detenido. Sirve para que el supervisor distinga "circuló 2 horas" de "estuvo estacionado 2 horas".

### Estados de un recorrido

Solo describen hechos, nunca juzgan:

| Estado | Significado |
|---|---|
| `EN_CURSO` | Sigue recibiendo puntos |
| `FINALIZADA` | Pasaron 25 minutos sin puntos, se cerró |
| `DESCARTADA` | Duró menos de 10 minutos. Se asume arranque accidental de la app y se oculta de los listados |

## 2.4 Modelo de datos

Base de datos `perifoneo`, MySQL 8.

| Tabla | Qué guarda |
|---|---|
| `sectores` | Copia de las geocercas de Traccar: polígono original, polígono con tolerancia y su versión GeoJSON para el mapa |
| `dispositivos` | Copia de los dispositivos de Traccar con DNI, placa, teléfono, modelo de celular y sector asignado |
| `asignaciones_sector` | Historial de asignaciones con fechas. Si alguien cambia de sector, el pasado se conserva |
| `sesiones` | Un registro por recorrido con todas sus métricas |
| `puntos` | Cada punto GPS con su marca dentro/fuera, velocidad y batería |
| `sync_estado` | Marca hasta dónde se sincronizó cada dispositivo |
| `usuarios_panel` | Supervisores y administradores, con contraseña cifrada |
| `supervisor_dispositivos` | Qué perifoneadores ve cada supervisor |
| `auditoria` | Registro de ingresos y acciones en el panel |

### Dos trampas técnicas ya resueltas

Documentadas para que nadie las "corrija" por error:

1. **Traccar escribe las geocercas con la latitud primero**: `POLYGON((lat lon, ...))`, al revés del estándar. El código las invierte al importar. Si alguien quita esa inversión, los sectores aparecen en otro continente.
2. **Traccar entrega la velocidad en nudos.** Se multiplica por 1.852 para obtener km/h.

Y una limitación de MySQL: la función `ST_Buffer` no trabaja con coordenadas geográficas. Por eso el polígono con tolerancia se calcula al importar con la librería Turf.js y se guarda ya calculado.

## 2.5 Requisitos antes de empezar

Reúne todo esto antes del Paso 1:

- [ ] Acceso a Dokploy (`http://13.140.40.204:3000`)
- [ ] Acceso SSH al VPS
- [ ] Email y contraseña del **administrador de Traccar**
- [ ] Cuenta de GitHub
- [ ] El código de la API (carpeta `perifoneo-api`)

---

## PASO 1 — Obtener la contraseña de MySQL

La contraseña de root de MySQL **no es la misma** que la del VPS. La definió quien configuró Traccar.

1. Entra a Dokploy.
2. Abre el proyecto de Traccar y ve a la pestaña donde está el **Compose File**.
3. Busca en el servicio de MySQL una línea como `MYSQL_ROOT_PASSWORD: ...`. Ese valor es la contraseña.
4. Anota también el **nombre del servicio** de MySQL (la clave bajo `services:`, por ejemplo `database` o `mysql`).

Si la contraseña aparece como variable (`${ALGO}`), búscala en la pestaña **Environment** del mismo proyecto, o desde SSH:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}"
docker inspect NOMBRE_CONTENEDOR_MYSQL | grep MYSQL_ROOT_PASSWORD
```

Anota el **nombre exacto del contenedor** de MySQL que aparece en `docker ps`. Lo necesitas en el Paso 5.

## PASO 2 — Crear la base de datos y su usuario

Creamos una base aparte con un usuario propio. Así la API no tiene acceso a la base de Traccar.

Desde SSH en el VPS:

```bash
docker exec -it NOMBRE_CONTENEDOR_MYSQL mysql -uroot -p
```

Te pedirá la contraseña del Paso 1. Ya dentro de MySQL, ejecuta (cambia la clave por una tuya y guárdala):

```sql
CREATE DATABASE perifoneo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'perifoneo'@'%' IDENTIFIED BY 'UnaClaveFuerte_2026';
GRANT ALL PRIVILEGES ON perifoneo.* TO 'perifoneo'@'%';
FLUSH PRIVILEGES;
EXIT;
```

El usuario `perifoneo` solo tiene permisos sobre la base `perifoneo`. No puede tocar la de Traccar.

## PASO 3 — Cargar la estructura de tablas

Sube `schema.sql` al VPS (con `scp` o el explorador de archivos que uses) y ejecuta:

```bash
docker exec -i NOMBRE_CONTENEDOR_MYSQL mysql -uroot -p < schema.sql
```

Verifica que se crearon las 9 tablas:

```bash
docker exec -it NOMBRE_CONTENEDOR_MYSQL mysql -uroot -p -e "SHOW TABLES FROM perifoneo;"
```

Debes ver: `asignaciones_sector`, `auditoria`, `dispositivos`, `puntos`, `sectores`, `sesiones`, `supervisor_dispositivos`, `sync_estado`, `usuarios_panel`, y la vista `v_sesiones`.

## PASO 4 — Subir el código a GitHub

Dokploy despliega desde un repositorio. Cada cambio futuro será: subir a GitHub y presionar Deploy.

1. En GitHub, crea un repositorio **privado** llamado `perifoneo-api`.
2. En tu computadora, dentro de la carpeta del proyecto:

```bash
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
git add .
git commit -m "API Perifoneo v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/perifoneo-api.git
git push -u origin main
```

**Nunca subas el archivo `.env`** con contraseñas reales. Por eso está en `.gitignore`. Las contraseñas se configuran en Dokploy.

## PASO 5 — Conectar la red entre contenedores

La API debe poder "ver" al contenedor de MySQL. Dokploy pone sus aplicaciones en una red llamada `dokploy-network`. Hay que agregar MySQL a esa red.

En Dokploy, edita el Compose File de Traccar y agrega la red al servicio de MySQL y al final del archivo:

```yaml
services:
  database:                 # usa el nombre real de tu servicio de MySQL
    image: mysql:lts
    # ... todo lo que ya tenía, sin cambios ...
    networks:
      - default
      - dokploy-network

  traccar:
    # ... sin cambios ...
    networks:
      - default
      - dokploy-network

networks:
  dokploy-network:
    external: true
```

Guarda y presiona **Deploy**. Los datos no se pierden: están en volúmenes, no en los contenedores.

Verifica desde SSH que quedaron conectados:

```bash
docker network inspect dokploy-network --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}'
```

Debes ver en la lista los contenedores de MySQL y de Traccar.

## PASO 6 — Crear la aplicación en Dokploy

1. En Dokploy, dentro del mismo proyecto, crea un servicio nuevo de tipo **Application**.
2. Nombre: `perifoneo-api`.
3. **Provider:** GitHub. Autoriza el acceso y selecciona el repositorio `perifoneo-api`, rama `main`.
4. **Build Type:** Dockerfile. La ruta es `./Dockerfile`.
5. En la sección de puertos, expón el **3001**.

**Importante:** el puerto 3000 lo usa Dokploy. La API usa el **3001**. Si los confundes, el panel de Dokploy deja de funcionar.

## PASO 7 — Configurar las variables de entorno

En la pestaña **Environment** de la aplicación, pega esto y reemplaza los valores:

```bash
TRACCAR_URL=http://NOMBRE_CONTENEDOR_TRACCAR:8082
TRACCAR_EMAIL=el_email_admin_de_traccar
TRACCAR_PASSWORD=la_clave_admin_de_traccar

DB_HOST=NOMBRE_CONTENEDOR_MYSQL
DB_PORT=3306
DB_USER=perifoneo
DB_PASSWORD=UnaClaveFuerte_2026
DB_NAME=perifoneo

JWT_SECRET=PEGA_AQUI_EL_RESULTADO_DEL_COMANDO_DE_ABAJO
JWT_EXPIRACION=12h
CORS_ORIGENES=*

TOLERANCIA_METROS=50
GAP_SESION_MIN=25
GAP_TRAMO_MAX=20
DURACION_MINIMA_MIN=10
VELOCIDAD_DETENIDO_KMH=3
PRECISION_MAX_M=100
VELOCIDAD_MAX_KMH=80
ALERTA_DEMORA_MIN=5
ALERTA_SILENCIO_MIN=10
INTERVALO_SYNC_SEG=120
DIAS_INICIALES=3

PORT=3001
TZ=America/Lima
```

Para el `JWT_SECRET`, genera una cadena aleatoria desde SSH y pega el resultado:

```bash
openssl rand -hex 32
```

Si `TRACCAR_URL` con el nombre del contenedor no conecta, usa la dirección pública: `http://13.140.40.204:8082`. Funciona igual.

`CORS_ORIGENES=*` es solo para pruebas. Cuando el panel tenga dominio, se reemplaza por ese dominio exacto.

## PASO 8 — Desplegar y revisar los registros

Presiona **Deploy**. Abre la pestaña **Logs**. Un arranque correcto se ve así:

```
--- Panel de Perifoneo ---
Conectado a Traccar 6.x en http://...
Sectores: 4 creados, 0 actualizados, 0 omitidos
Dispositivos sincronizados: 3
Sync OK: 1840 puntos nuevos, 2 sesiones cerradas (3.2s)
API escuchando en el puerto 3001
```

### Si algo falla

| Mensaje en los logs | Causa | Solución |
|---|---|---|
| `Faltan variables de entorno` | Variable vacía o mal escrita | Revisa el Paso 7 |
| `JWT_SECRET (mínimo 32 caracteres)` | Clave de sesión muy corta | Genera otra con `openssl` |
| `ECONNREFUSED` o `ENOTFOUND` con MySQL | La API no ve a MySQL | Revisa el Paso 5 y el valor de `DB_HOST` |
| `Access denied for user 'perifoneo'` | Clave de BD incorrecta | Compara con el Paso 2 |
| `Traccar 401` | Credenciales de Traccar mal | Verifica email y clave del admin |
| `no existe el sector "..."` | El atributo del dispositivo no coincide | Ver Paso 11 |
| `Geocerca "..." omitida` | La geocerca es una línea, no un área | Redibujarla como polígono |

## PASO 9 — Crear el primer administrador

En Dokploy, abre la terminal del contenedor `perifoneo-api` (o por SSH con `docker exec -it NOMBRE_CONTENEDOR_API sh`) y ejecuta:

```bash
node scripts/crear-admin.js tu@correo.pe "Tu Nombre" 'TuClaveSegura123'
```

Respuesta esperada: `Administrador creado con id 1: tu@correo.pe`.

Este es el usuario con el que entrarás al panel. Los supervisores se crean después desde el propio panel.

## PASO 10 — Verificar que todo funciona

Desde tu computadora o SSH:

**Salud del servicio (no requiere login):**

```bash
curl http://13.140.40.204:3001/api/salud
```

```json
{ "ok": true, "traccar": { "version": "6.x" },
  "dispositivos": 3, "sectores": 4, "sesiones_en_curso": 1, "sesiones_total": 5 }
```

**Login:**

```bash
curl -X POST http://13.140.40.204:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@correo.pe","password":"TuClaveSegura123"}'
```

Copia el valor de `token` de la respuesta.

**Consultar recorridos:**

```bash
curl http://13.140.40.204:3001/api/sesiones \
  -H "Authorization: Bearer EL_TOKEN_COPIADO"
```

**Prueba de fuego:** compara lo que devuelve con lo que realmente pasó. Si ayer hiciste un recorrido de 9:00 a 10:30, debe aparecer una sesión con esas horas aproximadas. Si no coincide, **no avances** al panel: hay que revisar antes.

## PASO 11 — Asignar sectores a los perifoneadores

En Traccar, en cada dispositivo, el atributo `sector_asignado` debe coincidir **exactamente** con el nombre de la geocerca. Mayúsculas y tildes incluidas, aunque el sistema ignora espacios al inicio y al final.

| Nombre de la geocerca | Atributo del dispositivo | ¿Funciona? |
|---|---|---|
| `Cercado` | `Cercado` | ✅ |
| `Cercado` | `cercado` | ✅ (ignora mayúsculas) |
| `Alto de la Alianza` | `Alto Alianza` | ❌ |
| `Gregorio Albarracín` | `Gregorio Albarracin` | ❌ (falta la tilde) |

La API reimporta sectores y dispositivos cada hora. Para aplicarlo al momento, y para reclasificar recorridos ya guardados:

```bash
# Reimportar ahora
curl -X POST http://13.140.40.204:3001/api/admin/importar \
  -H "Authorization: Bearer TOKEN"

# Reprocesar un rango de fechas con los sectores nuevos
curl -X POST http://13.140.40.204:3001/api/admin/recalcular \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"desde":"2026-09-01","hasta":"2026-09-30"}'
```

El recálculo se usa también si se mueve un polígono o se cambia la tolerancia. **Ningún ajuste obliga a perder el histórico.**

---

## 2.6 Referencia completa de la API

Base: `http://SERVIDOR:3001/api`. Todas las rutas, salvo `salud` y `auth/login`, requieren la cabecera:

```
Authorization: Bearer <token>
```

El token dura 12 horas. Al expirar, la API responde `401` y el panel debe enviar al usuario al login.

### Autenticación

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, usuario: { id, email, nombre, rol } }` |
| GET | `/auth/yo` | — | Datos del usuario actual |
| POST | `/auth/cambiar-password` | `{ nueva }` | `{ ok: true }` |

### Consulta (ADMIN y SUPERVISOR)

Un **SUPERVISOR solo recibe datos de los perifoneadores que tiene asignados.** El filtro lo aplica la API, no el panel, así que no se puede saltar.

| Método | Ruta | Parámetros | Devuelve |
|---|---|---|---|
| GET | `/salud` | — | Estado y conteos (público) |
| GET | `/sectores` | — | Sectores con polígono GeoJSON |
| GET | `/dispositivos` | — | Perifoneadores con su sector |
| GET | `/vivo` | — | Última posición y estado de cada uno |
| GET | `/sesiones` | `desde`, `hasta`, `dispositivo`, `sector`, `estado`, `incluir_descartadas=1` | Listado de recorridos |
| GET | `/sesiones/:id/ruta` | — | Recorrido con todos sus puntos |
| GET | `/resumen` | `desde`, `hasta` | Acumulado por perifoneador |
| GET | `/resumen/sectores` | `desde`, `hasta` | Acumulado por sector |

Las fechas van en formato `AAAA-MM-DD`.

### Administración (solo ADMIN)

| Método | Ruta | Cuerpo | Uso |
|---|---|---|---|
| POST | `/admin/importar` | — | Reimporta desde Traccar |
| POST | `/admin/sincronizar` | — | Fuerza un ciclo ahora |
| POST | `/admin/recalcular` | `{ desde, hasta, dispositivo? }` | Reprocesa un rango |
| GET | `/admin/usuarios` | — | Lista de usuarios del panel |
| POST | `/admin/usuarios` | `{ email, nombre, password, rol }` | Crea un usuario |
| PATCH | `/admin/usuarios/:id` | `{ activo?, rol?, nombre? }` | Edita o desactiva |
| PUT | `/admin/usuarios/:id/dispositivos` | `{ dispositivos: [ids] }` | Define a quién supervisa |
| GET | `/admin/auditoria` | — | Últimas 500 acciones |

### Ejemplos de respuesta

**`GET /vivo`**

```json
[{
  "id": 3, "nombre": "Breyan Mamani", "dni": "15302081", "telefono": "952000111",
  "placa": "Z1A-234", "sector_id": 1, "sector": "Cercado", "color": "#2563eb",
  "lat": -18.0146, "lon": -70.2536, "velocidad_kmh": 18.4, "bateria_pct": 84,
  "hora": "2026-09-18T14:28:21.000Z", "minutos_sin_reportar": 1, "estado": "ACTIVO"
}]
```

`estado` vale `ACTIVO` (menos de 5 min sin reportar), `DEMORADO` (5 a 10 min) o `SIN_SENAL` (más de 10).

**`GET /sesiones`**

```json
[{
  "id": 118, "fecha": "2026-09-18",
  "inicio_at": "2026-09-18T14:12:05.000Z", "fin_at": "2026-09-18T16:34:20.000Z",
  "estado": "FINALIZADA",
  "minutos_totales": 142, "minutos_dentro": 125, "minutos_fuera": 17,
  "minutos_detenido": 22, "minutos_descartados": 0,
  "km_totales": 16.8, "km_dentro": 14.2, "pct_dentro": 88.03, "puntos_count": 1650,
  "dispositivo_id": 3, "perifoneador": "Breyan Mamani", "dni": "15302081",
  "sector_id": 1, "sector": "Cercado", "sector_color": "#2563eb"
}]
```

**`GET /sesiones/:id/ruta`**

```json
{
  "sesion": { "id": 118, "perifoneador": "Breyan Mamani", "sector": "Cercado",
              "sector_geojson": { "type": "Polygon", "coordinates": [[[-70.26, -18.01], "..."]] } },
  "puntos": [
    { "device_time": "2026-09-18T14:12:05.000Z", "lat": -18.0146, "lon": -70.2536,
      "velocidad_kmh": 18.5, "dentro_sector": 1, "bateria_pct": 84, "precision_m": 6.2 }
  ]
}
```

### Notas para quien consuma la API

- **Todas las horas vienen en UTC** (terminan en `Z`). El panel las convierte a hora de Lima al mostrarlas. Tacna está en UTC−5.
- La columna interna `minutos_validos` significa "minutos dentro del sector". La API ya la expone con el nombre claro `minutos_dentro`.
- `/sesiones` **no incluye los puntos** a propósito: un recorrido de 2 horas tiene unos 2,000. Los puntos se piden solo al abrir un recorrido concreto.
- `/sesiones` oculta los recorridos `DESCARTADA` salvo que se pase `incluir_descartadas=1`.

---

# PARTE 3 — EL PANEL WEB (SISTEMA EXTERNO)

## 3.1 Objetivo

Aplicación web para que los supervisores **vigilen en tiempo real** y **documenten** el trabajo de cada perifoneador, sin necesidad de entrar a Traccar.

## 3.2 Usuarios

| Rol | Qué puede hacer |
|---|---|
| **Supervisor** | Ver en vivo, consultar historial, reproducir rutas y exportar reportes, **solo de su grupo** de perifoneadores |
| **Administrador** | Todo lo anterior sobre todos, más gestionar usuarios, asignar grupos y ejecutar reprocesos |

## 3.3 Requerimientos funcionales

### Acceso

- **RF-01** Pantalla de login con email y contraseña.
- **RF-02** Guardar el token en memoria de la sesión del navegador. Al recibir `401`, volver al login con el mensaje "Tu sesión expiró".
- **RF-03** Menú y funciones visibles según el rol. El supervisor no ve el menú de administración.
- **RF-04** Opción de cambiar la propia contraseña.
- **RF-05** Botón de cerrar sesión.

### Mapa en vivo

- **RF-06** Mapa de Tacna con todos los sectores dibujados en su color, con transparencia.
- **RF-07** Un marcador por perifoneador en su última posición conocida.
- **RF-08** Actualización automática cada 30 segundos, sin recargar la página.
- **RF-09** Color del marcador según estado: verde `ACTIVO`, ámbar `DEMORADO`, rojo `SIN_SENAL`.
- **RF-10** Lista lateral de perifoneadores, ordenada con los de `SIN_SENAL` primero.
- **RF-11** Al seleccionar uno, ficha con nombre, DNI, teléfono como enlace `tel:` para llamar con un toque, sector, última hora de reporte, velocidad y batería.
- **RF-12** Filtro por sector.
- **RF-13** Contador en la parte superior: "12 activos · 2 demorados · 1 sin señal".

### Historial de recorridos

- **RF-14** Tabla de recorridos con filtros por rango de fechas, perifoneador y sector.
- **RF-15** Por defecto muestra el día actual.
- **RF-16** Columnas: fecha, perifoneador, sector, inicio, fin, duración, minutos dentro, minutos fuera, % dentro, tiempo detenido, km.
- **RF-17** Ordenable por cualquier columna.
- **RF-18** Fila de totales al pie.
- **RF-19** Los recorridos `EN_CURSO` se marcan visualmente.
- **RF-20** Exportar a Excel exactamente lo que está filtrado.
- **RF-21** Clic en una fila abre el detalle del recorrido.

### Detalle de recorrido

- **RF-22** Mapa con el polígono del sector de fondo.
- **RF-23** Ruta dibujada en **dos colores**: verde donde `dentro_sector = 1`, rojo donde es `0`. Un segmento entre dos puntos es rojo si cualquiera de los dos está fuera.
- **RF-24** Marcadores de inicio y fin con su hora.
- **RF-25** Panel de métricas: duración, minutos dentro, minutos fuera, % dentro, detenido, km.
- **RF-26** **Reproductor**: barra de tiempo que recorre la ruta, con botones de reproducir y pausar, y velocidades 1x, 10x, 30x y 60x. Un marcador se desplaza por la ruta mostrando hora, velocidad y batería en cada instante.
- **RF-27** Navegación a los otros recorridos de la misma persona en el mismo día: "Recorrido 2 de 4".
- **RF-28** Exportar la ruta a formato GPX.
- **RF-29** Imprimir la vista del recorrido.

### Reportes

- **RF-30** Reporte por perifoneador en un rango de fechas: recorridos, días activos, horas totales, horas dentro, % dentro, horas detenido, km, primera y última actividad.
- **RF-31** Reporte por sector: personas asignadas, recorridos, días con cobertura, horas dentro, última vez cubierto. Destacar los sectores sin cobertura en el periodo.
- **RF-32** Exportar ambos a Excel.
- **RF-33** **Informe individual en PDF** de un perifoneador para un periodo: datos personales, tabla de recorridos, totales, y un espacio para que el supervisor escriba su evaluación y firme. Este es el documento oficial de evaluación.

### Administración (solo ADMIN)

- **RF-34** Listado de usuarios del panel con alta, edición, activación y desactivación.
- **RF-35** Asignar a cada supervisor su grupo de perifoneadores, con casillas de selección.
- **RF-36** Listado de perifoneadores con su sector. Aviso visible para los que no tienen sector asignado.
- **RF-37** Botón "Actualizar desde Traccar".
- **RF-38** Herramienta de recálculo con selector de fechas y confirmación.
- **RF-39** Visor de auditoría.

## 3.4 Requerimientos no funcionales

| Código | Requerimiento |
|---|---|
| RNF-01 | Funciona en Chrome, Edge y Firefox de escritorio, y en Chrome para Android |
| RNF-02 | Diseño adaptable: el mapa en vivo debe ser usable desde el celular del supervisor |
| RNF-03 | Carga inicial en menos de 3 segundos |
| RNF-04 | El detalle de un recorrido de 2,000 puntos se dibuja en menos de 2 segundos |
| RNF-05 | Todas las horas se muestran en hora de Lima, formato 24 horas |
| RNF-06 | Toda la interfaz en español |
| RNF-07 | Servido exclusivamente por HTTPS en producción |
| RNF-08 | No guarda contraseñas en el navegador |

## 3.5 Stack tecnológico

| Necesidad | Herramienta | Motivo |
|---|---|---|
| Framework | React 18 + Vite | Estándar, rápido de desarrollar |
| Enrutamiento | React Router | Navegación entre pantallas |
| Mapas | Leaflet + react-leaflet | Gratuito, liviano, muy documentado |
| Mapa base | OpenStreetMap | Sin costo ni claves de API |
| Consultas a la API | TanStack Query | Caché y refresco automático, ideal para el mapa en vivo |
| Tablas | TanStack Table | Ordenamiento y filtros |
| Estilos | Tailwind CSS | Rapidez |
| Fechas | date-fns + date-fns-tz | Conversión UTC a Lima |
| Excel | SheetJS (xlsx) | Exportación en el navegador |
| PDF | jsPDF + jspdf-autotable | Informe individual |
| GPX | Generación manual | Es un XML simple |

## 3.6 Estructura de carpetas

```
perifoneo-panel/
├── src/
│   ├── api/
│   │   ├── cliente.js       fetch con token y manejo de 401
│   │   └── endpoints.js     una función por endpoint
│   ├── auth/
│   │   ├── AuthContext.jsx  usuario y token en memoria
│   │   └── RutaProtegida.jsx
│   ├── componentes/
│   │   ├── MapaBase.jsx     Leaflet centrado en Tacna
│   │   ├── CapaSectores.jsx polígonos de colores
│   │   ├── RutaBicolor.jsx  la ruta verde/roja
│   │   ├── Reproductor.jsx  barra de tiempo
│   │   ├── TablaDatos.jsx
│   │   └── FiltroFechas.jsx
│   ├── paginas/
│   │   ├── Login.jsx
│   │   ├── EnVivo.jsx
│   │   ├── Historial.jsx
│   │   ├── DetalleRecorrido.jsx
│   │   ├── Reportes.jsx
│   │   └── admin/
│   │       ├── Usuarios.jsx
│   │       ├── Perifoneadores.jsx
│   │       └── Herramientas.jsx
│   ├── utilidades/
│   │   ├── formato.js       horas Lima, duración "2h 22min", km
│   │   ├── excel.js
│   │   ├── pdf.js
│   │   └── gpx.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example             VITE_API_URL=https://api.tudominio.pe/api
├── Dockerfile
└── nginx.conf
```

## 3.7 Diseño de pantallas

### Mapa en vivo

```
┌──────────────────────────────────────────────────────────────────┐
│ ◉ Perifoneo   En vivo · Historial · Reportes · Admin    Juan ▾  │
├──────────────────────────────────────────────────────────────────┤
│  ● 12 activos    ● 2 demorados    ● 1 sin señal     [Sector ▾]  │
├───────────────────┬──────────────────────────────────────────────┤
│ 🔴 Sandro Q.      │                                              │
│    Sin señal 14m  │        ░░░░░░░                               │
│ 🟡 Rosa T.        │      ░░ Cercado ░░     🟢                   │
│    Hace 7 min     │     ░░░░░░░░░░░░░░         🟢               │
│ 🟢 Breyan M.      │          🟢      ▓▓▓▓▓▓▓▓                   │
│    Ahora · 18km/h │                 ▓ Alto de la ▓   🟡         │
│ 🟢 Luis P.        │                 ▓  Alianza   ▓              │
│    Ahora · 12km/h │                  ▓▓▓▓▓▓▓▓▓▓               │
│  ...              │  ┌──────────────────────────┐    🔴         │
│                   │  │ Breyan Mamani            │               │
│                   │  │ DNI 15302081 · Cercado   │               │
│                   │  │ 📞 952 000 111           │               │
│                   │  │ 18 km/h · 🔋 84% · 09:28 │               │
│                   │  │ [Ver recorrido de hoy]   │               │
│                   │  └──────────────────────────┘               │
└───────────────────┴──────────────────────────────────────────────┘
```

### Historial

```
┌──────────────────────────────────────────────────────────────────┐
│ Del [18/09/2026] al [18/09/2026]  Perifoneador [Todos ▾]        │
│ Sector [Todos ▾]                                [⬇ Excel]       │
├────────┬──────────┬─────────┬───────┬───────┬───────┬─────┬─────┤
│ Fecha  │ Persona  │ Sector  │Inicio │ Fin   │Duración│%Den│ Km  │
├────────┼──────────┼─────────┼───────┼───────┼───────┼─────┼─────┤
│ 18/09  │ Breyan M.│ Cercado │ 09:12 │ 11:34 │ 2h 22m│ 88% │16.8 │
│ 18/09  │ Breyan M.│ Cercado │ 15:30 │ 17:45 │ 2h 15m│ 98% │14.1 │
│ 18/09  │ Rosa T.  │ Alianza │ 08:40 │ 10:05 │ 1h 25m│ 64% │ 9.3 │
│ 18/09  │ Luis P.  │ Pocollay│ 10:00 │ ●curso│ 1h 02m│ 95% │ 7.2 │
├────────┴──────────┴─────────┴───────┴───────┼───────┼─────┼─────┤
│ 4 recorridos · 3 personas                   │ 7h 04m│ 87% │47.4 │
└─────────────────────────────────────────────┴───────┴─────┴─────┘
```

### Detalle de recorrido

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Volver   Breyan Mamani · Cercado · 18/09/2026                  │
│            Recorrido 1 de 2   [◀ Anterior] [Siguiente ▶]         │
├──────────────────────────────────────────────┬───────────────────┤
│                                              │ 09:12 → 11:34     │
│     ░░░░░░░░░░░░░░░░░░░░░                    │                   │
│   ░░  ▶━━━━━━┓        ░░                     │ Duración  2h 22m  │
│   ░░         ┃        ░░                     │ Dentro    2h 05m  │
│   ░░    ┏━━━━┛    ┏━━━━━━┓  (rojo: fuera)   │ Fuera       17m   │
│   ░░    ┃         ┃  ░░  ┗━━━┓              │ % dentro    88%   │
│   ░░    ┗━━━━━━━━━┛  ░░      ┃              │ Detenido    22m   │
│   ░░            ■    ░░  ━━━━┛              │ Distancia 16.8 km │
│     ░░░░░░░░░░░░░░░░░░░░░                    │                   │
│                                              │ [⬇ GPX] [🖨]      │
├──────────────────────────────────────────────┴───────────────────┤
│ ▶  ━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━  10:03 · 22 km/h · 🔋 79%   │
│    Velocidad: [1x] [10x] [30x] [60x]                             │
└──────────────────────────────────────────────────────────────────┘
```

## 3.8 Reglas de presentación

| Dato | Formato | Ejemplo |
|---|---|---|
| Hora | 24 horas, hora de Lima | `09:12` |
| Fecha | Día/mes/año | `18/09/2026` |
| Duración | Horas y minutos | `2h 22min` |
| Distancia | Kilómetros, 1 decimal | `16.8 km` |
| Velocidad | Kilómetros por hora | `18 km/h` |
| Porcentaje | Entero | `88%` |

**Colores con significado fijo:** verde para dentro del sector y activo, rojo para fuera del sector y sin señal, ámbar para demorado. Usarlos solo con ese significado. Como algunas personas no distinguen bien rojo y verde, acompañar siempre el color con un ícono o texto.

**Centro del mapa:** Tacna, aproximadamente latitud −18.0146, longitud −70.2536, zoom 13.

**Recordatorio para el diseño:** no mostrar etiquetas de "válido", "cumplió" o similares. El panel presenta datos; la evaluación es del supervisor, en el informe PDF.

## 3.9 Guía de implementación de las partes difíciles

### Ruta en dos colores

No dibujar una línea por segmento: con 2,000 puntos serían 2,000 capas y el mapa se volvería lento. Agrupar puntos consecutivos con el mismo estado en tramos continuos, y dibujar una línea por tramo:

```javascript
function agruparTramos(puntos) {
  const tramos = [];
  let actual = null;
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1], b = puntos[i];
    const dentro = a.dentro_sector === 1 && b.dentro_sector === 1;
    if (!actual || actual.dentro !== dentro) {
      actual = { dentro, coords: [[a.lat, a.lon]] };
      tramos.push(actual);
    }
    actual.coords.push([b.lat, b.lon]);
  }
  return tramos; // cada tramo → un <Polyline color={dentro ? verde : rojo}>
}
```

### Reproductor

Mantener un "tiempo actual" en el estado. Con cada tick del temporizador avanzar según la velocidad elegida, buscar el punto más cercano a ese tiempo con búsqueda binaria sobre el arreglo ordenado, y mover el marcador. Dibujar en color intenso la ruta ya recorrida y en tenue la que falta.

### Mapa en vivo

Con TanStack Query, `refetchInterval: 30000`. Desactivar el refresco cuando la pestaña no está visible para no consumir recursos.

### Cliente de la API

Un único módulo que agregue el token a todas las peticiones y, ante un `401`, limpie la sesión y redirija al login. Ninguna pantalla debe hacer `fetch` directamente.

## 3.10 Despliegue del panel

El panel es un sitio estático. Se compila con Vite y se sirve con Nginx.

**Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine-slim AS runner
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf** (optimizado con compresión gzip, caché granular SPA, cabeceras de seguridad y endpoint /health):

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    server_tokens off;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location = /health {
        access_log off;
        default_type text/plain;
        return 200 "healthy\n";
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        access_log off;
        try_files $uri =404;
    }

    location ~* \.(ico|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$ {
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}
```

En Dokploy: nueva **Application** desde el repositorio `perifoneo-panel`, tipo Dockerfile, con el argumento de construcción `VITE_API_URL` apuntando a la API. Asignar dominio en la pestaña **Domains** con HTTPS. Después, actualizar `CORS_ORIGENES` de la API con ese dominio exacto.

## 3.11 Criterios de aceptación del panel

1. Un supervisor ingresa y ve solamente a su grupo de perifoneadores.
2. El mapa en vivo refleja el movimiento real con menos de 3 minutos de desfase.
3. Un perifoneador que deja de reportar más de 10 minutos aparece en rojo y primero en la lista.
4. Desde la ficha se puede llamar al perifoneador con un toque en el celular.
5. El historial de una fecha pasada muestra todos los recorridos, uno por fila, con horas en hora de Lima.
6. Una persona con 4 recorridos en el día muestra 4 filas, y desde el detalle se navega entre ellos.
7. La ruta muestra en rojo los tramos fuera del sector, coincidiendo con lo ocurrido en campo.
8. El reproductor recorre la ruta con la hora correcta.
9. El Excel exportado contiene exactamente lo filtrado y sus totales coinciden con la pantalla.
10. El PDF individual incluye los recorridos del periodo y el espacio para la evaluación del supervisor.
11. Un supervisor no puede acceder a la administración ni a datos fuera de su grupo, aunque modifique la dirección en el navegador.

---

# PARTE 4 — CONFIGURACIÓN DE LOS CELULARES

## 4.1 Qué hace el perifoneador

1. Instala **Traccar Client** desde Play Store.
2. Escanea con la cámara el QR de su tarjeta.
3. La app se abre configurada. Activa **Seguimiento continuo**.
4. Acepta los permisos: ubicación **"Permitir todo el tiempo"** y notificaciones.

Nada más. No toca ningún ajuste.

## 4.2 Configuración que lleva el QR

| Ajuste | Valor | Por qué |
|---|---|---|
| Precisión | Máxima | Usa el GPS satelital, error de 5 a 15 m. La precisión media usa antenas y puede errar 300 m, lo que inutiliza la medición por sector |
| Distancia | 20 m | Ruta nítida, esquinas bien dibujadas |
| Intervalo | 60 s | Reporta aunque esté detenido |
| Ángulo | 15° | Envía un punto al girar |
| Detección de parada | **Apagada** | Con ella encendida, un vehículo detenido deja de reportar y el sistema no lo distingue de una app cerrada |
| Bloqueo de suspensión | Encendido | Evita que Android congele la app con la pantalla apagada |
| Búfer sin conexión | Encendido | Guarda los puntos sin señal y los envía al recuperarla |

Formato del enlace que contiene el QR:

```
traccar://client?id=DNI&url=http://SERVIDOR:8082&accuracy=highest
&distance=20&interval=60&angle=15&buffer=true&wakelock=true&stop_detection=false
```

Las tarjetas se generan con la herramienta de QR ya entregada.

## 4.3 Ajustes del teléfono

Además del QR, en cada celular:

- **Batería:** quitar Traccar Client de la optimización de batería (Ajustes → Aplicaciones → Traccar Client → Batería → Sin restricciones).
- **Xiaomi, Redmi y Poco:** activar además **Inicio automático** para la app.
- **Uso recomendado:** celular en soporte del vehículo, conectado a cargador.

Las instrucciones exactas por marca están en dontkillmyapp.com.

## 4.4 Antes de repartir

- [ ] Probar un QR y confirmar en Ajustes de la app que los siete valores quedaron aplicados
- [ ] Hacer un inventario de marca y modelo de los celulares del equipo
- [ ] Probar en la calle un celular de cada marca, con la pantalla bloqueada 10 minutos a mitad del recorrido
- [ ] **Cambiar la URL del QR de IP a dominio.** Si mañana cambia la IP del servidor, con dominio no hay que reconfigurar 60 celulares

---

# PARTE 5 — PUESTA EN PRODUCCIÓN

## 5.1 Seguridad

- [ ] Dominio propio con HTTPS para Traccar, la API y el panel, desde la pestaña Domains de Dokploy
- [ ] Restringir el acceso al puerto 3000 (Dokploy) solo a tu IP, o cerrarlo al público
- [ ] Desactivar el registro público de usuarios en Traccar
- [ ] Cambiar `CORS_ORIGENES` al dominio exacto del panel
- [ ] No compartir el usuario administrador: cada supervisor con su propia cuenta

## 5.2 Respaldos

- [ ] Respaldo diario automático de las bases `traccar` y `perifoneo`
- [ ] Copia fuera del VPS (almacenamiento externo)
- [ ] Retención de 30 días
- [ ] **Probar una restauración completa al menos una vez.** Un respaldo que nunca se probó no es un respaldo

Dokploy tiene una función de respaldos programados para bases de datos; alternativamente, un `mysqldump` diario por cron.

## 5.3 Aspectos legales

Responsabilidad de la campaña, pero condicionan el despliegue:

- **Ley N.° 29733 de Protección de Datos Personales.** Se tratan DNI y ubicación. Cada perifoneador debe firmar un **consentimiento informado** que indique qué se registra, para qué y por cuánto tiempo.
- **Rastreo solo en horario de trabajo.** El perifoneador activa y desactiva la app. Esto debe explicarse claramente.
- **Eliminación de datos** en una fecha definida tras el cierre de la campaña.
- **Normativa del JNE** sobre propaganda y silencio electoral, y **ordenanzas municipales** de Tacna sobre horarios y niveles de ruido.

---

# PARTE 6 — CRONOGRAMA Y ARRANQUE

## 6.1 Plan de trabajo

| # | Tarea | Responsable sugerido | Estimado | Requiere |
|---|---|---|---|---|
| 1 | Pasos 1 a 3: base de datos | Backend | 1 h | — |
| 2 | Pasos 4 a 8: despliegue de la API | Backend | 2 h | 1 |
| 3 | Pasos 9 a 11: administrador, verificación, sectores | Backend | 1 h | 2 |
| 4 | Validar datos contra recorridos reales | Backend + campo | 2 h | 3 |
| 5 | Panel: login, estructura, cliente de API | Frontend | 0.5 d | 3 |
| 6 | Panel: mapa en vivo | Frontend | 1 d | 5 |
| 7 | Panel: historial y detalle con ruta bicolor | Frontend | 1 d | 5 |
| 8 | Panel: reproductor | Frontend | 0.5 d | 7 |
| 9 | Panel: reportes, Excel y PDF | Frontend | 1 d | 5 |
| 10 | Panel: administración | Frontend | 0.5 d | 5 |
| 11 | Dominio, HTTPS, respaldos | Infraestructura | 3 h | 2 |
| 12 | Tarjetas QR y guía para perifoneadores | Coordinación | 2 h | 11 |
| 13 | **Piloto con 5 perifoneadores** | Todos | 2 d | 6–12 |
| 14 | Despliegue a los 60 | Coordinación | — | 13 |

Las tareas 6 a 10 pueden repartirse entre varias personas a partir de la 5.

**No desplegar a los 60 sin el piloto.** Los problemas reales aparecen en campo: celulares que cierran la app, zonas sin señal, personas que olvidan activar el seguimiento. Es mucho más fácil resolverlos con 5 que con 60.

## 6.2 Lista de verificación para arrancar hoy

- [ ] Acceso a Dokploy y SSH confirmados
- [ ] Contraseña de root de MySQL encontrada en el Compose File
- [ ] Credenciales del administrador de Traccar
- [ ] Repositorio privado `perifoneo-api` creado en GitHub
- [ ] Geocercas de al menos 3 sectores dibujadas en Traccar
- [ ] Dispositivos de prueba con el atributo `sector_asignado` correcto
- [ ] Al menos un recorrido de prueba de 30 minutos ya registrado en Traccar

Con esa lista completa, se empieza por el Paso 1 de la Parte 2.

---

# ANEXO — GLOSARIO

| Término | Significado |
|---|---|
| **Geocerca** | Polígono dibujado en Traccar. En este proyecto, cada geocerca es un sector |
| **Sesión / recorrido** | Periodo continuo de puntos GPS de una persona, sin silencios mayores a 25 minutos |
| **Tramo** | Intervalo entre dos puntos GPS consecutivos |
| **Tolerancia** | Margen de 50 m alrededor del sector para compensar el error del GPS |
| **Minutos dentro** | Suma de tramos con ambos extremos dentro del sector |
| **Minutos detenido** | Suma de tramos con velocidad menor a 3 km/h en ambos extremos |
| **Token** | Credencial temporal que recibe el panel al iniciar sesión; dura 12 horas |
| **Dokploy** | Panel web que administra los contenedores del servidor |
| **Contenedor** | Programa empaquetado que corre aislado en el servidor (Traccar, MySQL, API) |
| **UTC** | Hora universal. La API guarda todo en UTC; Tacna es UTC−5 |
