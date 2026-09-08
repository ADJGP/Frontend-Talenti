# JobSplit — High-Performance Split-View SaaS Job Board

A high-performance, keyboard-first job board frontend engineered in **React 19 & Vite** adopting the **Split View (Master-Detail)** pattern. Designed for senior engineers, designers, and tech leaders seeking an instantaneous, zero-reload browsing experience inspired by modern SaaS interfaces like Linear and Superhuman.

---

## Technical Stack & Architecture

- **Core Framework:** React 19 + Vite (TypeScript strict mode)
- **Internationalization (i18n):**
  - Native typed dictionary system supporting **English (EN)** and **Spanish (ES)**
  - Reactive `useTranslation` hook synchronized with Zustand and `localStorage`
  - Zero-dependency, lightweight localization architecture with instant switching
- **State Management:**
  - **TanStack Query (v5):** Asynchronous API state, caching, query invalidation, and optimistic updates
  - **Zustand:** Global synchronous UI state (active job ID, filters, theme, language, command palette, saved bookmarks, applications)
- **Styling, Theme & Motion:**
  - **Tailwind CSS v4:** Design token hierarchy, `@custom-variant dark` manual & system color scheme support
  - **Zero-FOUC Theme Engine:** Inline pre-hydration script, `useTheme` hook with 3-way toggle (Light / Dark / System)
  - **Framer Motion (`motion/react`):** Hardware-accelerated micro-interactions and layout transitions
  - **View Transitions API:** Native browser element morphing on selection
- **UI Components:** Shadcn/UI pattern primitives (`Button`, `Badge`, `Card`, `Input`, `Dialog`, `Skeleton`, `Separator`)
- **Iconography:** Lucide React

---

## Project Folder Map

```text
/src
  /assets                      # Static assets, SVG badges, and brand resources
  /components
    /jobs
      FilterBar.tsx            # Multi-parameter filter strip (search, department, workplace, salary)
      ListCard.tsx             # Job preview card with logo, salary, match badge, and active marker
      DetailsView.tsx          # Sticky dynamic panel with full job description and 1-click apply
      MobileDetailDrawer.tsx   # Responsive slide-up drawer for tablet and mobile viewports
      JobDashboard.tsx         # Master-detail split view coordinator
      ApplyModal.tsx           # 1-Click interactive Quick Apply modal with confetti feedback
    /shared
      Sidebar.tsx              # Slim navigation dock with badge counters and profile status
      Navbar.tsx               # Header with breadcrumbs, Cmd+K trigger, language & theme toggles
      LanguageSwitcher.tsx     # ES/EN language picker with flags and key indicator
      CommandPalette.tsx       # Global Cmd+K modal with quick filters, search, and system actions
      ThemeToggle.tsx          # Dark / Light / System theme controller with icons
      ShortcutsModal.tsx       # Keyboard shortcut reference dialog (Press '?')
      SecondaryViews.tsx       # Applications tracker, Career analytics, Profile, and Settings
    /ui
      badge.tsx                # Multi-variant status badge component
      button.tsx               # Accessible action button with active tactile feedback
      card.tsx                 # Semantic card primitives with subtle elevation
      dialog.tsx               # Accessible modal overlay with backdrop blur
      input.tsx                # Styled form input element
      separator.tsx            # Horizontal and vertical structural divider
      skeleton.tsx             # Shimmer skeleton loader for zero CLS (Cumulative Layout Shift)
  /hooks
    useJobs.ts                 # TanStack Query hooks for job list and job details
    useApply.ts                # TanStack Query mutation hook for application submissions
    useKeyboardShortcuts.ts    # High-speed navigation (J, K, A, S, T, L, Cmd+K, ?)
    useTheme.ts                # Theme engine synchronizing DOM root, OS media query & store
  /i18n
    index.ts                   # Complete bilingual translation dictionaries (ES / EN) and hooks
  /services
    jobsApi.ts                 # REST / FastAPI adapter with fallback to realistic local data
    mockJobs.ts                # Rich dataset of verified tech roles with compatibility scores
  /store
    useJobStore.ts             # Zustand state store with localStorage persistence
    index.ts                   # Store exports
  /types
    index.ts                   # TypeScript interfaces (Job, Filters, ApplicationRecord, Language)
  /utils
    index.ts                   # Class merging (cn), salary formatters, and match score color maps
  App.tsx                      # Root component with QueryClientProvider
  index.css                    # Tailwind CSS v4 styling, custom scrollbars, and @custom-variant dark
  main.tsx                     # Application entry point
```

---

## Keyboard Shortcuts Navigation

JobSplit includes full keyboard navigation for maximum speed:

| Key | Action |
| --- | --- |
| <kbd>J</kbd> | Navigate to the **next** job card down |
| <kbd>K</kbd> | Navigate to the **previous** job card up |
| <kbd>A</kbd> | Open **Quick Apply** modal for selected job |
| <kbd>S</kbd> | Toggle **Bookmark / Save** for selected job |
| <kbd>T</kbd> | Toggle **Theme** (Light ↔ Dark) |
| <kbd>L</kbd> | Toggle **Language** (English ↔ Spanish) |
| <kbd>⌘ + K</kbd> or <kbd>Ctrl + K</kbd> | Open global **Command Palette** |
| <kbd>ESC</kbd> | Dismiss active modal, drawer, or palette |
| <kbd>?</kbd> | Open keyboard shortcuts reference |

*Note: Navigation single-key shortcuts are automatically suppressed when focusing text inputs, textareas, or select dropdowns.*

---

## Connecting Your Backend API

The application communicates through the adapter layer located in `/src/services/jobsApi.ts`.

### 1. Environment Variables

Create a `.env` or `.env.local` file in the project root:

```env
# URL of your production or staging backend API
VITE_API_URL=https://api.yourdomain.com
```

### 2. Expected API Endpoints

When `VITE_API_URL` is set, `jobsApi.ts` automatically proxies requests to your server:

1. **`GET /api/jobs`**
   - **Query Parameters:**
     - `search`: string
     - `department`: string (`Engineering`, `Design`, `Product`, etc.)
     - `workplaceType`: string (`Remote`, `Hybrid`, `On-site`)
     - `experienceLevel`: string (`Junior`, `Senior`, `Staff`, etc.)
     - `minSalary`: number
     - `sortBy`: string (`match`, `recent`, `salary-high`, `salary-low`)
   - **Response Format:**
     ```json
     {
       "jobs": [ ... ],
       "total": 42
     }
     ```

2. **`GET /api/jobs/:id`**
   - **Response Format:** Single `Job` object containing full details, responsibilities, requirements, benefits, hiring manager info, and match breakdown.

3. **`POST /api/applications`**
   - **Payload:**
     ```json
     {
       "jobId": "job-1",
       "fullName": "Candidate Name",
       "email": "email@domain.com",
       "phone": "+1 415 555 0199",
       "resumeFileName": "resume.pdf",
       "coverNote": "Introduction pitch..."
     }
     ```

---

## Design Tokens & Visual Hierarchy

### Typography
- **Primary Body & Display:** Inter (`var(--font-sans)`) with tight tracking (`-0.011em`) for high readability in dense data grids.
- **Monospace Tokens:** JetBrains Mono (`var(--font-mono)`) used for salary bands, keyboard shortcut badges, and match percentages.

### Color Palette & Semantics
- **Primary Accent:** Indigo-600 (`#4f46e5`) with dark mode companion Indigo-400 (`#818cf8`).
- **Canvas Neutrals:**
  - *Light Mode:* Slate-50 background (`#f8fafc`), pure white cards (`#ffffff`), and Slate-200 dividers.
  - *Dark Mode:* Deep Slate-950 canvas (`#020617`), Slate-900 elevated cards (`#0f172a`), and Slate-800 borders (`#1e293b`).
- **Match Compatibility Signals:**
  - `95%+`: Emerald (`#10b981`) — Exceptional compatibility
  - `88% - 94%`: Indigo (`#4f46e5`) — Strong compatibility
  - `80% - 87%`: Blue (`#3b82f6`) — Good compatibility
  - `<80%`: Amber (`#f59e0b`) — Moderate compatibility

### Elevation & Soft-UI
- Border radius capped at 12–16px (`rounded-xl` / `rounded-2xl`).
- High-performance glassmorphism headers with `backdrop-filter: blur(12px)`.
- Fluid scrollbars with custom thumb styling to avoid layout shift.

---

## Internationalization & Localization Engine (i18n)

JobSplit features a reactive, zero-runtime-overhead bilingual localization architecture supporting **Spanish (ES)** and **English (EN)**.

### Architectural Highlights

1. **Typed String Dictionaries (`/src/i18n/index.ts`):**
   - Full TypeScript interface `TranslationKeys` guaranteeing complete key parity between languages at compile time.
   - Comprehensive translations across all UI components: navigation, search & filters, split-card metadata, AI match evaluation, application modal, career insights, talent profile, preferences, and keyboard shortcuts.

2. **Reactive `useTranslation` Hook:**
   - Consumes global language state from the central Zustand store (`useJobStore`).
   - Automatically triggers atomic re-renders when the language changes without reloading the application or losing filter state.

3. **Persistent Language Selection:**
   - Automatically saved to `localStorage` (`jobsplit_lang`).
   - Defaults cleanly to English (`en`) or the user's previously chosen language.

4. **Multiple Interactive Switchers:**
   - **Top Navigation Bar (`LanguageSwitcher`):** One-click toggle with national flag icons and active state badge.
   - **Keyboard Shortcut:** Press <kbd>L</kbd> anywhere (outside active text inputs) to toggle between Spanish and English instantly.
   - **Command Palette (<kbd>⌘ + K</kbd>):** Dedicated commands under the *System* category (`Cambiar a Español`, `Switch to English`).

---

## Dark Mode Engine & Tailwind CSS v4 Configuration

Tailwind CSS v4 introduces a CSS-first configuration model where the `dark:` variant defaults exclusively to the operating system's `@media (prefers-color-scheme: dark)` query. A custom engine was engineered to enable class-based manual switching with OS synchronization.

### Technical Implementation

1. **Custom Variant Declaration (`src/index.css`):**
   ```css
   @import "tailwindcss";

   /* Enables manual and class-based dark mode triggering */
   @custom-variant dark (&:where(.dark, .dark *));
   ```
   This ensures all `dark:...` utility classes immediately activate when `.dark` is present on the root `<html>` element.

2. **Centralized `useTheme` Hook (`/src/hooks/useTheme.ts`):**
   - Coordinates three distinct modes:
     - **`light`:** Explicit light mode (`.dark` removed from `<html>`).
     - **`dark`:** Explicit dark mode (`.dark` added to `<html>`).
     - **`system`:** Dynamically tracks the OS preference via `window.matchMedia('(prefers-color-scheme: dark)')` with real-time `change` event listeners.
   - Updates `document.documentElement.style.colorScheme` to match, ensuring native browser elements (scrollbars, form controls) adapt their styling.

3. **Zero Flash of Unstyled Content (FOUC) Script (`index.html`):**
   - Synchronous pre-hydration script in `<head>` inspects `localStorage` (`jobsplit_theme`) before React mounts:
   ```html
   <script>
     (function() {
       try {
         const theme = localStorage.getItem('jobsplit_theme') || 'dark';
         const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
         if (isDark) {
           document.documentElement.classList.add('dark');
           document.documentElement.style.colorScheme = 'dark';
         } else {
           document.documentElement.classList.remove('dark');
           document.documentElement.style.colorScheme = 'light';
         }
       } catch (e) {}
     })();
   </script>
   ```

4. **Multi-Surface Theme Controls:**
   - **Header Toggle (`ThemeToggle.tsx`):** 3-segmented button group (Light, Dark, System) with Lucide icons (`Sun`, `Moon`, `Monitor`).
   - **Keyboard Shortcut:** Press <kbd>T</kbd> to toggle between Light and Dark mode instantaneously.
   - **Settings View:** Full theme configuration cards with live indicator.
   - **Command Palette:** Quick-switch commands for all three modes.

---

## Deployment Guide

### Deploying to Vercel

1. Push your code to a Git repository (GitHub / GitLab / Bitbucket).
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Select **Vite** as the framework preset.
4. Set the Build & Output settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your backend API endpoint (if applicable).
6. Click **Deploy**.

For single-page client-side routing on Vercel, a `vercel.json` rewrites file can be configured:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Deploying to Netlify

1. Connect your repository in the [Netlify App](https://app.netlify.com).
2. Set configuration:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Under **Site configuration > Environment variables**, add your `VITE_API_URL`.
4. Add a `_redirects` file in `/public/_redirects`:
   ```text
   /*    /index.html   200
   ```
5. Deploy site.

---

## Quality & Accessibility (WCAG 2.1)

- **Keyboard Trap Free:** Modals cycle focus and close with <kbd>ESC</kbd>.
- **High Contrast:** All text passes WCAG AA contrast ratio standards (minimum 4.5:1).
- **Reduced Motion Support:** Respects user accessibility preferences for animations.
- **Zero Cumulative Layout Shift:** Content sections use calculated skeleton screens while fetching.
