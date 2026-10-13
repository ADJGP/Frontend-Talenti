# sugerencias.md — Sugerencias de ajuste al Backend (Talenti)

> Registro de los **ajustes o cambios sugeridos al backend** (`BD_Bolsa_Trabajo`)
> detectados al adaptar el frontend de Talenti a las etapas actuales.
>
> Cada sugerencia incluye: **descripción del cambio necesario**, **justificación /
> impacto**, **fecha** y **directorio donde debe aplicarse**.
>
> Última actualización: **2026-10-13** · Origen: `docs/PLAN_TRABAJO.md` (etapas F0–F7)

---

## Convenciones

- **Prioridad:** `Bloqueante` · `Alta` · `Media` · `Baja`.
- **Estado:** `Abierta` · `En revisión` · `Aplicada` · `Descartada`.
- Las rutas de *directorio donde debe aplicarse* son relativas a `BD_Bolsa_Trabajo/`.

---

## Resumen

| ID | Título | Prioridad | Etapa frontend | Estado |
|---|---|---|---|---|
| S-01 | Middleware CORS para orígenes separados | Media-Alta | F0/F1 | Abierta |
| S-02 | `JobOfferSummary` sin `modality` ni `employment_type` | Alta | F2 | Aplicada (`3cb9ba0`) |
| S-03 | Falta endpoint `GET /api/v1/auth/me` (usuario + roles) | Alta | F1 | Aplicada (`3cb9ba0`) |
| S-04 | `ApplicationSummary` sin datos de la oferta | Alta | F4 | En revisión (`3cb9ba0`: campos declarados, respuesta `null`) |
| S-05 | Las ofertas no exponen sus `skills` (`job_skills`) | Media | F2 | Abierta |
| S-06 | `sort` del listado limitado a `date`/`relevance` | Media | F2 | Abierta |
| S-07 | Refresh token viaja en el cuerpo (riesgo XSS) | Media | F1 | Abierta |
| S-08 | Descripción de oferta en texto plano, sin secciones | Baja-Media | F2 | Abierta |
| S-09 | Solo el candidato puede cambiar el estado de su postulación | Alta | F7 | Aplicada (`3cb9ba0`) |
| S-10 | Falta persistencia de "guardados/favoritos" | Media | F2 | Abierta |
| S-11 | `experience_years` vs nivel cualitativo de experiencia | Baja | F2 | Abierta |
| S-12 | Marcar "ya postulado" exige paginar todo `GET /applications` | Baja | F2/F4 | Abierta |
| S-13 | El bucle de bootstrap de `DEPLOYMENT.md §4` omite la migración `0019` | Media | — | Abierta |
| S-14 | El arranque del stack no aplica el esquema ni expone *readiness* de BD | Alta | — | Abierta |
| S-15 | El stack arranca con `AUTH_SIGNING_KEY` inválida: falla en *runtime* con 500 | Alta | F1 | Abierta |
| S-16 | `APP_DB_PASSWORD` con valor placeholder (`CAMBIA_ME…`) en `.env` | Media | — | Abierta |
| S-17 | `POST /auth/logout` valida como refresh: el access token nunca se revoca | Alta | F1 | Aplicada (`3cb9ba0`) |
| S-18 | `GET /analytics/offer-demand-ratio` devuelve **500** siempre (`max(a,b)`) | Alta | F6/F7 | Aplicada (`3cb9ba0`) |
| S-19 | Falta endpoint "mis empresas" (empresas del usuario autenticado) | Media | F7 | Abierta |

---

## S-01 — Middleware CORS para orígenes separados

- **Fecha:** 2026-10-12 · **Prioridad:** Media-Alta · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/main.py` (+ `.env.example`, `docs/DEPLOYMENT.md`)

**Cambio necesario:**
Añadir `fastapi.middleware.cors.CORSMiddleware` al app, con los orígenes permitidos
leídos de una variable de entorno (p. ej. `CORS_ALLOW_ORIGINS`, lista separada por
comas), `allow_credentials=True` y los métodos/cabeceras necesarios
(`Authorization`, `Content-Type`). Documentar la variable en `.env.example` y en
`docs/DEPLOYMENT.md`.

**Justificación / impacto:**
Hoy el backend **no registra CORS en ningún archivo de `src/`**. El despliegue con nginx
del frontend usa *mismo origen* (proxy inverso), por lo que **no** lo necesita. Pero los
escenarios documentados de despliegue directo del SPA (Vercel/Netlify con
`VITE_API_URL`) o de llamada directa desde otro origen quedan imposibles: el navegador
bloquea todas las peticiones. Sin esto, el frontend solo funciona detrás del proxy.

---

## S-02 — `JobOfferSummary` sin `modality` ni `employment_type`

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** ✅ **Aplicada (2026-10-12)**
- **Directorio donde debe aplicarse:** `src/api/v1/job_offers.py`

**✅ Aplicado en el backend — commit `3cb9ba0` (2026-10-12):**
`JobOfferSummary` ahora declara `modality: str | None` y `employment_type: str | None`,
y ambos se pueblan en `from_model(...)`.
**Evidencia:** `src/api/v1/job_offers.py` — declaración en las líneas **163-164**,
poblado en **182-184**.

**Cambio necesario:**
Incluir `modality: str | None` y `employment_type: str | None` en el schema
`JobOfferSummary` y en su `from_model(...)` (ya existen en `JobOfferRead`). Opcional:
añadir también `closes_at`.

**Justificación / impacto:**
El listado (`GET /job-offers`) devuelve `JobOfferSummary`, que **no** expone modalidad ni
tipo de empleo. Las tarjetas del catálogo y los chips de filtro de modalidad no se pueden
pintar sin pedir el **detalle de cada oferta** (N+1 inaceptable para un listado paginado).
Nota: las facetas `work_modes`/`employment_types` sí existen, por lo que el filtro funciona,
pero la tarjeta queda incompleta.

---

## S-03 — Falta endpoint `GET /api/v1/auth/me` (usuario + roles)

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** ✅ **Aplicada (2026-10-12)**
- **Directorio donde debe aplicarse:** `src/api/v1/deps.py` (router auth)

**✅ Aplicado en el backend — commit `3cb9ba0` (2026-10-12):**
Existe `GET /api/v1/auth/me` con `CurrentUserMeResponse`
(`{ id, email, full_name, is_active, roles }`); los roles se resuelven de `auth_roles`/`auth_user_roles` vía
`_user_roles`.
**Evidencia:** `src/api/v1/deps.py` — `CurrentUserMeResponse` en **L346-351** y el
endpoint `GET /me` en **L377-391**.
Confirmado contra PostgreSQL real en `8bb88ce` (2026-10-13) y cubierto por tests de
contrato OpenAPI en `0df7ea8` (2026-10-13).

**Cambio necesario:**
Exponer `GET /api/v1/auth/me` autenticado que devuelva, sin secretos:
`{ id, email, is_active, full_name?, roles: ["candidate"|"recruiter"|"admin", ...] }`,
tomando los roles de `auth_roles`/`auth_user_roles`.

**Justificación / impacto:**
No existe ningún endpoint de "usuario actual". Para decidir la navegación por rol
(candidato / reclutador / admin) y proteger rutas, el frontend tendría que **decodificar
el JWT en el cliente**, acoplándose al formato del token y a sus claims. Un endpoint
`/auth/me` desacopla la UI del formato del token y es la base de las vistas por rol
(Etapas F1 y F7).

---

## S-04 — `ApplicationSummary` sin datos de la oferta

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** ✅ **Aplicada (2026-10-12)**
- **Directorio donde debe aplicarse:** `src/application/applications/dto.py`
  (+ `src/infrastructure/applications/repositories.py`)

**⚠️ Parcial en el backend — commit `3cb9ba0` (2026-10-12):**
`ApplicationSummary` **declara** `job_offer_title`, `company_id` y `company_name`, pero
`GET /applications` los devuelve **`null`** hoy: `ApplicationsPage.from_rows` llama a
`ApplicationSummary.from_model(row)` **sin** pasar el contexto de la oferta, y el
repositorio (`for_candidate`/`for_offer`) no hace *join* a `job_offers`/`companies`.
**Evidencia:** `src/application/applications/dto.py` — campos en **L112-119**, `from_model`
**L127-142** y `from_rows` **L159-176** (sin poblar);
`src/infrastructure/applications/repositories/application_repository.py` — `for_candidate`
**L42** y `for_offer` **L55** (sin *join*).
> Estado: **En revisión**. El frontend ya es resiliente (prefiere los campos y cae a las
> ofertas cargadas), pero el backend debe poblar el resumen para eliminar el *fallback*.

**Cambio necesario:**
Ampliar `ApplicationSummary` con al menos `job_offer_title: str`, `company_id: uuid.UUID`
y `company_name: str | None`; opcionalmente `status_updated_at`/`last_transition_at`.

**Justificación / impacto:**
`GET /applications` (candidato) devuelve `ApplicationSummary` con solo `id`,
`job_offer_id`, `candidate_id`, `status` y `created_at`. El "tracker de postulaciones" del
frontend debe mostrar **título y empresa** de cada postulación; sin estos campos, cada
fila exige un `GET /job-offers/{id}` adicional (N+1 en la vista central de F4).

---

## S-05 — Las ofertas no exponen sus `skills` (`job_skills`)

- **Fecha:** 2026-10-12 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/job_offers.py`
  (+ `src/services/job_offers.py` / infraestructura para *eager-load*)

**Cambio necesario:**
Añadir `skills: list[SkillRef]` (p. ej. `{ skill_id, slug, name }`) a `JobOfferRead`
(y opcionalmente a `JobOfferSummary`).

**Justificación / impacto:**
La tabla pivote `job_skills` existe desde la migración 0001 y la consumen la analítica y
el motor ATS (`evaluaciones`, `skill-gap`), pero **no se expone** en el contrato de las
ofertas. El detalle de la oferta debe mostrar sus "tecnologías/habilidades clave"; hoy el
frontend no tiene de dónde obtenerlas y tendría que ocultar el bloque.

---

## S-06 — `sort` del listado limitado a `date`/`relevance`

- **Fecha:** 2026-10-12 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/services/job_offers.py`

**Cambio necesario:**
Ampliar `VALID_SORT_OPTIONS` con ordenamiento por salario
(p. ej. `salary_asc` / `salary_desc`, por punto medio del rango y nulos al final).
Alternativa aceptable: documentar que el orden por salario se resuelve en el cliente.

**Justificación / impacto:**
`VALID_SORT_OPTIONS = {"date", "relevance"}`. La UI de filtros ofrece explícitamente
orden por salario (mayor→menor, menor→mayor); el backend devuelve `422` para esos valores,
por lo que hoy la opción debe ocultarse o resolverse en cliente (limitado: solo sobre la
página cargada).

---

## S-07 — Refresh token viaja en el cuerpo (riesgo XSS)

- **Fecha:** 2026-10-12 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/deps.py`

**Cambio necesario:**
Evaluar emitir el *refresh token* también (o únicamente, para clientes web) mediante una
cookie `HttpOnly; Secure; SameSite=Strict`, manteniendo el modo actual para clientes no
navegador. Alternativa mínima: documentar la recomendación de almacenamiento.

**Justificación / impacto:**
`TokenPairResponse` entrega `access_token` y `refresh_token` en el JSON. El SPA debe
persistir el refresh token para mantener la sesión, lo que lo expone a XSS vía
`localStorage`. Una cookie `HttpOnly` elimina esa superficie sin romper el flujo actual.

---

## S-08 — Descripción de oferta en texto plano, sin secciones

- **Fecha:** 2026-10-12 · **Prioridad:** Baja-Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/job_offers.py`
  (+ `db/migrations/` si se opta por campos estructurados)

**Cambio necesario:**
Acordar el formato de `description` (markdown renderizable) **o** añadir campos
estructurados opcionales (p. ej. `sections` JSONB con `responsibilities`, `requirements`,
`benefits`, `nice_to_have`).

**Justificación / impacto:**
El modelo de detalle del frontend contempla responsabilidades, requisitos, deseables y
beneficios como listas separadas; el backend solo tiene un `description: str`. Hoy esos
bloques se ocultan. Definir el formato permite una presentación fiel y consistente.

---

## S-09 — Solo el candidato puede cambiar el estado de su postulación

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** ✅ **Aplicada (2026-10-12)**
- **Directorio donde debe aplicarse:** `src/application/applications/use_cases.py`
  (+ `src/api/v1/applications.py`)

**✅ Aplicado en el backend — commit `3cb9ba0` (2026-10-12):**
`ApplicationTransitionStatusUseCase` ahora autoriza a los **miembros de la empresa** de
la oferta a avanzar los estados no-`withdrawn`, y restringe al candidato a `withdrawn`.
Se añadió `ApplicationStatusTransitionAuthorizer` como autorizador de primera clase.
**Evidencia:** `src/application/applications/use_cases.py` — `execute` (decisión
`is_company_member`), `_candidate_transition`, `_company_member_transition` y la clase
`ApplicationStatusTransitionAuthorizer`.
Re-validado con la suite en `0df7ea8` (2026-10-13): `tests/test_applications_use_cases.py`
y `tests/test_applications_api.py` (403 para el dueño, 200 para el miembro).

**Cambio necesario:**
Permitir la transición de estado (`in_review`, `interviewing`, `offered`, `hired`,
`rejected`) a **miembros de la empresa de la oferta** (RBAC + auditoría), y restringir al
candidato a `withdrawn`. Alternativa mínima: impedir que el candidato fije estados
terminales (`offered`/`hired`) sin acción del reclutador.

**Justificación / impacto:**
`ApplicationTransitionStatusUseCase` autoriza con `_require_owned_application(...)`, es
decir **solo el candidato dueño**. Consecuencias: (1) un reclutador no puede hacer avanzar
el embudo por API → **bloquea el panel de reclutador (F7)**; (2) un candidato puede
marcarse a sí mismo `hired`, lo que **contamina** las métricas de `time-to-hire`, `funnel`
y `partner-roi` (Etapas 4/5). Requiere confirmación de diseño del equipo backend.

---

## S-10 — Falta persistencia de "guardados/favoritos"

- **Fecha:** 2026-10-12 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/` (router nuevo)
  (+ `db/migrations/`, capas hexagonales `src/domain|application|infrastructure/`)

**Cambio necesario:**
Exponer endpoints de autoservicio para guardar/quitar/listar ofertas favoritas del
candidato (p. ej. `GET|PUT|DELETE /profiles/saved-jobs` o `/candidates/me/saved-jobs`),
con tabla pivote y RLS `self`.

**Justificación / impacto:**
El frontend mantiene "guardados" solo en `localStorage` (`jobsplit_saved_jobs`). No hay
forma de sincronizarlos entre dispositivos ni de usarlos en el backend (alertas,
recomendaciones). Es una función visible de la UI (vista "Guardados").

---

## S-11 — `experience_years` vs nivel cualitativo de experiencia

- **Fecha:** 2026-10-12 · **Prioridad:** Baja · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/profiles.py` (+ `db/migrations/`)

**Cambio necesario:**
Acordar un mapeo de bandas de `experience_years` a niveles (Junior / Mid / Senior / Lead /
Staff), o añadir un campo `level` (enum) a perfiles y/o a las ofertas.

**Justificación / impacto:**
El perfil del candidato tiene `experience_years` (entero 0–50) y las ofertas usan ese
filtro duro (RAG/ATS), pero la UI filtra y muestra **niveles cualitativos**. Sin un mapeo
acordado, el filtro por nivel no puede ser consistente entre catálogo, perfil y ATS.

---

## S-12 — Marcar "ya postulado" exige paginar todo `GET /applications`

- **Fecha:** 2026-10-12 · **Prioridad:** Baja · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/applications.py`
  (+ `src/application/applications/use_cases.py`)

**Cambio necesario:**
Permitir al candidato filtrar sus propias postulaciones por oferta — p. ej. aceptar
`?job_offer_ids=<uuid,uuid,...>` (o una variante compacta) en `GET /applications` cuando el
llamador es el candidato, o exponer un endpoint ligero con solo los `job_offer_id`.

**Justificación / impacto:**
En el catálogo (split view) cada tarjeta debe mostrar el marcador "ya postulado". Hoy el
frontend solo conoce las postulaciones de la **primera página** (`page_size` por defecto 20),
así que un candidato con muchas postulaciones verá tarjetas sin el marcador aunque sí haya
postulado. Resolverlo paginando todo `GET /applications` en cada carga del feed no escala.

---

## S-13 — El bucle de bootstrap de `DEPLOYMENT.md §4` omite la migración `0019`

- **Fecha:** 2026-10-12 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `docs/DEPLOYMENT.md` (+ `knowledge.md`)

**Cambio necesario:**
Actualizar el bucle documentado de bootstrap para incluir
`0019_users_recruiter_read.sql` (creado durante el cierre de la Etapa 3 y ausente
del listado, que termina en `0018_admin_platform_analytics_read`). Revisar también
las referencias a "0000–0016/0017/0018" en `docs/DEPLOYMENT.md` y `knowledge.md`
para que reflejen el bootstrap real (0000–0019 + seeds).

**Justificación / impacto:**
Quien siga el procedimiento al pie de la letra obtiene un esquema que **no** aplica
la política RLS `0019` (lectura de `users` para reclutadores), lo que rompe la
validación semántica del ATS descrita en `etapas.md`. Verificado hoy al revisar el
bootstrap real: `ls db/migrations/` termina en `0019`, pero el bucle no lo incluye.

---

## S-14 — El arranque del stack no aplica el esquema ni expone *readiness* de BD

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `docker-compose.yml` / `Dockerfile`
  (+ `src/main.py`, `docs/DEPLOYMENT.md`)

**Cambio necesario:**
Cualquiera de estas tres opciones (o una combinación):
1. Un `entrypoint` del servicio `web` que aplique `db/migrations/*` + `db/seeds/*`
   de forma idempotente antes de arrancar `uvicorn`.
2. Un endpoint de *readiness* (p. ej. `GET /health/ready`) que compruebe la conexión
   a la BD y la presencia de tablas clave, y devuelva `503` mientras el esquema no
   esté aplicado.
3. Marcar el bootstrap como paso **obligatorio** y bloqueante en el quickstart
   (`README.md` / `docs/DEPLOYMENT.md §4`), no como una nota.

**Justificación / impacto:**
`docker-compose.yml` solo monta `db/init/001_enable_pgvector.sql` y
`db/init/002_app_role.sql`; el `CMD` del `Dockerfile` es `uvicorn` sin paso de
migración. El *healthcheck* de `db` (`pg_isready`) valida que Postgres acepta
conexiones, **no** que el esquema exista, y `depends_on: service_healthy` da por
bueno un arranque con la base vacía.

Síntoma observado hoy (2026-10-12): `GET /health` → **200 `{"status":"ok"}`** pero
**todos** los endpoints de datos → **500** (`/job-offers`, `/categories`, `/skills`,
`/geography/countries`, `POST /api/v1/auth/register`). Es un modo de fallo
engañoso: el contenedor se reporta *healthy* y la API parece operativa, mientras el
frontend no puede cargar nada. Añadir *readiness* real convierte este fallo en un
error explícito y accionable.

---

## S-15 — El stack arranca con `AUTH_SIGNING_KEY` inválida: falla en *runtime* con 500

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/main.py` (+ `src/config.py`,
  `docs/DEPLOYMENT.md`, `.env.example`)

**Cambio necesario:**
Validar `AUTH_SIGNING_KEY` **al arrancar**: comprobar que es un PEM parseable
(`BEGIN`/`END` presentes) y que la clave privada corresponde a la pública publicada
en el JWKS; si no, **abortar el arranque** con un mensaje explícito. Hoy el único
guardián es la interpolación de `docker compose` (`${AUTH_SIGNING_KEY:?...}`), que
solo verifica que la variable **existe**, no que sea válida.

**Justificación / impacto:**
En el `.env` real, `AUTH_SIGNING_KEY` tenía un valor **truncado** (27 caracteres:
`-----BEGIN P…`, con `BEGIN` pero **sin bloque `END`**), es decir el texto de ejemplo
del `.env.example` pegado sin generar la clave. Consecuencia: **todo endpoint que
firma o valida un JWT devuelve 500** (`GET /api/v1/auth/jwks`, `POST /api/v1/auth/register`,
`.../login`), mientras `GET /health` sigue en 200 y el contenedor se reporta
*healthy*. Es el **mismo modo de fallo engañoso** de S-14, agravado porque aquí el
stack **sí** arrancó y el error solo aparece al primer intento de autenticación, con
un 500 opaco. Esto dejó el E2E autenticado (F1, F3, F4, F5, F7) sin poder ejecutarse
hoy: el catálogo público **sí** se verificó (ver más abajo).

Se corrigió el `.env` local generando una clave RSA 2048 válida con
`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048` (respaldo del
original en `.env.bak.antes-de-clave`), pero **el contenedor `web` conserva en su
entorno el valor viejo hasta recrearse** (`docker compose up -d --force-recreate web`),
porque un `restart` no reevalúa el `.env`. Ese paso requiere `docker` (ver S-16).

---

## S-16 — `APP_DB_PASSWORD` con valor placeholder (`CAMBIA_ME…`) en `.env`

- **Fecha:** 2026-10-12 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `.env` / `.env.example` (+ `db/init/002_app_role.sql`)

**Cambio necesario:**
Generar un valor aleatorio real para `APP_DB_PASSWORD` **antes del primer arranque
del volumen**, y documentar que cambiarlo después exige rotar la contraseña del rol
(`ALTER ROLE freebuff_app PASSWORD …`) además de recrear el servicio `web`.

**Justificación / impacto:**
El `.env` conserva el literal de plantilla `CAMBIA_ME_con_openssl_rand_hex_32`
(36 caracteres). El stack **funciona** porque `db/init/002_app_role.sql` crea el rol
con ese mismo valor y `DATABASE_URL` lo repite, pero es una credencial **predecible**
para el rol de aplicación del despliegue. No es una fuga (`.env` está ignorado por
git: `.gitignore:43`), sí un endurecimiento pendiente. Nota operativa relacionada:
`adjgp` no pertenece al grupo `docker`, por lo que recrear el servicio `web` exige
`sudo`.

---

## S-17 — `POST /auth/logout` valida como refresh: el access token nunca se revoca

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** ✅ **Aplicada (2026-10-12)**
- **Directorio donde debe aplicarse:** `src/api/v1/deps.py` (`logout` / `_revoke_token`)

**✅ Aplicado en el backend — commit `3cb9ba0` (2026-10-12):**
`logout` delega con `expected_token_type=None` y `_revoke_token` recorre
`_revocation_attempt_configs`, que intenta primero **refresh** y luego **access**; así el
bearer de access token ya se puede revocar (semántica 1 de la sugerencia).
**Evidencia:** `src/api/v1/deps.py` — `logout` en **L567-578** (`expected_token_type=None`),
`_revoke_token` en **L658-707** y `_revocation_attempt_configs` en **L710-734**.

**Cambio necesario:**
`logout` recibe el *bearer* (que en la práctica es un **access** token) pero delega en
`_revoke_token`, que decodifica **siempre** con
`expected_audience=REFRESH_AUDIENCE, expected_token_type=REFRESH_TOKEN_TYPE`. Hay que
decidir e implementar una de estas dos semánticas:
1. Aceptar ambos tipos: intentar primero como access y, si falla, como refresh
   (decidiendo después qué `jti` se revoca).
2. Exigir explícitamente un refresh token y documentarlo (el nombre del endpoint y
   el uso desde un SPA sugieren lo contrario).

**Justificación / impacto (reproducido 2026-10-12 contra la API real):**

| Llamada | Resultado |
|---|---|
| `POST /auth/logout` · bearer = **access** | **401** `invalid token for revocation` |
| `POST /auth/logout` · bearer = **refresh** | **200** `{status: revoked, token_type: refresh}` |
| `POST /auth/logout/refresh` · `{refresh_token}` | **200** (funciona; 409 si ya estaba revocado) |

Es decir: **el endpoint de logout no puede revocar un access token**, así que este
sigue siendo válido hasta su expiración (15 min). El endpoint tampoco acepta el
token en el cuerpo, de modo que desde un SPA (`Authorization: Bearer <access>`, la
forma natural) la llamada **siempre** falla. El frontend mitiga con **S-07** (el
access token vive solo en memoria) y revocando el *refresh* por `/logout/refresh`,
pero el `jti` del access no se puede invalidar.

---

## S-18 — `GET /analytics/offer-demand-ratio` devuelve **500** siempre (`max(a,b)`)

- **Fecha:** 2026-10-12 · **Prioridad:** Alta · **Estado:** ✅ **Aplicada (2026-10-12)**
- **Directorio donde debe aplicarse:** `src/infrastructure/analytics/repositories.py`
  (`offer_demand_ratio`, línea ~771)

**✅ Aplicado en el backend — commit `3cb9ba0` (2026-10-12):**
`func.max(<expr>, literal(0.0))` fue sustituido por `func.greatest(<expr>, literal(0.0))`,
con un fallback documentado para SQLite (que no tiene `greatest` escalar).
**Evidencia:** `src/infrastructure/analytics/repositories.py` — **L793-803**
(`func.greatest(live_days_expr, literal(0.0))`).
Confirmado contra PostgreSQL real en `8bb88ce` (2026-10-13).

**Cambio necesario:**
Sustituir `func.max(<expr float8>, literal(0.0))` por `func.greatest(...)`. En
PostgreSQL `max()` es **agregado de un argumento**; la forma escalar de dos
argumentos es `greatest()`, que es lo que la intención del código requiere
(`max(días, 0)`).

**Justificación / impacto (reproducido 2026-10-12 contra la API real):**
El endpoint responde **500 Internal Server Error** de forma **determinista**,
con y sin `?company_id`, con y sin `?days`:

| Llamada | Resultado |
|---|---|
| `GET /analytics/offer-demand-ratio` | **500** |
| `GET /analytics/offer-demand-ratio?company_id=<uuid>` | **500** |
| `GET /analytics/offer-demand-ratio?days=30` | **500** |
| `GET /analytics/offer-demand-ratio?company_id=<uuid>&days=30` | **500** |

El error del motor es `42883: function max(numeric, numeric) does not exist`,
reproducido ejecutando la misma expresión **directamente contra Postgres como
superusuario**, luego **no** es RLS ni permisos: es el SQL. El resto de métricas de
empresa (`vacancies`, `funnel`, `time-to-hire`, `time-in-stage`, `salary-benchmark`)
responden **200** al propietario de la empresa, así que el defecto está aislado en
esta consulta. El único otro `func.max` con dos argumentos potencialmente afectado
no existe: la línea ~405 usa un agregado de un solo argumento (válido).

---

## Verificación E2E del catálogo público (2026-10-12)

Con el esquema ya aplicado (20 migraciones `0000`–`0019` + 4 seeds; 32 tablas, 50
políticas RLS, 16 skills, 12 categorías) se ejecutó una verificación **real** contra
la API en `127.0.0.1:8000`, sembrando un fixture por SQL (una empresa + una oferta
`published`) para poder recorrer el camino público sin depender de un JWT válido:

| Comprobación | Resultado |
|---|---|
| `GET /job-offers` | **200** · claves `facets, items, page, page_size, total, total_pages` |
| Claves del ítem vs `JobOfferSummaryDto` | **coincidencia exacta** (12 campos) |
| `GET /job-offers/{id}` | **200** · claves = `JobOfferSummaryDto` + `description, modality, employment_type, city_id, closes_at` |
| Claves de `facets` vs `JobOffersFacetsDto` | **coincidencia exacta** (`categories{id,name,count}`, `work_modes{value,count}`, `employment_types{value,count}`, `salary_ranges{range,count}`) |
| `search_term` (coincide / no coincide) | **1 / 0** |
| `work_mode=remote` / `=onsite` | **1 / 0** |
| `min_salary` (cents) | **1** |
| `category_id` | **1** |
| `sort=relevance` + `search_term` | **200** |
| Paginación `page_size=1&page=2` | **200** |

Conclusión: el contrato del **listado/facetas/filtros** consumido por `jobsApi` y
`filtersToQuery` está verificado contra la API real.

---

## Verificación E2E autenticada (2026-10-12, tras recrear el contenedor)

Con `AUTH_SIGNING_KEY` ya válida (`GET /api/v1/auth/jwks` → **200**, `kty=RSA`,
`alg=RS256`) se ejecutaron los flujos autenticados contra la API real.

**Candidato — 22/24 comprobaciones** (las 2 que fallan son de expectativa, no del
backend: el script esperaba 200 donde el contrato documenta 404, y 200 en
`/auth/logout` — ver **S-17**):

| Paso | Resultado |
|---|---|
| `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` | **201 / 200 / 200** |
| `POST /auth/login` → claves vs `TokenPairDto` | **exactas** (`access_token`, `refresh_token`, `token_type`, `expires_in`) |
| `GET /profiles/me` sin perfil | **404** `profile_not_found_error` (contrato: «no profile yet») |
| `POST /profiles` → claves vs `ProfileDto` | **exactas** (11 campos) |
| `GET /profiles/me` · `PATCH /profiles/me` | **200 / 200** (el `headline` cambia) |
| `GET /skills` | **200** (16) · claves `skill_id`, `slug`, `name` = `SkillDto` |
| `PUT /profiles/skills` con **slugs** | **200**; *round-trip* exacto; el reemplazo es declarativo (3 → 1) |
| `POST /applications` → claves vs `ApplicationDto` | **201**, **7 campos exactos** |
| `GET /applications` → paginado y `ApplicationSummary` | **200**, claves `items/page/page_size/total/total_pages` y 5 campos exactos |
| `PATCH /applications/{id}/status` (candidato → `withdrawn`) | **200** |
| `GET /categories` · `GET /geography/countries` | **200 / 200** |
| `GET /analytics/response-rate` vs `PersonalResponseRateDto` | **200**, **claves exactas** |
| `GET /analytics/salary-radar` vs `SalaryRadarGroupDto`/`SalaryPercentileDto` | **200**, **claves exactas**, 4 percentiles (25/50/75/90) con datos reales |
| `GET /analytics/skill-gap` vs `SkillGapItemDto` | **200**, **claves exactas** (`skill_id`, `slug`, `name`, `offers`) con datos reales |

**Reclutador / empresa — 22/27** (los no-PASS son RBAC esperado o **S-09**/**S-18**):

| Paso | Resultado |
|---|---|
| `POST /companies` (`slug` `^[a-z0-9]+(_[a-z0-9]+)*$`) | **201**; el creador queda `is_owner: true` |
| `GET /companies/{id}` · `GET /companies/{id}/members` | **200 / 200** |
| `POST /job-offers` (nace `draft`) · `PATCH …/publish` | **201 / 200** → `status: published` |
| `GET /applications/{id}/candidate` (RLS de `0019`) | **200** |
| `PATCH /applications/{id}/status` como **reclutador** | **403** `not_your_application_error` → **S-09 confirmado** |
| `POST /companies/{id}/members` · `GET /memberships/plans` | **201 / 200** |
| `analytics/{vacancies,funnel,time-to-hire,time-in-stage,salary-benchmark}` | **200** (propietario de la empresa) |
| `analytics/offer-demand-ratio` | **500** → **S-18** |
| `analytics/{labor-barometer,partner-roi,quota-usage}` | **403** `authorization_error` (requieren rol **admin**; correcto) |

**Nota de contrato:** `GET /categories` devuelve un **array plano**, no un objeto
paginado (a diferencia de `/job-offers`); el frontend ya lo trata como lista.

---

## Notas de implementación (2026-10-12)

> **Actualización (2026-10-13):** las confirmaciones de esta sección reflejan el estado
> del **2026-10-12**; varias fueron **resueltas después** por el backend. Estado vigente:
> **S-02, S-03, S-04, S-09, S-17 y S-18 → Aplicadas** (commit `3cb9ba0`, ver cada sección);
> el resto sigue abierto.

Sugerencias **corroboradas directamente en el código** durante la implementación de F0–F4/F6
(ver `docs/PLAN_TRABAJO.md` §11):

- **S-02** — confirmado: `JobOfferSummary` no expone `modality`/`employment_type`, por lo que
  el listado no puede pintar los chips de modalidad ni el tipo de empleo. El frontend **oculta**
  esos chips en las tarjetas (el detalle sí los muestra vía `JobOfferRead`).
- **S-03** — confirmado: no existe `GET /auth/me`; el frontend construye la sesión solo con
  los claims `sub`/`email` del access token (`src/utils/jwt.ts`). Sin roles en el token, las
  vistas por rol quedan limitadas.
- **S-04** — confirmado: `ApplicationSummary` no lleva título ni empresa, así que el tracker
  resuelve los títulos desde las ofertas ya cargadas, con la limitación de no cubrir ofertas
  fuera de la página actual.
- **S-05** — confirmado: el detalle de oferta no trae `skills`; el bloque de tecnologías clave
  se **oculta** en vez de inventarse.
- **S-06** — confirmado: `sort` solo acepta `date`/`relevance`; la barra de filtros expone
  únicamente esos dos órdenes.
- **S-07** — aplicado en el frontend como mitigación: el access token vive **solo en memoria**
  y únicamente el refresh token se persiste (`src/services/tokenStorage.ts`).
- **S-09** — confirmado leyendo `ApplicationTransitionStatusUseCase`; bloquea F7.
- **S-10** — confirmado: el frontend mantiene los "guardados" en `localStorage`
  (`talenti_saved_jobs`) porque no hay endpoint.
- **S-11** — confirmado: el filtro por nivel de experiencia se **retiró** de la UI (el backend
  solo tiene `experience_years`).

---

## Consumo en el frontend (2026-10-13)

Trabajo realizado en `Frontend-Talenti` para quedar nivelado con las sugerencias que el
backend aplicó (commit `3cb9ba0`):

| Sugerencia | Consumo en el frontend | Archivos principales |
|---|---|---|
| **S-02** | Las tarjetas del catálogo muestran los chips de **modalidad** y **tipo de empleo** desde el listado, sin pedir el detalle | `talentiTypes.ts`, `jobAdapter.ts` (`summaryToJob`), `ListCard.tsx` |
| **S-03** | La sesión resuelve **roles** vía `GET /auth/me` (con *fallback* a los claims del token); la navegación por rol se habilita | `authApi.ts` (`me`), `useAuthStore.ts`, `types/index.ts`, `Sidebar.tsx` |
| **S-04** | El tracker prefiere `job_offer_title`/`company_name` y cae a las ofertas ya cargadas (el backend hoy los envía `null`) | `talentiTypes.ts`, `SecondaryViews.tsx` |
| **S-09** | El **panel de reclutador** (F7) avanza el embudo de cada postulación | `applicationsApi.ts`, `useRecruiter.ts`, `recruiter/RecruiterView.tsx` |
| **S-17** | El `logout` revoca el **access token** (bearer) además del refresh | `authApi.ts` (`logout`) |
| **S-18** | Las métricas de empresa del panel incluyen `offer-demand-ratio` sin `500` | `analyticsApi.ts`, `useRecruiter.ts`, `recruiter/RecruiterView.tsx` |

**Nuevo frente (F7):** se implementó el panel de reclutador (`RecruiterView`) que consume
`/companies*`, `POST|PATCH /job-offers*`, `GET /applications?job_offer_id=` y
`/analytics/{vacancies,funnel,time-to-hire,time-in-stage,salary-benchmark,offer-demand-ratio}`.

---

## S-19 — Falta endpoint "mis empresas" (empresas del usuario autenticado)

- **Fecha:** 2026-10-13 · **Prioridad:** Media · **Estado:** Abierta
- **Directorio donde debe aplicarse:** `src/api/v1/companies.py`

**Cambio necesario:**
Exponer el listado de empresas a las que pertenece el usuario autenticado (p. ej.
`GET /companies/mine` o `GET /me/companies`) con `[{ id, slug, name, is_owner, is_active }]`.

**Justificación / impacto:**
No existe forma de que el frontend descubra a qué empresa pertenece un reclutador: solo hay
`GET /companies/{id}` (exige conocer el `id`) y las rutas de miembros también requieren el
`id`. Para el panel de reclutador (F7) el frontend debe pedir el **ID de empresa** o crearla,
y lo persiste en `localStorage` (`talenti_recruiter_company`) como puente. Un endpoint
"mis empresas" elimina ese paso manual y es la base del selector de empresa.

---

## Regla de mantenimiento

1. Toda sugerencia nueva se añade con su ID correlativo, fecha y directorio, y se refleja
   en la tabla de resumen.
2. Al aplicarse un cambio en el backend, actualizar el **estado** a `Aplicada` indicando
   la fecha y, si aplica, la migración/PR de referencia.
3. Si el equipo backend descarta una sugerencia, marcar `Descartada` con la justificación.
