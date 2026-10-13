# Talenti — Frontend de la Bolsa de Trabajo

Frontend de **Talenti**, integrado con la API FastAPI del repo **`BD_Bolsa_Trabajo`**.
Vista dividida (master-detail) tipo Linear/Superhuman para explorar ofertas, con
autenticación real, postulaciones end-to-end, perfil de candidato, analítica de carrera y
un **panel de reclutador** (empresa, ofertas, postulantes, embudo y métricas).

> **Estado de integración y plan por etapas:** ver [`docs/PLAN_TRABAJO.md`](docs/PLAN_TRABAJO.md).
> **Ajustes solicitados al backend:** ver [`sugerencias.md`](sugerencias.md).

---

## Stack

- **React 19 + Vite** (TypeScript)
  > Nota: `tsconfig.json` **no** tiene `strict` ni `noUnusedLocals` activados todavía.
  > El código compila limpio y sin símbolos sin usar, pero habilitar `strict` (≈1000
  > errores preexistentes) queda como tarea aparte.
- **TanStack Query v5** (estado asíncrono de la API) + **Zustand** (estado de UI)
- **Tailwind CSS v4** + **Framer Motion** + **Lucide**
- **i18n** propia ES/EN (`src/i18n/index.ts`)
- **Sin datos mock**: todo el contenido proviene de la API real

---

## Requisitos previos

El backend debe estar corriendo (por defecto en `http://localhost:8000`):

```bash
cd ../BD_Bolsa_Trabajo
cp .env.example .env      # completar secretos (POSTGRES_*, AUTH_SIGNING_KEY, APP_DB_PASSWORD…)
docker compose up -d      # db + web
```

---

## Desarrollo

```bash
cp .env.example .env      # VITE_API_URL vacío + VITE_API_PROXY_TARGET=http://localhost:8000
npm install
npm run dev               # http://localhost:3000
```

Con `VITE_API_URL` vacío el SPA llama al **mismo origen** y el proxy de Vite
(`server.proxy` en `vite.config.ts`) reenvía a la API, de modo que el navegador nunca
hace una petición cross-origin (sin CORS). El proxy cubre los mismos prefijos que
`nginx.conf`: `/api/v1`, `/job-offers`, `/applications`, `/categories`, `/companies`,
`/memberships`, `/profiles`, `/skills`, `/soft-skills`, `/cvs`, `/ats`, `/evaluaciones`,
`/geography`, `/analytics`, `/health`, `/.well-known`.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API. **Vacío** (recomendado) = mismo origen vía proxy. Absoluta = llamada directa (el backend debe permitir el origen — `sugerencias.md` S-01). |
| `VITE_API_PROXY_TARGET` | Solo dev: destino del proxy. Por defecto `http://localhost:8000`. |

---

## Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo en `:3000` |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | `tsc --noEmit` (verificación de tipos) |

---

## Endpoints de la API consumidos

La capa de servicios (`src/services/`) es la única que habla con la API:

| Servicio | Endpoints |
|---|---|
| `authApi.ts` | `GET /api/v1/auth/me` (roles), `POST /api/v1/auth/{register,login,refresh,logout,logout/refresh}` |
| `jobsApi.ts` | `GET /job-offers` (paginado + facetas), `GET /job-offers/{id}`, `POST /job-offers`, `PATCH /job-offers/{id}/{publish,close}` |
| `applicationsApi.ts` | `POST/GET /applications`, `GET /applications/{id}`, `PATCH /applications/{id}`, `GET /applications?job_offer_id=`, `PATCH /applications/{id}/status` |
| `profilesApi.ts` | `GET/POST /profiles`, `GET/PATCH /profiles/me`, `GET/PUT /profiles/skills`, `GET /skills` |
| `companiesApi.ts` | `POST /companies`, `GET /companies/{id}`, `GET|POST /companies/{id}/members` |
| `analyticsApi.ts` | `GET /analytics/{salary-radar,skill-gap,response-rate}` + métricas de empresa (`{vacancies,funnel,time-to-hire,time-in-stage,salary-benchmark,offer-demand-ratio}`) |

El cliente `src/services/api.ts` añade el `Authorization: Bearer`, refresca la sesión una
vez ante `401`, normaliza los errores en `ApiError` y expone `retryAfter` para los `429`.

### Sesión

- El **access token** (15 min) vive **solo en memoria**.
- El **refresh token** se persiste en `localStorage` (`talenti_refresh_token`) porque la API
  lo devuelve en el cuerpo de la respuesta (ver `sugerencias.md` S-07). Se canjea al arrancar
  la app para restaurar la sesión.
- Los **roles** (`candidate`/`recruiter`/`admin`) se resuelven con `GET /api/v1/auth/me`
  (**S-03**), no decodificando el JWT; si esa llamada falla, la sesión cae a los claims del
  token y la navegación por rol queda oculta.

---

## Estructura

```text
src/
  components/
    auth/AuthScreen.tsx        # Login / registro (gate de vistas privadas)
    jobs/                      # FilterBar, ListCard, DetailsView, JobDashboard, ApplyModal
    recruiter/RecruiterView.tsx # Panel de reclutador (F7): empresa, ofertas, embudo, métricas
    shared/                    # Sidebar, Navbar, MainLayout, CommandPalette, SecondaryViews…
    ui/                        # Primitivas (button, badge, dialog, input, skeleton…)
  hooks/                       # useJobs, useApply, useProfile, useTheme, useKeyboardShortcuts
  i18n/index.ts                # Diccionarios ES/EN + useTranslation
  services/                    # api, tokenStorage, *Api, talentiTypes (DTOs), jobAdapter
  store/                       # useJobStore (UI), useAuthStore (sesión)
  types/index.ts               # Modelo de UI (campos opcionales = no provistos por la API)
  utils/                       # cn, formatSalary, getMatchScoreColor, jwt
```

---

## Comportamiento con datos incompletos

El contrato actual del backend no expone algunos campos que la UI sabe renderizar
(puntaje de compatibilidad, skills de la oferta, responsable de selección, secciones de
la descripción…). Esos bloques **se ocultan** cuando faltan; nunca se rellenan con datos
inventados. El detalle de cada carencia está en `sugerencias.md`.

---

## Despliegue

`Dockerfile` (multi-stage) construye el SPA y lo sirve con **nginx**, que además actúa de
**proxy inverso** de la API manteniendo el mismo origen (sin CORS):

```bash
docker compose up -d --build     # → http://localhost:3000
# API_UPSTREAM=host.docker.internal:8000 (por defecto) o <servicio>:8000
```

También puede desplegarse como SPA estático (Vercel/Netlify) configurando `VITE_API_URL`;
en ese caso el backend debe habilitar CORS para el origen del SPA (`sugerencias.md` S-01).

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| <kbd>J</kbd> / <kbd>K</kbd> | Navegar a la oferta siguiente / anterior |
| <kbd>A</kbd> | Postulación rápida de la oferta activa |
| <kbd>S</kbd> | Guardar / quitar de favoritos |
| <kbd>T</kbd> | Alternar tema (claro ↔ oscuro) |
| <kbd>L</kbd> | Alternar idioma (ES ↔ EN) |
| <kbd>⌘/Ctrl + K</kbd> | Command Palette |
| <kbd>ESC</kbd> | Cerrar modales y paneles |
| <kbd>?</kbd> | Guía de atajos |

---

## Accesibilidad

Navegación completa por teclado, cierre con `ESC`, soporte de `prefers-reduced-motion`,
contraste WCAG AA y skeletons calculados para evitar CLS.
