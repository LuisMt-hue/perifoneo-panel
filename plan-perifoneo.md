# Sistema de Monitoreo de Perifoneo — Tacna

**Plan de implementación para el equipo de desarrollo**

| | |
|---|---|
| Versión | 1.0 |
| Fecha | Septiembre 2026 |
| Estado | Fase 1 completada · Fase 2 en desarrollo |
| Alcance | ~60 perifoneadores, 3–5 supervisores, ciudad de Tacna |

---

## 1. Objetivo

Registrar y auditar de forma confiable el trabajo de perifoneo de campaña, respondiendo con evidencia a tres preguntas por cada persona y día:

1. **¿Salió a perifonear?** A qué hora empezó y a qué hora terminó cada recorrido.
2. **¿Por dónde anduvo?** La ruta exacta, visualizable y exportable.
3. **¿Lo hizo en su zona?** Cuánto tiempo estuvo dentro del sector asignado y cuánto fuera.

### Principios de diseño

- **El sistema registra, no juzga.** No emite veredictos de cumplimiento. Entrega datos objetivos (minutos, kilómetros, porcentajes) y el **supervisor** decide en su informe si el trabajo fue satisfactorio.
- **Sin metas de horas.** Los perifoneadores trabajan en los horarios que tengan disponibles. No existe una cuota de 4 horas ni un turno programado.
- **Cero fricción para el usuario final.** El perifoneador instala una app, escanea un QR y activa un interruptor. Nada más.
- **No reinventar lo que ya existe.** La captura GPS la resuelve Traccar, un producto maduro y probado. El desarrollo propio se concentra en la lógica de negocio y la presentación.

### Fuera de alcance (versión 1)

- Control de asistencia con horarios obligatorios
- Gestión de pagos o viáticos
- App propia desarrollada desde cero
- Soporte para iOS (solo Android en esta etapa)

---

## 2. Estado actual

### Fase 1 — Completada

| Componente | Detalle |
|---|---|
| VPS | Ubuntu, IP `13.140.40.204`, gestionado con **Dokploy** (panel en el puerto 3000) |
| Traccar Server | Contenedor Docker, puerto **8082**, con MySQL (`mysql:lts`) |
| Traccar Client | App oficial de Play Store instalada en celulares de prueba |
| Pruebas de campo | Recorridos registrados sin cortes, ~4.5 km, con el celular en movimiento |
| Geocercas | Sectores dibujados directamente en Traccar |
| Dispositivos | Creados con atributos personalizados: `dni`, `placa`, `sector_asignado` |

### Fase 2 — Código escrito, pendiente de desplegar

Servicio de sincronización en Node.js. Lee la API de Traccar, arma sesiones y clasifica puntos contra el sector. **Requiere los ajustes descritos en la sección 6.1 antes de desplegarse.**

### Fase 3 — Por construir

Panel web para supervisores. Es el grueso del trabajo pendiente.

---

## 3. Arquitectura

```
┌──────────────────────┐
│  Traccar Client      │  App oficial en el celular del perifoneador
│  (Android)           │  GPS en segundo plano, búfer sin conexión
└──────────┬───────────┘
           │ protocolo OsmAnd, puerto 5055
┌──────────▼───────────┐
│  Traccar Server      │  Captura y almacena posiciones
│  :8082               │  Geocercas = sectores
└──────────┬───────────┘
           │ API REST (lectura cada 2 min)
┌──────────▼───────────┐      ┌──────────────────┐
│  API Perifoneo       │◄─────┤  Panel web       │
│  Node.js :3001       │      │  React + Leaflet │
│  Motor de sesiones   │      │  Supervisores    │
└──────────┬───────────┘      └──────────────────┘
           │
┌──────────▼───────────┐
│  MySQL 8             │  BD `traccar` (no se toca)
│                      │  BD `perifoneo` (propia)
└──────────────────────┘
```

### Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Captura GPS | Traccar Client + Traccar Server | Producto de terceros, sin desarrollo |
| Backend | Node.js 22, Express, mysql2, @turf/turf | ES Modules |
| Base de datos | MySQL 8 con funciones espaciales | Base `perifoneo`, separada de la de Traccar |
| Frontend | React 18 + Vite, Leaflet, OpenStreetMap | Sin costo de licencias de mapas |
| Despliegue | Docker vía Dokploy | Mismo VPS |

### Regla inviolable

**El servicio nunca escribe en la base de datos de Traccar.** Solo consume su API REST. Una escritura directa puede corromper el historial y romperse con cada actualización de Traccar.

---

## 4. Reglas de negocio

### 4.1 Sesión (recorrido)

No existe un botón de "iniciar jornada". Las sesiones se **detectan automáticamente** a partir del flujo de puntos GPS:

- Una sesión **abre** con el primer punto recibido tras un silencio.
- Una sesión **cierra** cuando transcurren más de `GAP_SESION_MIN` minutos sin puntos nuevos (25 por defecto).
- Un mismo perifoneador puede tener **varias sesiones por día**, y cada una se guarda como registro independiente con su propio identificador, hora de inicio, hora de fin y métricas.
- Las sesiones de menos de `DURACION_MINIMA_MIN` minutos (10) se descartan, para evitar registros basura por arranques accidentales de la app.

### 4.2 Validación por sector

Cada punto se marca como dentro o fuera del polígono del sector asignado, con una **tolerancia de 50 metros** (`TOLERANCIA_METROS`) que compensa el error normal del GPS urbano.

El cálculo es **por tramos**: el intervalo entre dos puntos consecutivos cuenta como "dentro" solo si **ambos extremos** están dentro del sector. Un desvío de 20 minutos resta 20 minutos, no invalida el recorrido completo.

Los tramos con más de `GAP_TRAMO_MAX` minutos de separación (20) se descartan del cómputo: corresponden a cortes de señal y no representan tiempo trabajado verificable.

### 4.3 Sin veredicto automático

El sistema **no clasifica** las sesiones como válidas o inválidas. Entrega:

- Minutos totales, minutos dentro del sector, minutos fuera
- Kilómetros totales y kilómetros dentro del sector
- Porcentaje de permanencia en el sector
- Tiempo detenido (velocidad cercana a cero)

El estado de una sesión solo puede ser `EN_CURSO`, `FINALIZADA` o `DESCARTADA`, que son hechos, no evaluaciones.

### 4.4 Filtros de calidad del GPS

Se descartan antes de guardar:

- Precisión peor a 100 metros (`PRECISION_MAX_M`)
- Velocidad mayor a 80 km/h (`VELOCIDAD_MAX_KMH`): salto de GPS o no es perifoneo
- Puntos marcados como ubicación simulada (`mock`)

### 4.5 Reproceso

Todos los umbrales son configurables por variables de entorno, y existe un endpoint de recálculo que reprocesa un rango de fechas. Cambiar una regla o corregir un polígono **no obliga a perder el histórico**.

---

## 5. Modelo de datos

Base de datos `perifoneo`, MySQL 8. Esquema completo en `schema.sql`.

| Tabla | Propósito |
|---|---|
| `sectores` | Espejo de las geocercas de Traccar. Guarda el polígono original y el expandido con la tolerancia, en columnas `GEOMETRY` y como GeoJSON para el frontend |
| `dispositivos` | Espejo de los dispositivos de Traccar, más DNI, placa, teléfono, modelo del celular y sector asignado |
| `asignaciones_sector` | Historial de asignaciones con vigencia (`desde`, `hasta`). Permite reasignar sin perder el pasado |
| `sesiones` | Un registro por recorrido detectado, con todas las métricas calculadas |
| `puntos` | Puntos GPS ya clasificados. Clave única sobre el id de posición de Traccar para impedir duplicados |
| `sync_estado` | Marca hasta qué instante se sincronizó cada dispositivo. Permite reinicios sin pérdida ni duplicación |

### Nota técnica sobre geometría en MySQL

`ST_Buffer` no opera sobre coordenadas geográficas en MySQL. Por eso el polígono expandido se calcula **al importar la geocerca**, en Node con Turf.js, y se persiste. Las distancias se calculan con haversine en la aplicación.

**Traccar escribe las geocercas con la latitud primero** (`POLYGON((lat lon, ...))`), al revés del estándar GeoJSON. El parser ya lo contempla; ignorarlo coloca los sectores en el hemisferio equivocado.

---

## 6. Trabajo pendiente

### 6.1 Ajustes a la API (prioridad alta, ~2 horas)

El código existente incluye una clasificación de cumplimiento que fue descartada por decisión de negocio. Hay que retirarla:

- [ ] En `schema.sql`, cambiar el ENUM de `sesiones.estado` a `('EN_CURSO','FINALIZADA','DESCARTADA')`
- [ ] En `sync.js`, simplificar `calcularEstado()`: eliminar los umbrales de 80% y 40%
- [ ] Eliminar las variables `UMBRAL_VALIDA` y `UMBRAL_PARCIAL` de `config.js` y del `.env.example`
- [ ] Agregar el cálculo de **minutos detenido**: sumar los tramos con velocidad menor a 3 km/h en ambos extremos, y persistirlo en una columna nueva `minutos_detenido`
- [ ] Cambiar el puerto por defecto a **3001** (el 3000 lo ocupa Dokploy)
- [ ] En `/api/vivo`, bajar el umbral de alerta de silencio a 10 minutos (posible ahora que la detección de parada está apagada en los celulares)

### 6.2 Despliegue de la API (prioridad alta, ~3 horas)

- [ ] Crear la base `perifoneo` y su usuario en el MySQL existente. La contraseña de root está en el Compose File de Dokploy
- [ ] Cargar `schema.sql`
- [ ] Publicar el código en un repositorio **privado** de GitHub
- [ ] Crear la aplicación en Dokploy apuntando al repositorio, con las variables de entorno del `.env.example`
- [ ] Conectar el contenedor a la **misma red Docker** que Traccar y MySQL. Opción recomendada: incorporar el servicio al Compose File existente
- [ ] Verificar `GET /api/salud`: debe devolver la versión de Traccar y los conteos de dispositivos y sectores
- [ ] Validar contra los datos reales de prueba que las sesiones detectadas coinciden con los recorridos efectivamente realizados

### 6.3 Autenticación (prioridad alta, ~4 horas)

La API no tiene control de acceso. **No debe exponerse a internet sin esto.**

- [ ] Tabla `usuarios_panel`: id, email, nombre, `password_hash` (bcrypt o argon2), rol, activo
- [ ] `POST /api/auth/login` que devuelve un JWT con expiración de 12 horas
- [ ] Middleware que proteja todas las rutas salvo login y salud
- [ ] Dos roles: **ADMIN** (todo) y **SUPERVISOR** (solo lectura, limitado a los dispositivos que tenga asignados)
- [ ] Tabla `auditoria`: quién consultó o modificó qué y cuándo

### 6.4 Panel web (prioridad alta, ~4–5 días)

Aplicación React independiente que consume la API. Cuatro pantallas.

#### Pantalla 1 — Mapa en vivo

Es la vista de inicio del supervisor.

- Mapa de Tacna con los polígonos de todos los sectores, cada uno con su color
- Un marcador por perifoneador activo, con la inicial o el nombre visible
- Actualización automática cada 30 segundos, consumiendo `GET /api/vivo`
- Semáforo de estado: **verde** reportando con normalidad, **ámbar** entre 5 y 10 minutos sin reportar, **rojo** más de 10 minutos
- Panel lateral con la lista de personas y su estado, ordenable
- Al hacer clic en un marcador: ficha con nombre, DNI, teléfono con enlace para llamar, sector, hora del último reporte, velocidad y batería
- Filtro por sector y por supervisor a cargo

#### Pantalla 2 — Historial de recorridos

- Tabla de sesiones consumiendo `GET /api/sesiones`
- Filtros: rango de fechas, perifoneador, sector
- Columnas: fecha, perifoneador, sector, hora de inicio, hora de fin, duración, minutos dentro, minutos fuera, % dentro, km, tiempo detenido
- Ordenable por cualquier columna, con paginación
- Totales al pie del listado filtrado
- Botón **Exportar a Excel** del resultado filtrado
- Una fila por sesión: si alguien hizo 4 recorridos en un día, aparecen las 4 por separado

#### Pantalla 3 — Detalle de un recorrido

Se abre al seleccionar una fila del historial. Consume `GET /api/sesiones/:id/ruta`.

- Mapa con el polígono del sector como fondo
- La ruta dibujada en **dos colores**: verde los tramos dentro del sector, rojo los tramos fuera. El campo `dentro_sector` ya viene marcado punto por punto
- Marcadores de inicio y fin con sus horas
- **Control de reproducción**: barra de tiempo que permite avanzar el recorrido, con velocidad ajustable (1x, 5x, 20x) y visualización de la hora, velocidad y batería en cada instante
- Panel de métricas de la sesión
- Botones para exportar la ruta a GPX o KML, y para imprimir la vista

#### Pantalla 4 — Reportes

- Consume `GET /api/resumen`
- Acumulado por perifoneador en un rango de fechas: cantidad de sesiones, horas totales, horas dentro del sector, porcentaje promedio, kilómetros, última actividad
- Vista alternativa agrupada **por sector**: qué zonas recibieron cobertura y cuáles quedaron desatendidas
- Exportación a Excel
- Generación de un **informe individual en PDF** por perifoneador, con sus recorridos del periodo y un mapa resumen. Es el entregable que el supervisor firma

#### Administración (dentro del panel)

- Listado de perifoneadores con su sector, con opción de reasignar. Al reasignar, ofrecer recalcular el histórico
- Listado de sectores con la cantidad de personas asignadas
- Botón para forzar la reimportación desde Traccar
- Gestión de usuarios del panel

### 6.5 Configuración masiva de celulares (prioridad media, ~2 horas)

Traccar Client admite configuración por **enlace profundo en código QR**:

```
traccar://client?id=DNI&url=http://SERVIDOR:8082&accuracy=highest
&distance=20&interval=60&angle=15&buffer=true&wakelock=true&stop_detection=false
```

Ya existe una herramienta HTML que genera las tarjetas imprimibles a partir de una lista de nombres y DNI.

- [ ] Verificar en campo que todos los parámetros se aplican en la versión instalada de la app
- [ ] Generar las tarjetas de los 60 perifoneadores
- [ ] Redactar una guía de una página: instalar APK, escanear QR, activar seguimiento, quitar optimización de batería, y en Xiaomi activar el inicio automático

**Configuración estándar acordada:** precisión alta, distancia 20 m, ángulo 15°, intervalo 60 s, detección de parada **apagada**, bloqueo de suspensión **encendido**, búfer sin conexión **encendido**.

La detección de parada se apaga deliberadamente: con ella encendida el sistema no puede distinguir entre un vehículo detenido y una app cerrada, lo que corta recorridos y vuelve poco fiables las alertas.

### 6.6 Seguridad e infraestructura (prioridad media, ~3 horas)

- [ ] Dominio con certificado **HTTPS** mediante el proxy de Dokploy, para el panel y para Traccar
- [ ] Migrar la URL de los celulares de IP a dominio **antes** de repartir los QR: si el servidor cambia de IP, con dominio no hay que reconfigurar 60 equipos
- [ ] Cerrar el puerto 3000 de Dokploy al público o restringirlo por IP
- [ ] Desactivar el registro público de usuarios en Traccar
- [ ] Respaldo diario automático de ambas bases, con copia fuera del servidor y retención de 30 días. **Probar una restauración**
- [ ] Monitoreo de disponibilidad con alerta (Uptime Kuma u otro)

### 6.7 Vista del perifoneador (prioridad baja, posterior)

Página web simple, accesible con un enlace personal, donde cada persona vea sus propios recorridos y horas. No requiere app adicional. Se construye una vez estabilizado el panel del supervisor.

---

## 7. Cumplimiento legal

Responsabilidad de la campaña, no del equipo técnico, pero condiciona el despliegue.

- **Ley N.° 29733 de Protección de Datos Personales.** Se tratan DNI y geolocalización. Se requiere **consentimiento informado firmado** por cada perifoneador, indicando qué se registra, con qué finalidad y por cuánto tiempo se conserva. Registrar la fecha de firma en el sistema.
- **Rastreo limitado a la jornada.** El perifoneador controla el interruptor de la app y puede apagarlo al terminar. El sistema no rastrea fuera de ese periodo y esa capacidad debe comunicarse con claridad al equipo.
- **Retención.** Definir una fecha de eliminación de los datos al cierre de la campaña.
- **Normativa electoral del JNE** sobre plazos de propaganda y silencio electoral, y **ordenanzas municipales** de Tacna sobre ruido y horarios de perifoneo.

---

## 8. Plan de trabajo sugerido

| Orden | Tarea | Estimado | Bloquea a |
|---|---|---|---|
| 1 | Ajustes a la API (6.1) | 2 h | 2 |
| 2 | Despliegue de la API (6.2) | 3 h | 4 |
| 3 | Autenticación (6.3) | 4 h | 4 |
| 4 | Panel: mapa en vivo (6.4.1) | 1 d | — |
| 5 | Panel: historial + detalle con reproducción (6.4.2 y 6.4.3) | 2 d | — |
| 6 | Panel: reportes y exportación (6.4.4) | 1 d | — |
| 7 | QR y guía de usuario (6.5) | 2 h | Piloto |
| 8 | HTTPS, dominio y respaldos (6.6) | 3 h | Producción |
| 9 | Piloto con 5 perifoneadores | 2 d | Despliegue total |
| 10 | Despliegue a los 60 | — | — |

**No desplegar a los 60 sin pasar por el piloto.** Los problemas reales aparecen en campo: modelos de celular que cierran la app, zonas sin cobertura, usuarios que olvidan activar el seguimiento.

---

## 9. Criterios de aceptación

El sistema se considera terminado cuando:

1. Un supervisor abre el panel y ve en el mapa a todos los perifoneadores activos, con menos de 3 minutos de desfase.
2. Si alguien deja de reportar por más de 10 minutos, aparece en rojo en el listado.
3. Consultando cualquier fecha pasada, se obtiene la lista de recorridos de cada persona, con hora de inicio, hora de fin y duración.
4. Al abrir un recorrido, se ve la ruta sobre el mapa diferenciando por color los tramos dentro y fuera del sector, y se puede reproducir cronológicamente.
5. Una persona con 4 recorridos en un día muestra 4 registros independientes y consultables por separado.
6. El reporte de un rango de fechas se exporta a Excel con los totales por perifoneador.
7. Un perifoneador nuevo queda operativo instalando el APK y escaneando su QR, sin configurar nada manualmente.
8. Reiniciar el servidor no produce pérdida ni duplicación de datos.

---

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Android cierra la app en segundo plano | Alto | Bloqueo de suspensión activo, exclusión de optimización de batería, celular en soporte cargando. Alerta de silencio a los 10 min |
| El usuario olvida activar el seguimiento | Alto | Alerta al supervisor, que llama. Notificación permanente visible en el celular |
| Marcas agresivas (Xiaomi, Huawei) | Medio | Inventario de marcas y modelos, prueba previa de un equipo por marca, guía con capturas |
| Zonas sin cobertura móvil | Medio | Búfer sin conexión activado: los puntos se guardan y se sincronizan al recuperar señal |
| Error de GPS en calles del borde del sector | Medio | Tolerancia de 50 m y validación por tramos, no de todo o nada |
| Manipulación con ubicación simulada | Bajo | Los puntos marcados como `mock` se descartan |
| Caída del VPS en plena campaña | Alto | Monitoreo con alerta, respaldos diarios probados |

---

## 11. Convenciones

- **Nombres de base de datos, variables y endpoints en español**, siguiendo el dominio del negocio.
- Todas las fechas se almacenan en **UTC**; la conversión a `America/Lima` se hace en la capa de presentación.
- Toda regla de negocio ajustable vive en variables de entorno, nunca escrita en el código.
- Todo cálculo debe ser **idempotente y reprocesable**: correr la sincronización dos veces no puede alterar los resultados.
- La velocidad llega desde Traccar en **nudos** y se convierte a km/h multiplicando por 1.852.

---

## 12. Anexo: endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/salud` | Estado del servicio y conexión con Traccar |
| GET | `/api/sectores` | Sectores con su polígono en GeoJSON |
| GET | `/api/dispositivos` | Perifoneadores y su sector asignado |
| GET | `/api/sesiones` | Listado con filtros de fecha, dispositivo y sector |
| GET | `/api/sesiones/:id/ruta` | Puntos de la ruta y polígono del sector |
| GET | `/api/resumen` | Acumulado por perifoneador en un rango |
| GET | `/api/vivo` | Última posición y estado de cada dispositivo |
| POST | `/api/importar` | Reimporta sectores y dispositivos desde Traccar |
| POST | `/api/sincronizar` | Fuerza un ciclo de sincronización |
| POST | `/api/recalcular` | Reprocesa un rango de fechas |

El listado de sesiones **no incluye los puntos** de forma deliberada: una sesión de dos horas contiene entre 1,500 y 2,000 coordenadas, y cargarlas en el listado saturaría el navegador. Los puntos se consultan únicamente al abrir un recorrido concreto.
