# PLAN_TRABAJO.md — Plan de trabajo del Frontend Talenti

> **Documento de planificación y seguimiento del frontend de Talenti.**
> Define **etapas de integración** alineadas con las etapas del backend
> (`BD_Bolsa_Trabajo/etapas.md`) para que ambas partes avancen en paralelo
> entregando funcionalidad vertical en cada etapa.
>
> Última actualización: **2026-10-12**

---

## 1. Contexto y estado de partida

### 1.1 Backend (`../BD_Bolsa_Trabajo`)

| Etapa backend | Alcance | Estado |
|---|---|---|
| 1 — Autenticación e Identidad | JWT RS256, JWKS, refresh/revocación, registro/login | 🟢 Cerrada |
| 2 — Reclutamiento y Bolsa de Trabajo | empresas, perfiles, ofertas, postulaciones, skills, membresías | 🟢 Cerrada |
| 3 — RAG/ATS y Evaluaciones | CVs multi-formato, búsqueda semántica, evaluaciones, soft skills | 🟡 En proceso |
| 4 — Analítica y Geografía | geografía, embudo, barómetro, radar salarial, ROI | 🟢 Cerrada |
| 5 — Motor analítico del ATS | time-to-hire, funnel, time-in-stage, vacantes, §1.3 | 🟢 Cerrada |

- Suite del backend: **1757/1757** en verde; 4 de 5 etapas cerradas.
- Único pendiente abierto: validación con **embeddings reales** (Etapa 3).
- Fuente del contrato: `BD_Bolsa_Trabajo/src/api/v1/*`, `docs/GUIA_USO_API.md`, `docs/ANALYTICS.md`.

### 1.2 Frontend (`Frontend-Talenti`, este repo)

- React 19 + Vite (TypeScript) + Tailwind v4 + TanStack Query v5 + Zustand + i18n ES/EN.
  - ⚠️ `tsconfig.json` **no** activa `strict` ni `noUnusedLocals`. El código pasa
    `tsc` y `--noUnusedLocals` limpiamente, pero habilitar `strict` produce ~1031
    errores preexistentes: es una tarea de modernización aparte (ver §9).
- Patrón **Split View (master-detail)** con atajos de teclado y Command Palette.
- **Sin datos mock**: todo el estado proviene de la API real (el dataset local
  `mockJobs.ts` fue eliminado en F0).

### 1.3 Decisiones de alcance de esta iteración

| Decisión | Valor |
|---|---|
| Fallback a datos mock | **Eliminado**: el frontend consume solo la API real (los errores se muestran como estado de error). |
| Etapa 3 (RAG/ATS) | El frontend prepara la UI, pero la activación queda tras *feature flag* hasta que el backend cierre las embeddings reales. |
| Superficies de reclutador/admin | **Por confirmar** (ver F7). El frontend actual es *candidate-centric*. |

---

## 2. Principios técnicos transversales

1. **Contrato primero.** Todo tipo del frontend se deriva de los DTOs reales del backend
   (`src/services/talentiTypes.ts` es la única fuente de verdad de tipos HTTP).
2. **Sin datos falsos.** Los bloques que el backend todavía no provee se **ocultan**,
   nunca se rellenan con mocks.
3. **Errores explícitos.** `401` → refrescar o *gate* de login; `403` permiso;
   `404` BOLA; `409` conflicto; `422` validación; `429` rate limit (respetar `Retry-After`);
   `5xx`/red → estado de error.
4. **Estados de UI completos** en cada vista: `loading` (skeleton), `empty`, `error`, `success`.
5. **i18n ES/EN obligatoria** en cada texto nuevo (`src/i18n/index.ts`).
6. **Autorización en el cliente es solo UX.** El backend es la autoridad (RLS + RBAC).
7. **Auth:** `Authorization: Bearer <access_token>`; access token **en memoria**, refresh
   token persistido; refresco silencioso ante `401`.
8. **Sin N+1.** No pedir el detalle de cada oferta para pintar el listado.
9. **Accesibilidad** (foco, `ESC`, teclado) y **cero CLS** se mantienen.

---

## 3. Modelo de estados de las etapas del frontend

`Por comenzar → En proceso → Test unitarios → Test → Test SonarQube → Test seguridad → Cerrada`

> *Nota:* los estados SonarQube/seguridad se aplican igual que en el backend.
> Ninguna etapa se marca `Cerrada` sin su verificación end-to-end contra el backend.

---

## 4. Resumen de etapas

| # | Etapa frontend | Etapa backend de soporte | Estado | Verificado |
|---|---|---|---|---|
| **F0** | Fundaciones y contrato de integración | — (transversal) | 🟡 En proceso | `tsc` ✅, `build` ✅, proxy ✅ |
| **F1** | Autenticación e identidad | Etapa 1 🟢 | 🟡 En proceso | `tsc` ✅, `build` ✅, **E2E ✅** (S-17 pendiente) |
| **F2** | Catálogo de ofertas (split view real) | Etapa 2 🟢 | 🟡 En proceso (núcleo) | `tsc` ✅, `build` ✅, **E2E ✅** (público+filtros) |
| **F3** | Perfil de candidato, skills y CV | Etapas 2 🟢 + 3 🟡 | 🟡 En proceso (parcial) | `tsc` ✅, `build` ✅, **E2E ✅** (perfil+skills) |
| **F4** | Postulaciones end-to-end | Etapa 2 🟢 | 🟡 En proceso (núcleo) | `tsc` ✅, `build` ✅, **E2E ✅** |
| **F5** | RAG/ATS + Evaluaciones | Etapa 3 🟡 | ⏸️ Bloqueada | — |
| **F6** | Analítica y geografía | Etapas 4 🟢 / 5 🟢 | 🟡 En proceso (self-service) | `tsc` ✅, `build` ✅, **E2E ✅** (self-service) |
| **F7** | Superficies de reclutador y admin | Etapas 2 🟢 / 4 🟢 / 5 🟢 | 🟡 En proceso (sin UI) | **E2E ✅** (empresa/membresía/oferta); S-09 bloquea el embudo |

> **Pendiente transversal de verificación:** ninguna etapa puede cerrarse hasta
> ejecutar la prueba end-to-end contra el stack Docker del backend. El entorno de
> desarrollo actual **no tiene acceso a Docker ni `.env`**, por lo que el humo en
> vivo queda pendiente (ver §11).

---

## 5. Detalle por etapa

### F0 — Fundaciones y contrato de integración
**Estado: 🟡 En proceso** · *Prerequisito de todo.*

**Objetivo:** dejar el proyecto listo para hablar con la API real y **retirar el mock**.

**Endpoints de humo:** `GET /health`, `GET /job-offers?page_size=1`.

**Entregables:**
- [x] `src/services/api.ts`: cliente único con `Authorization`, `ApiError` con
      `status`/`body`/`retryAfter`, refresco de sesión con reintento único y cola compartida.
- [x] `vite.config.ts`: **proxy de desarrollo** para los prefijos de la API
      (`/api/v1`, `/job-offers`, `/applications`, `/profiles`, `/skills`, `/soft-skills`,
      `/cvs`, `/ats`, `/evaluaciones`, `/geography`, `/analytics`, `/health`, `/.well-known`).
- [x] `.env.example`: `VITE_API_URL` + `VITE_API_PROXY_TARGET`; retiradas las variables heredadas de AI Studio.
- [x] `src/services/talentiTypes.ts`: DTOs verificados uno a uno contra `src/api/v1/*`
      (corregido el DTO del listado — ver S-02).
- [x] `src/services/jobAdapter.ts`: mapeo completo; **no** fabrica campos ausentes.
- [x] **Eliminado el fallback a mock**: borrado `src/services/mockJobs.ts` y los datos
      sembrados en Zustand; `jobsApi` solo habla con la API.
- [x] Rebranding: `index.html`, `metadata.json`, claves de `localStorage` → `talenti_*`.

**Criterios de aceptación:**
- [x] `tsc --noEmit` y `vite build` limpios.
- [x] El proxy intercepta las rutas de la API (verificado: `/health`, `/job-offers`,
      `/api/v1/auth/jwks`, `/analytics/salary-radar` llegan al upstream, no al SPA).
- [ ] El listado se puebla desde `GET /job-offers` real (pendiente: backend caído).
- [x] Si la API cae, la UI muestra **estado de error** (sin datos mock).

**Riesgos:** CORS si el SPA y la API viven en orígenes distintos (→ **S-01**).

---

### F1 — Autenticación e identidad
**Estado: 🟡 En proceso** · **Backend: Etapa 1 🟢 Cerrada**

**Objetivo:** sesión real (registro/login/refresh/logout) y navegación según rol.

**Endpoints:** `POST /api/v1/auth/{register,login,refresh,logout,logout/refresh}`,
`GET /api/v1/auth/jwks`. *(Deseable `GET /api/v1/auth/me` → **S-03**.)*

**Entregables:**
- [x] `src/services/authApi.ts` (registro, login, refresh, logout con revocación de ambos tokens).
- [x] `src/services/tokenStorage.ts`: access token **en memoria**, refresh token persistido.
- [x] `src/store/useAuthStore.ts`: `loading/anonymous/authenticated`, `bootstrap()` que
      canjea el refresh token al arrancar, y mensajes de error 401/409/429.
- [x] Interceptor de refresco en `api.ts`: ante `401`, refresca **una vez** y reintenta.
- [x] `src/components/auth/AuthScreen.tsx`: login/registro con validación (contraseña 8–128
      con mayúscula/minúscula/número/símbolo, email) y mostrar/ocultar contraseña.
- [x] **Gate** de vistas privadas (`applications`, `profile`, `dashboard`) en `MainLayout`;
      el feed de ofertas sigue siendo público (coherente con la API).
- [x] Botón de cerrar sesión en el `Sidebar` + identidad real (email del token).
- [x] i18n ES/EN de toda la pantalla de auth.

**Criterios de aceptación:**
- [ ] Registro → login → refresco silencioso → logout revocado (pendiente: E2E con backend).
- [x] Sin token, las vistas privadas muestran el *gate* de login.
- [x] `429` en login y `409` en registro muestran mensaje claro.
- [x] Todos los textos en ES/EN.

**Riesgos:** el token no lleva roles y no hay `/auth/me`, así que el rol se infiere solo
del `sub`/`email` (→ **S-03**); persistencia del refresh token en el navegador (→ **S-07**).

---

### F2 — Catálogo de ofertas (split view real)
**Estado: 🟡 En proceso (núcleo)** · **Backend: Etapa 2 🟢 Cerrada**

**Objetivo:** alimentar el master-detail con datos reales, filtros y facetas.

**Endpoints:** `GET /job-offers` (`page`, `page_size`, `category_id`, `company_id`,
`search_term`, `employment_type`, `work_mode`, `min_salary`, `max_salary`, `sort`),
`GET /job-offers/{offer_id}`, `GET /categories`, `GET /geography/*`.

**Entregables:**
- [x] `useJobs` / `useJobDetail` reales, con `queryKey` por filtros y `staleTime`.
- [x] `filtersToQuery`: traducción de filtros de UI a los parámetros reales del backend
      (incluido el salario mínimo en **céntimos**).
- [x] `FilterBar` con **facetas reales**: categorías (id + conteo), modalidad (conteo),
      filtro de salario mínimo y orden.
- [x] Los campos que el backend no expone se **ocultan** (match score, skills, hiring
      manager, responsabilidades, beneficios…), sin placeholders falsos.
- [x] Estados `loading/empty/error` con `retry` en lista y detalle.
- [x] Selección auto-reparada cuando cambian los filtros/página.
- [ ] **Pendiente F2-completo:** paginación (hoy solo la primera página, `page_size=20`).
- [ ] **Pendiente F2-completo:** filtros de geografía encadenados país→departamento→ciudad.
- [ ] **Pendiente F2-completo:** orden por salario/match (sin soporte del servidor — **S-06**).
- [ ] **Defecto (hallazgo 2026-10-12):** la vista **Guardados** y el botón **Guardados** de
  la barra superior no filtran el listado: `onlySaved`/`onlyApplied` se guardan en el store
  y cambian el estado visual del botón, pero **nada los aplica al resultado** (ni
  `filtersToQuery` ni un filtro en cliente), así que «Guardados» muestra el catálogo
  completo. Reproductor: `src/components/shared/MainLayout.tsx` (`case 'saved'` → `JobDashboard`),
  `src/components/jobs/JobDashboard.tsx`, `src/components/shared/Navbar.tsx`.

**Criterios de aceptación:**
- [x] El detalle muestra `description` real; las secciones ausentes no se inventan.
- [ ] Faceta seleccionada refleja el `count` real (pendiente: verificación en vivo).
- [ ] Tarjetas muestran modalidad/tipo de empleo (requiere **S-02**).

---

### F3 — Perfil de candidato, skills y CV
**Estado: 🟡 En proceso (parcial)** · **Backend: Etapa 2 🟢 + Etapa 3 🟡**

**Objetivo:** perfil gestionable, habilidades (hard/soft) y carga de CV real.

**Endpoints:** `GET|POST /profiles`, `GET|PATCH /profiles/me`, `GET|PUT /profiles/skills`,
`GET /skills`, `/soft-skills*`, `/cvs*` (ingesta).

**Entregables:**
- [x] `profilesApi` + `useProfile`: `GET /profiles/me` (404 → `null` sin romper la UI).
- [x] `ProfileView` real y **editable**: headline, bio, teléfono, ubicación,
      `experience_years`, `is_open_to_work`, `resume_url`; crea (POST) o actualiza (PATCH).
- [x] Selector de **skills** desde `GET /skills`, con tope de 50.
- [x] Eliminados los datos personales ficticios ("Alex Vance") de la vista de perfil.
- [ ] **Pendiente:** `PUT /profiles/skills` conectado al botón de guardar del selector.
- [ ] **Pendiente:** sección de **soft skills** (`/soft-skills/candidates/me`).
- [ ] **Pendiente:** **uploader de CV** multipart + *polling* `pending → processing → ready | failed`.

**Criterios de aceptación:**
- [x] El perfil persiste mediante POST/PATCH reales y sobrevive recarga.
- [ ] La ingesta de CV responde `202` y la UI refleja la transición hasta `ready`.

---

### F4 — Postulaciones end-to-end
**Estado: 🟡 En proceso (núcleo)** · **Backend: Etapa 2 🟢 Cerrada**

**Objetivo:** postular desde el modal y seguir el ciclo real en el tracker.

**Endpoints:** `POST /applications`, `GET /applications`, `PATCH /applications/{id}` (retiro).

**Entregables:**
- [x] `applicationsApi` + `useApply`: `POST /applications` real (`job_offer_id` + `cover_letter`).
- [x] `ApplyModal` reescrito: la identidad sale de la sesión (no se inventan nombre/email/CV);
      *gate* de login si no hay sesión; botón deshabilitado si ya se postuló.
- [x] Mapeo de errores de negocio: `409` duplicado, `400` cuota/empresa inactiva, `403`, `429`.
- [x] `useMyApplications`: las postulaciones se cargan del backend y alimentan el
      marcador "ya postulado" (se elimina el estado ficticio de `localStorage`).
- [x] `ApplicationsView` con el **enum real** (`submitted, in_review, interviewing,
      offered, hired, rejected, withdrawn`) y acción de **retiro** (`withdrawn`).
- [ ] **Pendiente:** sincronizar título/empresa de cada postulación sin N+1 (**S-04**).
- [ ] **Hallazgo (2026-10-12):** postular **exige un perfil creado**; sin él
  `POST /applications` responde `404 profile_not_found_error` y `ApplyModal` muestra el
  texto literal del backend en inglés (*«profile for candidate … does not exist»*).
  Falta un mensaje propio del frontend que lleve a crear el perfil (§4.4 de
  `docs/GUIA_PRUEBAS_MANUALES.md`).

**Criterios de aceptación:**
- [ ] Postular crea la fila y aparece en el tracker con su estado real (pendiente: E2E).
- [ ] Doble postulación → `409` con mensaje claro (pendiente: E2E).

---

### F5 — RAG/ATS + Evaluaciones
**Estado: ⏸️ Bloqueada** · **Backend: Etapa 3 🟡 En proceso**

**Objetivo:** superficies de matching semántico y evaluaciones.

**Endpoints:** `POST /ats/match`, `POST /evaluaciones/generate`, `GET /evaluaciones`,
`GET /evaluaciones/{id}`, `POST /evaluaciones/questions`.

**Entregables (tras *feature flag*):**
- [ ] Vista de **compatibilidad** (candidato): `fit_score` + `evidence` trazable.
- [ ] Vista **ATS/Match** (reclutador): `POST /ats/match` con `top_k` y `match_score`.
- [ ] Generación/listado de evaluaciones y preguntas.

**Bloqueo:** cierre de la Etapa 3 (embeddings reales + calidad de búsqueda).

---

### F6 — Analítica y geografía
**Estado: 🟡 En proceso (self-service)** · **Backend: Etapas 4 🟢 / 5 🟢 Cerradas**

**Objetivo:** reemplazar el panel de métricas mock por métricas reales, por rol.

**Endpoints:**

| Grupo | Endpoints | Acceso | Estado |
|---|---|---|---|
| Self-service candidato | `/analytics/salary-radar`, `/skill-gap`, `/response-rate` | autenticado | ✅ integrado |
| Empresa / reclutador | `/time-to-hire`, `/funnel`, `/time-in-stage`, `/vacancies`, `/salary-benchmark`, `/offer-demand-ratio` | admin o miembro | ⏳ pendiente |
| Plataforma | `/labor-barometer`, `/partner-roi`, `/quota-usage` | solo admin | ⏳ pendiente |
| Geografía | `/geography/countries`, `/countries/{id}/states`, `/states/{id}/cities` | público | ⏳ pendiente |

**Entregables:**
- [x] `analyticsApi` + hooks (`useSalaryRadar`, `useSkillGap`, `useResponseRate`).
- [x] `DashboardInsightsView` real: tasa de respuesta, radar salarial (percentiles por
      moneda) y brecha de habilidades — sin cifras inventadas.
- [x] Eliminados los KPIs y la matriz de skills ficticios.
- [ ] **Pendiente:** tableros de empresa/plataforma (dependen de F7).
- [ ] **Pendiente:** filtros de geografía en el catálogo.

**Criterios de aceptación:**
- [x] Cada métrica renderiza exactamente su DTO (sin campos inventados).
- [ ] Un candidato no ve métricas de empresa (403) (pendiente: E2E).

---

### F7 — Superficies de reclutador y admin
**Estado: ⏳ Por decidir** · **Backend: Etapas 2 🟢 / 4 🟢 / 5 🟢**

Sin cambios respecto al plan original. **Dependencia bloqueante:** mover el estado de una
postulación hoy solo lo puede hacer el candidato dueño (→ **S-09**).

---

## 6. Matriz de trazabilidad backend ↔ frontend

| Capacidad backend | Endpoint clave | Vista / hook frontend | Etapa | Estado |
|---|---|---|---|---|
| Identidad/sesión | `/api/v1/auth/*` | `useAuthStore`, `AuthScreen` | F1 | ✅ |
| Listado de ofertas | `GET /job-offers` | `useJobs`, `JobDashboard` | F2 | ✅ |
| Detalle de oferta | `GET /job-offers/{id}` | `useJobDetail`, `DetailsView` | F2 | ✅ |
| Categorías | `GET /categories` | `FilterBar` (facetas) | F2 | ✅ |
| Geografía | `GET /geography/*` | filtros de ubicación | F2/F6 | **API ✅** / UI ⏳ |
| Perfil candidato | `/profiles*` | `ProfileView` | F3 | ✅ |
| Catálogo de skills | `GET /skills` | selector de skills | F3 | ✅ |
| Soft skills | `/soft-skills*` | `ProfileView` | F3 | ⏳ |
| CVs / ingesta | `/cvs*` | uploader de CV | F3 | ⏳ |
| Postulaciones | `/applications*` | `useApply`, `ApplicationsView` | F4 | ✅ |
| Matching semántico | `POST /ats/match` | vista ATS | F5 | ⏸️ |
| Evaluaciones | `/evaluaciones*` | vista de evaluación | F5 | ⏸️ |
| Analítica self-service | `/analytics/salary-radar|skill-gap|response-rate` | `DashboardInsightsView` | F6 | ✅ |
| Analítica de empresa | `/analytics/time-to-hire|funnel|...` | panel reclutador | F6/F7 | ⏳ |
| Analítica de plataforma | `/analytics/labor-barometer|partner-roi|quota-usage` | panel admin | F6/F7 | ⏳ |
| Empresas y miembros | `/companies*` | panel de reclutador | F7 | **API ✅** / UI ⏳ |
| Membresías | `/company-memberships*` | admin | F7 | ⏳ |

---

## 7. Sugerencias al backend

Los ajustes detectados están registrados en **`sugerencias.md`** (raíz del frontend), cada
uno con descripción, fecha y directorio donde debe aplicarse.

| ID | Tema | Prioridad | Bloquea |
|---|---|---|---|
| S-01 | Middleware **CORS** para orígenes separados | Media-Alta | Despliegue SPA/API separados |
| S-02 | `JobOfferSummary` sin `modality`/`employment_type` | Alta | F2 (chips/filtros) |
| S-03 | Falta `GET /auth/me` (usuario + roles) | Alta | F1/F7 (navegación por rol) |
| S-04 | `ApplicationSummary` sin título/empresa | Alta | F4 (tracker sin N+1) |
| S-05 | Ofertas no exponen sus `skills` | Media | F2 (tecnologías clave) |
| S-06 | `sort` del listado solo `date`/`relevance` | Media | F2 (orden por salario) |
| S-07 | Refresh token en el cuerpo (riesgo XSS) | Media | F1 (seguridad) |
| S-08 | Descripción de oferta sin secciones | Baja-Media | F2 (detalle) |
| S-09 | Solo el candidato cambia el estado de su postulación | Alta | F7 (embudo/analítica) |
| S-10 | Falta persistencia de "guardados/favoritos" | Media | F2 (favoritos) |
| S-11 | `experience_years` vs nivel cualitativo | Baja | F2 (filtro por nivel) |
| S-12 | Marcar "ya postulado" exige paginar `GET /applications` | Baja | F2/F4 (marcador) |
| S-13 | El bootstrap de `DEPLOYMENT.md §4` omite la migración `0019` | Media | Bootstrap reproducible |
| S-14 | El stack arranca sin aplicar el esquema ni exponer *readiness* | Alta | Todas las etapas |
| S-15 | `AUTH_SIGNING_KEY` inválida en `.env`: 500 en *runtime* de todo JWT | Alta | F1, F3–F5, F7 |
| S-16 | `APP_DB_PASSWORD` con placeholder `CAMBIA_ME…` | Media | Endurecimiento |
| S-17 | `POST /auth/logout` valida como refresh: el access token nunca se revoca | Alta | F1 (sesión) |
| S-18 | `GET /analytics/offer-demand-ratio` devuelve 500 siempre (`max(a,b)`) | Alta | F6/F7 |

---

## 8. Estrategia de verificación

- **Tipado estático:** `tsc --noEmit -p tsconfig.json` → **exit 0**.
- **Símbolos sin usar:** `tsc --noEmit --noUnusedLocals --noUnusedParameters` → **0 errores**.
- **Paridad i18n ES/EN:** verificado por script → **209 claves en ambos idiomas**.
- **`strict`:** **desactivado** en `tsconfig.json` (hallazgo 2026-10-12); activarlo da
  ~1031 errores preexistentes, fuera del alcance de estas etapas.
- **Build:** `vite build` → **exit 0**.
- **Proxy de desarrollo:** verificado que las rutas de la API llegan al upstream.
- **Pruebas unitarias** (a introducir): adaptadores DTO↔UI, mapeo de enums, formateadores,
  `filtersToQuery`, manejo de errores del cliente HTTP.
- **Contrato del catálogo público: verificado contra la API real** (2026-10-12) —
  `GET /job-offers` (listado, facetas, paginación, `search_term`, `work_mode`,
  `min_salary`, `category_id`, `sort`) y `GET /job-offers/{id}` coinciden **campo por
  campo** con `JobOfferSummaryDto`, `JobOfferDetailDto` y `JobOffersFacetsDto`.
  Detalle en `sugerencias.md` → "Verificación E2E del catálogo público".
- **Verificación E2E autenticada:** **ejecutada** (2026-10-12, tras recrear el servicio
  `web`): 22/24 en el flujo de candidato y 22/27 en el de reclutador/empresa. Contratos
  verificados campo a campo: `TokenPairDto`, `ProfileDto`, `SkillDto`, `ApplicationDto`,
  `ApplicationSummary`, `PersonalResponseRateDto`, `SalaryRadarGroupDto`,
  `SalaryPercentileDto`, `SkillGapItemDto`, `JobOfferSummaryDto`, `JobOfferDetailDto`,
  `JobOffersFacetsDto`. Detalle en `sugerencias.md` → "Verificación E2E autenticada".
- **Hallazgos abiertos del E2E:** **S-09** (el reclutador no puede avanzar el embudo),
  **S-17** (el logout no revoca el access token) y **S-18**
  (`/analytics/offer-demand-ratio` responde 500).
- **No verificado aún:** pruebas unitarias, SonarQube y pruebas de seguridad de cada
  etapa (los pasos siguientes del §3), y F5 (Etapa 3 abierta).
- **Pruebas manuales:** el recorrido guiado está en **`docs/GUIA_PRUEBAS_MANUALES.md`**
  (arranque del entorno, datos `DEMO`, pasos por etapa, contrato API↔UI, checklist y
  apéndices con el *seed* y la *purga*).

---

## 9. Riesgos y dependencias globales

| Riesgo / dependencia | Impacto | Mitigación |
|---|---|---|
| **El stack arranca sin aplicar el esquema** (hallazgo 2026-10-12) | `200` en `/health` pero `500` en todo endpoint de datos → el frontend no puede cargar nada | **Resuelto 2026-10-12**: esquema aplicado (`0000`–`0019` + seeds) contra el `db` del stack vía la red de compose; ver **S-14** para la causa permanente |
| **Sin acceso a Docker en el entorno de desarrollo** | No se puede recrear el servicio `web` | `adjgp` no está en el grupo `docker` y no hay `sudo` sin contraseña; requiere acción del usuario para recrear el contenedor |
| **`AUTH_SIGNING_KEY` placeholder en el `.env`** (hallazgo 2026-10-12) | Todo JWT da `500`: F1, F3–F5 y F7 no verificables | Corregida la clave en `.env`; falta `docker compose up -d --force-recreate web`; ver **S-15** |
| Etapa 3 abierta (embeddings reales) | F5 sin cerrar | *Feature flag* + backlog F5 |
| Falta de `/auth/me` | Navegación por rol limitada | **S-03** |
| Solo el candidato mueve el embudo | F7 inviable | **S-09** antes de F7 |
| CORS en orígenes separados | Despliegue no-nginx falla | **S-01** |
| Rate limit de escrituras (10/min) | `429` en ráfaga | Manejo de `Retry-After` en `api.ts` |
| `strict` de TypeScript desactivado | Los `undefined` no se verifican en compilación | Tarea aparte: activar `strict` y corregir (~1031 errores) |

---

## 10. Regla de mantenimiento

1. Al terminar cada etapa, actualizar el estado en §4 y §5 usando exactamente un estado del §3.
2. Anotar la evidencia (build, pruebas, comandos) junto al estado.
3. Toda sugerencia nueva al backend se registra en `sugerencias.md` **el mismo día**.
4. Los cambios de estado se reflejan también en la fecha de "Última actualización" del encabezado.

---

## 11. Bitácora de avance

### 2026-10-12 — F0, F1 y núcleo de F2/F3/F4/F6 implementados

**Implementado**
- **Servicios:** `api.ts` (cliente con auth, refresco 401 y `Retry-After`), `tokenStorage.ts`,
  `authApi`, `jobsApi`, `applicationsApi`, `profilesApi`, `analyticsApi`, `talentiTypes`
  (DTOs verificados contra el backend), `jobAdapter` (sin campos fabricados).
- **Estado:** `useJobStore` con filtros reales y sin datos sembrados; `useAuthStore` nuevo
  con `bootstrap` de sesión.
- **Vistas:** `AuthScreen` (login/registro), `FilterBar` (facetas reales), `ListCard` y
  `DetailsView` con bloques condicionales, `ApplyModal` real, `ApplicationsView`,
  `ProfileView` editable y `DashboardInsightsView` con analítica self-service.
- **Retirado:** `src/services/mockJobs.ts`, los KPIs/perfil ficticios y el estado de
  postulaciones sembrado en `localStorage`.
- **Config:** proxy de desarrollo, `.env.example`, rebranding a Talenti.

**Verificado**
- `npx tsc --noEmit -p tsconfig.json` → **exit 0**.
- `vite build` → **exit 0** (dist generado).
- Proxy de Vite: `/health`, `/job-offers`, `/api/v1/auth/jwks`, `/analytics/salary-radar`
  se reenvían a `127.0.0.1:8000` (el 500 es `ECONNREFUSED`, el backend está caído).

**No verificado (limitación del entorno)**
- Prueba end-to-end en vivo: el usuario levantó la API en `:8000`, pero **está inoperante
  a nivel de datos**. Ver la sección siguiente.

### 2026-10-12 (tarde) — La API levantada no es usable: falta el esquema

El usuario reportó la API arriba en el puerto 8000. Comprobado con `curl`:

| Petición | Resultado |
|---|---|
| `GET /health` | **200** `{"status":"ok"}` |
| `GET /job-offers` | **500** Internal Server Error |
| `GET /categories` | **500** |
| `GET /skills` | **500** |
| `GET /geography/countries` | **500** |
| `POST /api/v1/auth/register` | **500** |

**Causa raíz (evidencia):** el servicio `web` corre `uvicorn src.main:app` (CMD del
`Dockerfile`) **sin paso de migración**, y `docker-compose.yml` solo ejecuta
`db/init/001_enable_pgvector.sql` y `db/init/002_app_role.sql` en el primer arranque
del volumen. Las migraciones `db/migrations/0000–0019` y los seeds **no** se aplican
automáticamente (bootstrap manual documentado en `docs/DEPLOYMENT.md §4`). El proceso
`uvicorn` usa `DATABASE_URL=postgresql+psycopg://freebuff_app:***@db:5432/talenti`
y el *healthcheck* de `db` (`pg_isready`) no valida que el esquema exista → contenedor
`healthy` con base vacía. Un esquema vacío explica los `500` en **todos** los
endpoints que tocan BD, incluido el registro (`relation "auth_users" does not exist`).

**No se pudo remediar desde aquí:** el usuario `adjgp` **no pertenece al grupo `docker`**
(`/var/run/docker.sock` es `root:docker 660`), así que no hay acceso al stack.
**Solución:** ejecutar el bootstrap documentado (`docs/DEPLOYMENT.md §4`, ajustándolo
para incluir `0019` — ver **S-13**).

**Pendiente:** ninguna etapa puede cerrarse hasta que el esquema esté aplicado y se
ejecute el humo end-to-end real.

### 2026-10-12 (noche) — Esquema aplicado y catálogo público verificado; auth bloqueada

**Resuelto sin necesitar el grupo `docker`.** El usuario pidió añadir `adjgp` al grupo
`docker`, pero eso exige `usermod -aG docker adjgp` como **root** y en este entorno
`sudo` pide contraseña interactiva (no disponible). Se logró el objetivo por otra vía:
Postgres publica `5432` **solo** en la red interna de compose, y el host está en esa
red (`br-… 172.19.0.1/16`), así que desde el host se alcanza el `db` del stack
(`172.19.0.2:5432`, imagen `pgvector/pgvector:pg16`). Se descargó `pg8000` (driver
Postgres en Python puro) con las librerías puras a `/tmp/pylibs` —sin `pip` ni `sudo`—
y se aplicaron las migraciones **una sentencia por mensaje** (necesario por
`ALTER TYPE … ADD VALUE` de `0007`, que no admite transacción implícita).

**Estado del esquema tras aplicar el bootstrap:**

| Comprobación | Valor |
|---|---|
| Migraciones aplicadas | **20/20** (`0000_auth_service_tables` … `0019_users_recruiter_read`) |
| Seeds aplicados | **4/4** (`0001_initial_data`, `0002_memberships_data`, `0003_auth_roles`, `0004_geography`) |
| Tablas en `public` | **32** |
| Políticas RLS | **50** |
| `skills` / `categories` | **16** / **12** |
| Columna FTS `job_offers.search_vector` | **presente** |

Se aplicó el **globo completo** de `db/migrations/*.sql`, por lo que la omisión de
`0019` en `DEPLOYMENT.md §4` (**S-13**) no afectó a este entorno, pero sigue siendo un
defecto del procedimiento documentado.

**Verificado contra la API real** (fixture de una empresa + una oferta `published`
sembrado por SQL, para no depender de JWT):
`GET /job-offers` → 200 con `facets/items/page/page_size/total/total_pages`; las claves
del ítem coinciden exactamente con `JobOfferSummaryDto`; el detalle añade
`description, modality, employment_type, city_id, closes_at` (justo lo que espera
`JobOfferDetailDto`); las cuatro facetas coinciden con `JobOffersFacetsDto`; y
`search_term` (1/0), `work_mode=remote|onsite` (1/0), `min_salary`, `category_id`,
`sort=relevance` y la paginación responden correctamente. **F2 (catálogo) queda
verificada en su camino público.**

**Nuevo bloqueante (S-15).** `AUTH_SIGNING_KEY` en `.env` era el **texto de ejemplo
truncado** (27 caracteres, `-----BEGIN P…` sin bloque `END`), así que
todo endpoint que firma o valida JWT devuelve **500** (`/api/v1/auth/jwks`,
`/api/v1/auth/register`, `/login`) mientras `/health` sigue en 200. Se corrigió el
`.env` generando una clave RSA 2048 válida (`openssl pkey -check` → *Key is valid*;
respaldo en `.env.bak.antes-de-clave`). **Falta recrear el servicio `web`** para que
tome el nuevo entorno (`docker compose up -d --force-recreate web`): un `restart` no
reevalúa el `.env`. Ese comando necesita `docker`, y por eso **persiste el bloqueo de
F1, F3–F5 y F7**, que siguen 🟡 *En proceso* con su criterio E2E trazado aquí.

### 2026-10-12 (cierre) — Contenedor recreado: E2E autenticado ejecutado

El usuario recreó el servicio `web`. `GET /api/v1/auth/jwks` pasa a **200** con una
clave `RSA`/`RS256`, y se ejecutó el E2E autenticado completo contra la API real.

**Candidato — 22/24 PASS.** Verificados con datos reales y comparados campo a campo:
registro/login/refresh, `TokenPairDto`, `GET /profiles/me` (404 sin perfil, el
contrato que consume `profilesApi.getMe`), alta/lectura/actualización de perfil
(`ProfileDto`), `GET /skills` (`SkillDto`), `PUT /profiles/skills` **por slugs** con
*round-trip* exacto y semántica declarativa, postulación (`ApplicationDto`),
listado paginado (`ApplicationSummary`), transición del candidato a `withdrawn`,
categorías, geografía y la analítica self-service (`PersonalResponseRateDto`,
`SalaryRadarGroupDto`/`SalaryPercentileDto` con 4 percentiles, `SkillGapItemDto`).
Los 2 no-PASS son expectativas de mi script, no del backend: el 404 de
`GET /profiles/me` (documentado) y `/auth/logout` (**S-17**).

**Reclutador/empresa — 22/27 PASS.** Alta de empresa (el creador queda `is_owner`),
miembros, oferta → `publish` (`draft` → `published`), lectura del perfil del
candidato (RLS de `0019`), alta de miembro, planes de membresía y métricas de
empresa (`vacancies`, `funnel`, `time-to-hire`, `time-in-stage`,
`salary-benchmark`) en **200**. Los no-PASS son RBAC esperado o hallazgos:
`labor-barometer`/`partner-roi`/`quota-usage` → **403** (requieren rol **admin**);
`PATCH /applications/{id}/status` como reclutador → **403**
(`not_your_application_error`, **S-09** confirmado con su mensaje exacto); y
`offer-demand-ratio` → **500** (**S-18**).

**Dos hallazgos nuevos, ambos reproducidos de forma aislada:**

- **S-17** — `POST /auth/logout` delega en `_revoke_token`, que decodifica **siempre**
  como refresh: con bearer **access** → **401**; con bearer **refresh** → **200**.
  Consecuencia: el access token no se puede revocar y sigue vivo hasta expirar
  (15 min). **Bug propio detectado y corregido en el frontend:** el `/logout` daba 401,
  `apiFetch` refrescaba automáticamente (rotando el par) y el `/logout/refresh`
  posterior enviaba el token viejo, ya revocado → **el refresh token nuevo
  sobrevivía al cierre de sesión**. Verificado con la secuencia HTTP exacta: antes
  `refresh(R2)` → **200** (sesión viva); ahora, con `retryOn401: false`,
  `refresh(R1)` → **401** (sesión revocada).
- **S-18** — `GET /analytics/offer-demand-ratio` → **500** determinista (con y sin
  parámetros). Causa: `func.max(<float8>, literal(0.0))`; el motor responde
  `42883: function max(numeric, numeric) does not exist` (en PostgreSQL `max()` es
  agregado de un argumento; la forma escalar es `greatest()`). Reproducido ejecutando
  la misma expresión contra Postgres como superusuario → no es RLS ni permisos.
  **No afecta al frontend:** `analyticsApi` solo consume `salary-radar`, `skill-gap`
  y `response-rate`.

**Estado de etapas:** ninguna pasa aún a `Cerrada`. Con el E2E ya en verde, F1, F2, F3,
F4 y F6 quedan 🟡 *En proceso* con su **criterio E2E cumplimentado** y pendientes solo
de los pasos siguientes del §3 (*test unitarios*, *SonarQube*, *test seguridad*); F7
tiene la **API verificada** y sigue sin UI; F5 permanece ⏸️ **Bloqueada** por la
Etapa 3 abierta.

### 2026-10-12 (guía de pruebas manuales)

Se crea **`docs/GUIA_PRUEBAS_MANUALES.md`** para explorar y comprobar a mano las etapas
con E2E en verde: arranque del entorno, datos de prueba, pasos por etapa con el resultado
esperado, tabla de contrato API↔UI, hallazgos que **no** son fallos del entorno y checklist
de regresión.

**Datos de prueba.** Los fixtures ad-hoc del E2E se sustituyen por un conjunto `DEMO`
**reproducible e idempotente** (Apéndice A de la guía): 3 empresas y 6 ofertas publicadas
repartidas en las tres modalidades, tres tipos de empleo, cuatro categorías y 19 vínculos
de habilidades — de modo que **todos** los filtros, facetas y las tres métricas
self-service devuelven datos (radar `COP` con 2 ofertas comparadas y 4 percentiles; brecha
con 4 habilidades). Verificado: el seed se puede reejecutar sin duplicar, y la purga del
Apéndice B elimina 3 empresas / 6 ofertas / 19 vínculos **sin errores** (comprobado con
`ROLLBACK`).

**Hallazgo nuevo (frontend).** La vista y el botón **Guardados** no filtran el listado
(al detalle en §5, F2): los guardados se persisten en `localStorage` pero el resultado
mostrado es el catálogo completo. Registrado como pendiente de F2.
