# Guía de exploración y pruebas manuales — Frontend Talenti

> Guía práctica para **explorar la aplicación en un navegador** y comprobar a mano las
> etapas cuyo *humo end-to-end* ya se verificó contra la API real (`BD_Bolsa_Trabajo`).
>
> Complementa a `docs/PLAN_TRABAJO.md` (estado y alcance de cada etapa) y a
> `sugerencias.md` (ajustes pendientes en el backend). Última verificación:
> **2026-10-12**.

---

## 1. Alcance: qué se puede probar y qué no

| Etapa | Qué cubre | Estado del E2E | ¿En esta guía? |
|---|---|---|---|
| **F0** | Fundaciones (tipado, build, proxy) | Verificado | Sí (§4.0) |
| **F1** | Registro, login, sesión, logout | ✅ verificado | Sí (§4.1) |
| **F2** | Catálogo, facetas, filtros, detalle | ✅ verificado | Sí (§4.2) |
| **F3** | Perfil y habilidades declaradas | ✅ verificado (sin CV/soft skills) | Sí (§4.3) |
| **F4** | Postular, seguir y retirar postulaciones | ✅ verificado | Sí (§4.4) |
| **F5** | RAG/ATS y evaluaciones | ⏸️ **bloqueada** (Etapa 3 abierta) | **No** |
| **F6** | Analítica self-service y geografía | ✅ verificado (self-service) | Sí (§4.5) |
| **F7** | Superficies de reclutador/admin | API ✅ / **sin UI** | Parcial (§6) |

> **Ninguna etapa está `Cerrada`.** Con el E2E en verde, faltan los pasos siguientes del
> modelo de estados del plan (`test unitarios`, SonarQube, `test seguridad`). Esta guía
> no sustituye esas pruebas.

**Fuera de alcance:** CVs/ingesta, soft skills, matching semántico y evaluaciones (no
están integrados en la UI); alta de ofertas y panel de reclutador (el backend los expone,
la UI no).

---

## 2. Arranque del entorno

### 2.1 Backend (stack Docker)

```bash
cd /home/adjgp/talenti/BD_Bolsa_Trabajo
docker compose up -d          # API en :8000, PostgreSQL solo en la red interna
docker compose ps             # ambos servicios deben estar "healthy"
```

Dos requisitos que **no** se cumplen solos y provocan fallos silenciosos (ver
`sugerencias.md` S-14/S-15):

1. **El esquema debe estar aplicado.** El arranque no ejecuta migraciones: si la base
   está vacía, `/health` responde `200` pero **todo** endpoint de datos responde `500`.
   Bootstrap manual en `docs/DEPLOYMENT.md §4` (migraciones `0000`–`0019` + seeds).
2. **`AUTH_SIGNING_KEY` debe ser una clave RSA real** en `.env` (no el texto de ejemplo).
   Con una clave inválida, `/health` sigue en `200` pero **todo el flujo de auth da 500**.

### 2.2 Frontend

```bash
cd /home/adjgp/talenti/Frontend-Talenti
npm install       # solo la primera vez
npm run dev       # Vite en http://localhost:3000
```

Abre **http://localhost:3000** (título esperado: *Talenti — Bolsa de Trabajo*).

- `VITE_API_URL` vacío (por defecto) ⇒ el SPA llama al **mismo origen** y Vite reenvía
  al backend. El navegador nunca hace una petición cross-origin, así que no hace falta CORS.
- Destino del proxy: `VITE_API_PROXY_TARGET` (por defecto `http://localhost:8000`).
  Los prefijos reenviados están en `vite.config.ts` y son los mismos que en `nginx.conf`.

> Si `npm run dev` falla por el shim de Windows en WSL, el equivalente directo es
> `node node_modules/vite/bin/vite.js --port=3000 --host=0.0.0.0` (verificado).

### 2.3 Comprobación rápida del entorno

```bash
curl -s http://localhost:8000/health          # → {"status":"ok"}
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/                  # → 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/health            # → 200 (proxy)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/categories        # → 200 (datos reales)
```

Si `/health` da `200` en el puerto 8000 pero `/categories` da `500`, el problema **no es
el frontend**: falta aplicar el esquema (§2.1).

---

## 3. Datos de prueba disponibles hoy

Al margen del catálogo **`DEMO`** que crea el seed del **Apéndice A**, la base trae lo
sembrado por el backend:

| Recurso | Cantidad |
|---|---|
| Categorías | 12 |
| Habilidades | 16 |
| Países | 18 |
| Empresas / Ofertas del seed `DEMO` | 3 / **6** (todas `published`) |

Ofertas que deberías ver en el catálogo tras aplicar el seed:

| Título | Empresa | Modalidad | Tipo | Salario (COP) | Días publicada |
|---|---|---|---|---|---|
| Desarrollador Backend Senior (Python) | Nimbus Cloud | `remote` | `full_time` | 8.000.000 – 12.000.000 | 12 |
| Ingeniero de Plataforma (Kubernetes) | Nimbus Cloud | `hybrid` | `full_time` | 9.000.000 – 14.000.000 | 5 |
| Diseñador/a de Producto UI | Vela Studio | `remote` | `contract` | 5.000.000 – 7.000.000 | 20 |
| Desarrollador Frontend (React + TypeScript) | Vela Studio | `hybrid` | `full_time` | 6.000.000 – 9.500.000 | 3 |
| Analista de Operaciones Logísticas | Terra Logística | `onsite` | `full_time` | 3.500.000 – 4.800.000 | 30 |
| Practicante de Mejora de Procesos | Terra Logística | `onsite` | `internship` | *(sin salario)* | 8 |

El conjunto está diseñado para que **todos los filtros y facetas tengan datos**: 2 ofertas
por modalidad, 4 `full_time` + 1 `contract` + 1 `internship`, 4 categorías distintas y los
19 vínculos de habilidades que alimentan el radar salarial y la brecha de habilidades.

**Crea tu propia cuenta desde la UI** (§4.1): cualquier correo funciona, p. ej.
`tester@example.com` con contraseña `E2Epassword1!`.

La UI **no** tiene alta de ofertas (F7 sin UI): para más datos usa el seed (Apéndice A, es
idempotente) o la API (§7.3).

---

## 4. Pruebas por etapa

Abre las **herramientas de desarrollo del navegador** (F12) en la pestaña *Network*: en
cada paso conviene confirmar que la petición sale al endpoint esperado y devuelve `200`.

### 4.0 F0 — Fundaciones

| # | Paso | Resultado esperado |
|---|---|---|
| 0.1 | Abrir `http://localhost:3000` | Carga el catálogo; sin errores de CORS en la consola |
| 0.2 | Recargar con la API caída (`docker compose stop web`) | Bloque *«No se pudieron cargar los datos»* con **Reintentar**; **no** una lista vacía falsa |
| 0.3 | Volver a levantar la API y pulsar **Reintentar** | La lista se carga |

### 4.1 F1 — Autenticación e identidad

Entra a la pantalla de auth desde el botón **Iniciar sesión** de la barra superior o
navegando a **Mi Perfil** / **Estadísticas** / **Postulaciones** (vistas privadas).

| # | Paso | Resultado esperado |
|---|---|---|
| 1.1 | Pestaña **Crear cuenta** → rellenar nombre, correo y contraseña (≥ 8) → **Registrarme** | `POST /api/v1/auth/register` → `201`; la pantalla se cierra y vuelves al catálogo |
| 1.2 | Cerrar sesión (icono ⍈ abajo en la barra lateral) y volver a entrar con **Iniciar sesión** | `POST /api/v1/auth/login` → `200` |
| 1.3 | Con la sesión iniciada, **recargar la página** (F5) | Sigues autenticado: en el arranque se llama a `POST /api/v1/auth/refresh` y se canjea el *refresh token* |
| 1.4 | Iniciar sesión con contraseña incorrecta | `401` → mensaje **«Correo o contraseña incorrectos.»** |
| 1.5 | Registrarte con un correo ya existente | `409` → **«Ese correo ya está registrado.»** |
| 1.6 | Repetir el login fallido muchas veces seguidas (> 10 escrituras/min) | `429` → mensaje con los segundos de `Retry-After` |
| 1.7 | Con la sesión iniciada, cerrar sesión | Vuelves a *Invitado*; **en la pestaña Network** `/auth/logout` responde `401` (ver S-17) y `/auth/logout/refresh` responde `200` |

Detalles para observar:

- El **access token vive solo en memoria**; el *refresh token* sí se persiste en
  `localStorage` con la clave `talenti_refresh_token`.
- Tras cerrar sesión, en *Application → Local Storage* **no** debe quedar
  `talenti_refresh_token` (sí pueden quedar tema, idioma y guardados).
- **S-17 (esperado, no es un fallo de tu entorno):** el access token no se puede revocar
  en el backend, así que `/auth/logout` devuelve `401`. La sesión se revoca por el lado del
  *refresh token*. No lo reportes como bug nuevo; ya está en `sugerencias.md`.

### 4.2 F2 — Catálogo de ofertas (vista dividida)

Vista **Ofertas** (por defecto). Columna izquierda = lista + filtros, derecha = detalle.

| # | Paso | Resultado esperado |
|---|---|---|
| 2.1 | Observar la lista | Las 6 ofertas del seed `DEMO`, con logo/insignias generadas y fecha relativa |
| 2.2 | Escribir `Backend` en la barra de búsqueda | Se filtra por `search_term`; el contador de la derecha cambia |
| 2.3 | Pulsar un chip de **Modalidad** (p. ej. Remoto) | Se envía `work_mode=remote`; el conteo del chip sale del panel de facetas real |
| 2.4 | Elegir **Salario mínimo** `≥ $50k` | Se envía `min_salary` (en centavos: valor × 100) |
| 2.5 | Pulsar un chip de **Categoría** | Se envía `category_id` |
| 2.6 | Con texto en la búsqueda, revisar el selector de orden | Aparece **Más relevantes** (`sort=relevance`); sin texto solo **Más Recientes** |
| 2.7 | Pulsar **Restablecer** | Se limpian todos los filtros activos |
| 2.8 | Seleccionar una oferta | La derecha carga `GET /job-offers/{id}` y aparece la **descripción real** |
| 2.9 | En el detalle, revisar los datos de la oferta | **Modalidad** y **tipo de empleo** aparecen aquí (en la tarjeta de la lista no) |
| 2.10 | Atajos de teclado: `J` / `K` navegan; `A` abre postular; `S` guarda; `T` cambia tema; `?` abre ayuda | Todos funcionan sin tocar el ratón |
| 2.11 | `Cmd/Ctrl + K` | Se abre la paleta de comandos; busca por título, empresa o ubicación y permite filtrar por Remoto, ir a Guardados, cambiar tema y restablecer filtros |

Qué **no** debes reportar como error (limitaciones conocidas del backend):

- En las tarjetas del listado **no** aparecen los chips de modalidad ni de tipo de empleo
  (**S-02**: el resumen del listado no los expone).
- En el detalle **no** hay bloque de tecnologías/habilidades clave (**S-05**).
- No hay orden por salario (**S-06**).
- **Paginación:** solo se carga la **primera página** (`page_size=20`). Con 3 ofertas no se
  nota; con más de 20 no habrá forma de ver el resto desde la UI.
- Si un filtro no devuelve nada, aparece *«No se encontraron oportunidades con estos filtros»*
  con **Limpiar Todos los Filtros**.

> **Defecto conocido (F2):** la vista **Guardados** de la barra lateral y el botón
> **Guardados** de la barra superior cambian de estado visual y muestran el contador, pero
> **no filtran el listado**: se sigue viendo el catálogo completo
> (`onlySaved`/`onlyApplied` no se aplican al resultado). Los guardados sí se persisten en
> `localStorage` (`talenti_saved_jobs`). Está registrado como pendiente en
> `docs/PLAN_TRABAJO.md` §5 (F2).

### 4.3 F3 — Perfil de candidato y habilidades

Vista **Mi Perfil**.

| # | Paso | Resultado esperado |
|---|---|---|
| 3.1 | Entrar sin perfil creado | `GET /profiles/me` → **`404`** y aviso azul *«Aún no tienes perfil»*. **Es el comportamiento correcto**, no un error |
| 3.2 | Dejar el **titular** vacío y pulsar **Crear perfil** | Bloquea con validación local; **no** se hace ninguna petición |
| 3.3 | Rellenar titular, bio, teléfono, ubicación, años de experiencia y pulsar **Crear perfil** | `POST /profiles` → `201`; aparece **«Perfil guardado»** y la insignia de candidato verificado |
| 3.4 | Cambiar el titular y pulsar **Guardar cambios** | `PATCH /profiles/me` → `200` |
| 3.5 | **Recargar** la página | El perfil se relee de la API y el formulario se rellena con los valores guardados |
| 3.6 | En **Habilidades declaradas**, pulsar varios chips | Se marcan en azul; el contador sube (`n/50`) |
| 3.7 | Pulsar **Guardar cambios** | `PUT /profiles/skills` con los **slugs**; la respuesta repite el conjunto declarado |
| 3.8 | Desmarcar dos chips y volver a guardar | El endpoint es **declarativo**: los no enviados se eliminan; recarga para confirmar el *round-trip* |

### 4.4 F4 — Postulaciones de extremo a extremo

| # | Paso | Resultado esperado |
|---|---|---|
| 4.0 | **Prerrequisito:** tener el **perfil creado** (§4.3). El backend lo exige para postular | `POST /applications` → `201` |
| 4.1 | Sin sesión, pulsar **Postular** | El modal muestra *«Inicia sesión para continuar»* con botón **Iniciar sesión** |
| 4.2 | Con sesión, pulsar **Postular** (o `A` sobre una oferta) | Modal de postulación con la nota de presentación (máx. 10.000 caracteres) |
| 4.3 | Escribir una nota y enviar | `POST /applications` → `201`; aparece la confirmación y el marcador de postulado |
| 4.4 | Reabrir el modal de la misma oferta | El botón dice **«Ya postulado»** y está deshabilitado |
| 4.5 | Mirar la barra lateral | El icono de **Postulaciones** muestra el número de postulaciones activas |
| 4.6 | Ir a **Postulaciones** | `GET /applications` → `200`; cada fila muestra empresa, **fecha** y estado (*Enviada*) |
| 4.7 | Pulsar **Retirar** | `PATCH /applications/{id}` → `200`; el estado pasa a *Retirada* y el botón desaparece |
| 4.8 | Pulsar **Ver oferta** en una fila | Te lleva al catálogo con esa oferta seleccionada |
| 4.9 | Postularte a más de 50 ofertas abiertas | `400` → *«Alcanzaste el límite de postulaciones abiertas.»* |
| 4.10 | Hacer > 10 escrituras en un minuto | `429` con `Retry-After` |

- **Postular exige perfil.** Si pulsas *Enviar* sin haber creado el perfil, el backend
  responde **`404`** y el modal muestra el mensaje literal del servidor:
  *«profile for candidate … does not exist»* (**en inglés**, ver §6). No es un fallo de tu
  entorno: crea el perfil (§4.3) y vuelve a intentarlo.
- El botón **Retirar** usa `PATCH /applications/{id}` **sin cuerpo** (no `…/status`), y ese
  es el camino verificado: pasa la postulación a `withdrawn` y el tracker lo refleja.
- El marcador **«Postulado»** en las tarjetas se calcula con las postulaciones de la
  **primera página** de `GET /applications` (**S-12**): con muchas postulaciones, alguna
  tarjeta podría no mostrarlo.
- Los títulos del tracker se resuelven desde las ofertas ya cargadas (**S-04**); una
  postulación a una oferta fuera de la página actual muestra un texto de reserva con el id.

### 4.5 F6 — Analítica self-service

Vista **Estadísticas** (requiere sesión). Consume los tres endpoints que toman la identidad
del token y **no** necesitan rol.

| # | Paso | Resultado esperado |
|---|---|---|
| 5.1 | Entrar sin datos | Los KPIs salen a `—`/`0` y los bloques dicen *«Aún no hay datos suficientes para calcular esta métrica.»* |
| 5.2 | Con perfil creado y `python`, `postgresql`, `docker` declaradas, recargar | **Radar salarial** en `COP`, **2 ofertas comparadas** y los cuatro percentiles (25/50/75/90) |
| 5.3 | Revisar **Brecha de habilidades** | Lista de habilidades que piden las ofertas y no tienes (`agile`, `aws`, `english`, `kubernetes`…) con `n` *ofertas la piden* |
| 5.4 | Revisar **Tasa de respuesta** | Porcentaje y `Con respuesta: x / Postulaciones: y`, con la ventana en días |
| 5.5 | Cancelar la petición y recargar (o parar la API) para forzar el error | Bloque de error con **Reintentar** |

- El radar se alimenta de las ofertas que **comparten habilidades** con tu perfil: sin
  habilidades declaradas (o sin ofertas con habilidades) el resultado es `[]` y se muestra
  el mensaje de «sin datos suficientes». Es correcto, no un fallo.
- La analítica de **empresa** y de **plataforma** (funnel, time-to-hire, barómetro, ROI…)
  no está en esta vista y requiere rol admin (**§6**).

---

## 5. Verificar el contrato API ↔ UI (Network)

En cada paso puedes comprobar en *Network* que la UI **no inventa datos**. Claves exactas
que devuelve la API (verificadas 2026-10-12):

| Petición | Consumidor | Claves de la respuesta |
|---|---|---|
| `POST /api/v1/auth/login\|register\|refresh` | `authApi`, `useAuthStore` | `access_token`, `refresh_token`, `token_type`, `expires_in` |
| `GET /job-offers` | `useJobs`, `FilterBar` | `items`, `total`, `page`, `page_size`, `total_pages`, `facets` |
| `GET /job-offers` → `items[]` | `jobAdapter.summaryToJob` | `id`, `company_id`, `company_name`, `category_id`, `category_name`, `title`, `status`, `location`, `salary_min_cents`, `salary_max_cents`, `salary_currency`, `published_at` |
| `GET /job-offers/{id}` | `useJobDetail` | las anteriores **+** `description`, `modality`, `employment_type`, `city_id`, `closes_at` |
| `facets` | `FilterBar` | `categories[]{id,name,count}`, `work_modes[]{value,count}`, `employment_types[]{value,count}`, `salary_ranges[]{range,count}` |
| `GET\|POST /profiles`, `PATCH /profiles/me` | `profilesApi`, `ProfileView` | `id`, `user_id`, `headline`, `bio`, `phone`, `location`, `city_id`, `resume_url`, `is_open_to_work`, `experience_years`, `created_at` |
| `GET /skills`, `GET\|PUT /profiles/skills` | `ProfileView` | `skill_id`, `slug`, `name` |
| `POST\|GET /applications` → `items[]` | `useApply`, `ApplicationsView` | `id`, `job_offer_id`, `candidate_id`, `status`, `created_at` (**+** `cover_letter`, `noted_by_recruiter` en el detalle) |
| `GET /analytics/salary-radar` | `DashboardInsightsView` | `salary_currency`, `matched_offers`, `percentiles[]{percentile, salary_min_cents, salary_max_cents}` |
| `GET /analytics/skill-gap` | `DashboardInsightsView` | `skill_id`, `slug`, `name`, `offers` |
| `GET /analytics/response-rate` | `DashboardInsightsView` | `applications`, `responses`, `response_rate`, `window_days` |

Compruébalo: los salarios llegan en **centavos** y la UI los divide entre 100;
`modality`/`employment_type` llegan como `remote|hybrid|onsite` y
`full_time|part_time|contract|temporary|internship`, y la UI los traduce a etiquetas.

---

## 6. Hallazgos conocidos: qué NO es un fallo de tu entorno

| ID | Cómo se manifiesta | ¿Bloquea tu prueba? |
|---|---|---|
| **S-02** | El listado no muestra modalidad ni tipo de empleo (sí el detalle) | No |
| **S-03** | No hay `GET /auth/me`: la sesión se construye con los *claims* del token y **no hay roles** en la UI | No |
| **S-04** | El tracker resuelve títulos desde las ofertas ya cargadas | No |
| **S-05** | El detalle no tiene bloque de habilidades de la oferta | No |
| **S-06** | No existe orden por salario | No |
| **S-09** | Un reclutador **no puede** avanzar el estado de una postulación (`403 not_your_application_error`) | Sí, para F7 |
| **S-10** | Los guardados viven en `localStorage`, no en el backend | No |
| **S-12** | El marcador «ya postulado» solo cubre la primera página | No |
| **S-14** | Con la BD sin esquema, `/health` da `200` y los datos `500` | Sí, hasta aplicar el esquema |
| **S-15** | Con `AUTH_SIGNING_KEY` inválida, todo auth da `500` | Sí, hasta recrear `web` |
| **S-17** | `/auth/logout` responde `401` con un access token (el refresh sí se revoca) | No |
| **S-18** | `GET /analytics/offer-demand-ratio` responde `500` | No: la UI **no** consume ese endpoint |
| **—** | La vista/botón **Guardados** no filtra el listado (defecto propio, ver §4.2) | No |
| **—** | Postular **exige perfil creado**; sin él el backend devuelve `404` y el modal muestra el texto en inglés *«profile for candidate … does not exist»* | No |

**F7 sin UI:** las superficies de reclutador/admin no existen en esta iteración. Los
endpoints de empresa, membresías y ofertas **sí** funcionan: se pueden probar por API
(§7.3). Requieren rol distinto al de un candidato recién registrado para las métricas de
empresa/plataforma (`403 authorization_error`).

---

## 7. Verificación directa contra la API (sin navegador)

Útil para aislar si un fallo es de la UI o del backend. Todo va contra `:8000`.

### 7.1 Alta y sesión

```bash
RUN=$(date +%s)
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"manual_$RUN@example.com\",\"password\":\"E2Epassword1!\",\"full_name\":\"Tester\"}"
# → 201 con access_token / refresh_token
```

### 7.2 Catálogo, detalle y filtros

```bash
curl -s 'http://localhost:8000/job-offers?page=1&page_size=20' | head -c 400
curl -s 'http://localhost:8000/job-offers?work_mode=remote' | python3 -c 'import json,sys;print(json.load(sys.stdin)["total"])'
curl -s 'http://localhost:8000/job-offers?search_term=Backend' | python3 -c 'import json,sys;print(json.load(sys.stdin)["total"])'
curl -s 'http://localhost:8000/categories' | head -c 300
curl -s 'http://localhost:8000/geography/countries' | head -c 300
```

### 7.3 Flujo autenticado y alta de ofertas (F7 por API)

```bash
TOKEN='<pega aquí el access_token>'
B="http://localhost:8000"

# perfil y habilidades
curl -s -X POST "$B/profiles" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"headline":"Tester","experience_years":3,"is_open_to_work":true}'
curl -s -X PUT "$B/profiles/skills" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"skills":["git","english"]}'          # OJO: son SLUGS, no ids

# empresa (el slug solo admite minúsculas, dígitos y guiones BAJOS) y oferta
CID=$(curl -s -X POST "$B/companies" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Mi Empresa","slug":"mi_empresa_manual"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
CAT=$(curl -s "$B/categories" | python3 -c 'import json,sys;print(json.load(sys.stdin)[0]["id"])')
OID=$(curl -s -X POST "$B/job-offers" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"company_id\":\"$CID\",\"category_id\":\"$CAT\",\"title\":\"Puesto manual\",\"description\":\"Prueba\"}" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
curl -s -X PATCH "$B/job-offers/$OID/publish" -H "Authorization: Bearer $TOKEN"   # → published

# postularse y ver el tracker
curl -s -X POST "$B/applications" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"job_offer_id\":\"$OID\",\"cover_letter\":\"Hola\"}"
curl -s "$B/applications?page=1&page_size=20" -H "Authorization: Bearer $TOKEN"
```

> Las **escrituras** están limitadas a **10/min** por usuario; una ráfaga devuelve `429`
> con `Retry-After`.

---

## 8. Checklist de regresión rápida

Marca cada fila al terminar una sesión de pruebas manuales.

| # | Comprobación | Esperado |
|---|---|---|
| 1 | `/health` y `/job-offers` responden | `200` |
| 2 | El catálogo carga ofertas reales | Sí, sin datos inventados |
| 3 | Búsqueda, modalidad, salario y categoría filtran | El contador cambia |
| 4 | El detalle muestra la descripción real | Sí |
| 5 | Registro crea sesión | `201` y vuelve al catálogo |
| 6 | Login con contraseña mala | `401` + mensaje |
| 7 | Recarga conserva la sesión | Sí (vía refresh) |
| 8 | Logout deja *Invitado* y borra `talenti_refresh_token` | Sí |
| 9 | Perfil: aviso de «sin perfil» antes de crear | Sí |
| 10 | Crear y editar perfil persisten tras recargar | Sí |
| 11 | Habilidades: guardar y recargar mantiene el conjunto | Sí |
| 12 | Postular crea la postulación y marca la oferta | `201` + «Ya postulado» |
| 13 | El tracker lista y **Retirar** cambia el estado | Sí |
| 14 | Estadísticas: radar / brecha / tasa de respuesta | Datos reales o «sin datos suficientes» |
| 15 | Con la API caída, mensajes de error con **Reintentar** | Sí, nunca datos falsos |

---

## 9. Limpieza de los datos de prueba

Elbloque del **Apéndice B** borra el conjunto `DEMO` (empresas `demo_*` con sus ofertas,
habilidades y postulaciones) y las cuentas de prueba creadas con los prefijos
`e2e_`/`r7_`/`c7_`/`dbg_`/`dm_`/`f6_`/`rd_`/`lo_`/`fx_`/`smoke_`.

> Está **verificado** ejecutando su contenido contra la base. Tras purgar, el catálogo
> queda **vacío**: vuelve a sembrar con el Apéndice A antes de seguir probando la UI.

El comando, con el `psql` del contenedor:

```bash
cd /home/adjgp/talenti/BD_Bolsa_Trabajo
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < purge.sql
```

> El bloque termina en `COMMIT`: revisa los conteos que imprime antes de darlo por bueno.

---

## 10. Regla de mantenimiento

1. Cuando una etapa pase a `Cerrada` en `docs/PLAN_TRABAJO.md`, actualiza su fila en §1.
2. Si aparece un hallazgo nuevo, regístralo en `sugerencias.md` (backend) o en §6 y en el
   pendiente correspondiente del plan (frontend) **el mismo día**.
3. Al cambiar un contrato de la API, actualiza la tabla de §5: es la referencia contra la
   que se prueba que la UI no inventa datos.

---

## Apéndice A — Seed del conjunto demostración (`DEMO`)

Idempotente: se puede ejecutar varias veces sin duplicar. Guarda el bloque como `seed.sql`
y ejecútalo contra la base del stack:

```bash
cd /home/adjgp/talenti/BD_Bolsa_Trabajo
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < seed.sql
```

```sql
BEGIN;

INSERT INTO companies (name, slug, description, industry, location, is_active) VALUES
  ('Nimbus Cloud',   'demo_nimbus', 'Plataforma de datos en la nube para equipos de producto.', 'Software',  'Bogotá, Colombia',   true),
  ('Vela Studio',    'demo_vela',   'Estudio de producto digital y diseño de interfaz.',        'Diseño',    'Medellín, Colombia', true),
  ('Terra Logística','demo_terra',  'Operación logística regional con base tecnológica.',       'Logística', 'Cali, Colombia',     true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO job_offers
  (company_id, category_id, title, description, status, modality, employment_type,
   location, salary_min_cents, salary_max_cents, salary_currency, published_at)
SELECT c.id, cat.id, v.title, v.description, 'published'::job_offer_status,
       v.modality::work_modality, v.employment_type::employment_type,
       v.location, v.smin, v.smax, 'COP', now() - (v.days || ' days')::interval
FROM (VALUES
  ('demo_nimbus', 'technology', 'Desarrollador Backend Senior (Python)',
   E'Diseñarás y mantendrás servicios en Python sobre PostgreSQL.\n\nBuscamos experiencia en APIs REST, Docker y pruebas automatizadas.',
   'remote', 'full_time', 'Remoto, Colombia', 800000000, 1200000000, 12),
  ('demo_nimbus', 'technology', 'Ingeniero de Plataforma (Kubernetes)',
   E'Operarás el clúster de Kubernetes y la infraestructura de datos del producto.',
   'hybrid', 'full_time', 'Bogotá, Colombia', 900000000, 1400000000, 5),
  ('demo_vela', 'design', 'Diseñador/a de Producto UI',
   E'Diseño de interfaces para productos B2B, en colaboración con el equipo de frontend.',
   'remote', 'contract', 'Remoto, LATAM', 500000000, 700000000, 20),
  ('demo_vela', 'technology', 'Desarrollador Frontend (React + TypeScript)',
   E'Construirás el design system y las vistas del producto en React y TypeScript.',
   'hybrid', 'full_time', 'Medellín, Colombia', 600000000, 950000000, 3),
  ('demo_terra', 'logistics', 'Analista de Operaciones Logísticas',
   E'Análisis de rutas y KPIs operativos. Requiere SQL y comunicación con clientes.',
   'onsite', 'full_time', 'Cali, Colombia', 350000000, 480000000, 30),
  ('demo_terra', 'operations', 'Practicante de Mejora de Procesos',
   E'Apoyo en el mapeo de procesos y el seguimiento de indicadores operativos.',
   'onsite', 'internship', 'Cali, Colombia', NULL, NULL, 8)
) AS v(company_slug, category_slug, title, description, modality, employment_type, location, smin, smax, days)
JOIN companies  c   ON c.slug   = v.company_slug
JOIN categories cat ON cat.slug = v.category_slug
WHERE NOT EXISTS (SELECT 1 FROM job_offers o WHERE o.title = v.title);

INSERT INTO job_skills (id, job_offer_id, skill_id, is_required, created_at, updated_at)
SELECT gen_random_uuid(), o.id, s.id, true, now(), now()
FROM (VALUES
  ('Desarrollador Backend Senior (Python)',      'python'),
  ('Desarrollador Backend Senior (Python)',      'postgresql'),
  ('Desarrollador Backend Senior (Python)',      'docker'),
  ('Desarrollador Backend Senior (Python)',      'english'),
  ('Ingeniero de Plataforma (Kubernetes)',       'kubernetes'),
  ('Ingeniero de Plataforma (Kubernetes)',       'docker'),
  ('Ingeniero de Plataforma (Kubernetes)',       'aws'),
  ('Ingeniero de Plataforma (Kubernetes)',       'agile'),
  ('Diseñador/a de Producto UI',                 'communication'),
  ('Diseñador/a de Producto UI',                 'agile'),
  ('Desarrollador Frontend (React + TypeScript)','react'),
  ('Desarrollador Frontend (React + TypeScript)','typescript'),
  ('Desarrollador Frontend (React + TypeScript)','javascript'),
  ('Desarrollador Frontend (React + TypeScript)','git'),
  ('Analista de Operaciones Logísticas',         'sql'),
  ('Analista de Operaciones Logísticas',         'communication'),
  ('Analista de Operaciones Logísticas',         'teamwork'),
  ('Practicante de Mejora de Procesos',          'agile'),
  ('Practicante de Mejora de Procesos',          'leadership')
) AS m(title, skill_slug)
JOIN job_offers o ON o.title = m.title
JOIN skills     s ON s.slug  = m.skill_slug
WHERE NOT EXISTS (
  SELECT 1 FROM job_skills js WHERE js.job_offer_id = o.id AND js.skill_id = s.id
);

COMMIT;
```

---

## Apéndice B — Purga del conjunto `DEMO` y de las cuentas de prueba

```sql
BEGIN;

DELETE FROM job_skills
 WHERE job_offer_id IN (SELECT id FROM job_offers WHERE company_id IN
   (SELECT id FROM companies WHERE slug LIKE 'demo!_%' ESCAPE '!'));

DELETE FROM applications
 WHERE job_offer_id IN (SELECT id FROM job_offers WHERE company_id IN
   (SELECT id FROM companies WHERE slug LIKE 'demo!_%' ESCAPE '!'))
    OR candidate_id IN (SELECT id FROM auth_users
         WHERE email ~ '^(e2e|r7|c7|dbg|dm|f6|rd|lo|fx|smoke)_[0-9]+@example\.com$');

DELETE FROM job_offers WHERE company_id IN
  (SELECT id FROM companies WHERE slug LIKE 'demo!_%' ESCAPE '!');

DELETE FROM company_memberships WHERE company_id IN
  (SELECT id FROM companies WHERE slug LIKE 'demo!_%' ESCAPE '!');

DELETE FROM companies WHERE slug LIKE 'demo!_%' ESCAPE '!';

DELETE FROM candidate_skills WHERE candidate_id IN
  (SELECT id FROM auth_users WHERE email ~ '^(e2e|r7|c7|dbg|dm|f6|rd|lo|fx|smoke)_[0-9]+@example\.com$');

DELETE FROM profiles WHERE user_id IN
  (SELECT id FROM auth_users WHERE email ~ '^(e2e|r7|c7|dbg|dm|f6|rd|lo|fx|smoke)_[0-9]+@example\.com$');

DELETE FROM auth_users WHERE email ~ '^(e2e|r7|c7|dbg|dm|f6|rd|lo|fx|smoke)_[0-9]+@example\.com$';

-- Revisa los conteos y luego COMMIT; si algo no cuadra, ROLLBACK.
COMMIT;
```
