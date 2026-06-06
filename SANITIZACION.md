# Plan de Saneamiento — `attendance/front`

> Documento de referencia para sanear el repo contra los issues detectados por
> `react-doctor@0.4.0`, preservando comportamiento y separando los cambios en
> PRs chicos, reversibles y con gates objetivos.

## 0. Baseline y progreso

- **Herramienta:** `npx -y react-doctor@latest --verbose`
- **Comando CI-friendly:** `npx -y react-doctor@latest --verbose --diff`

| Fase | Score | Issues | Security | Bugs | Perf | A11y | Maint | Estado |
|------|-------|--------|----------|------|------|------|-------|--------|
| Baseline | 69 | 57 | 2 | 13 | 8 | 25 | 9 | ✅ |
| **Fase 1** | **70** | **54** | **0** | 13 | 8 | 25 | **8** | ✅ mergeada en este PR |
| 2 (Bugs quick wins) | — | — | 0 | 9 | 8 | 25 | 8 | 🟡 pendiente |
| 3 (A11y lote 1) | — | — | 0 | 9 | 8 | 7 | 8 | ⚪ pendiente |
| 4 (Performance) | — | — | 0 | 9 | 4 | 7 | 8 | ⚪ pendiente |
| 5 (Refactor scheduler) | — | — | 0 | 4 | 4 | 5 | 0 | ⚪ pendiente |
| 6 (Tests, formatter, doctor devDep) | — | — | 0 | 4 | 4 | 5 | 0 | ⚪ pendiente |
| 7 (CI & headers nginx) | — | — | 0 | 4 | 4 | 5 | 0 | ⚪ pendiente |

> Las proyecciones de score son estimaciones. Se recalibran tras cada fase con
> `npx -y react-doctor@latest`.

## 0.1 Stack y contexto

- **Stack:** React 19 + Vite 7 + TS 5.9 + Tailwind 4 + React Router 7 (data) + TanStack Query 5 + react-hook-form 7 + Leaflet + Headless UI.
- **Tooling:** ESLint 9 flat config, pnpm 11.3 (`packageManager` pinned), Vitest ausente, Prettier ausente.
- **CI:** `.github/workflows/lint.yml` corre en PR a `develop`: `pnpm install --frozen-lockfile` + `pnpm lint` + `pnpm exec tsc --noEmit`.
- **CD:** `.github/workflows/deploy.yml` se dispara con tag `vX.Y.Z`; valida que la versión del tag coincida con `package.json`, build/push a GHCR (linux/amd64 + arm64) y deploy vía SSH al VPS con `docker compose` y logout inmediato del registry.
- **Runtime:** Docker multi-stage con `node:lts-alpine` (build) + `nginx:alpine` (serve). `nginx.conf` hace SPA fallback a `index.html` y cachea `/assets/` por 30 días.

### Convenciones del documento
- ✅ Alta confianza / bajo riesgo — ejecutar.
- 🟡 Media confianza — revisar caso por caso, anotado en el PR.
- ⚪ Baja / producto — abrir issue separado, no se aborda en este plan.

---

## 1. Hallazgos por categoría (mapeo 1:1 con react-doctor)

### 1.1 Security — ✅ alta confianza
- ~~`pnpm-workspace.yaml` falta `minimumReleaseAge: 10080`~~ — **resuelto en Fase 1**.
- ~~`pnpm-workspace.yaml` falta `trustPolicy: no-downgrade`~~ — **resuelto en Fase 1**.
- `google-libphonenumber` es dependencia muerta — **resuelto en Fase 1**.

### 1.2 Bugs (13) — ✅ mayoritariamente alta confianza
- `src/router.tsx:16` — awaits secuenciales independientes en `lazy()`. **Fix:** `Promise.all`.
- `src/features/automation/hooks/useAutomation.ts:46` — mutación sin `onSuccess` con `invalidateQueries`. **Fix:** añadir invalidación por `queryKey`.
- `src/features/automation/components/AutomationScheduler.tsx:251/349/397/471/478/488` y `src/components/ErrorPage.tsx:61` — `<button>` sin `type` explícito. **Fix:** `type="button"`.
- `src/features/automation/components/AutomationScheduler.tsx:159` — lógica de evento en `useEffect`. **Fix:** mover al handler.
- `src/features/automation/components/AutomationScheduler.tsx:155` — datos hacia el padre vía effect + callback. **Fix:** levantar el fetch al padre o devolverlo desde un hook.
- `src/features/automation/components/LocationMap.tsx:60` — estado inicializado en effect. **Fix:** `useState(initialValue)` directo.
- `src/features/automation/components/AutomationScheduler.tsx:128` — muchos `useState` relacionados → `useReducer`.

### 1.3 Performance (8) — ✅ alta/media confianza
- **Barrel imports (4):** `src/routes/automation.tsx:2`, `src/pages/LoginPage.tsx:5`, `src/features/automation/components/AutomationScheduler.tsx:26`, `src/pages/AutomationPage.tsx:4`. **Fix:** path directo.
- `src/features/automation/components/LocationSection.tsx:88` — array nuevo cada render como prop. **Fix:** `useMemo` o constante módulo.
- `src/features/automation/components/LocationMap.tsx:59` — `useEffect` setState en mount causa flicker. **Fix:** `useSyncExternalStore` o `suppressHydrationWarning`.
- `src/features/automation/components/countries.ts:21` y `src/features/automation/services/automationService.ts:89` — `.map().filter()`. **Fix:** `for...of` o `reduce`.

### 1.4 Accessibility (25) — 🟡 alta/media confianza
- **`label` sin control asociado (13):** ver ubicaciones en reporte. **Fix:** `htmlFor`.
- **Control sin `aria-label` (9):** inputs/buttons sin texto visible. **Fix:** `aria-label` o `sr-only`.
- `src/pages/LoginPage.tsx:140` — `<a href="#">` usado como botón. **Fix:** ruta `/forgot-password` (decidido).
- `src/features/automation/components/CredentialsSection.tsx:89` — `onClick` sobre `<div>` sin `role`/`onKeyDown`/tabindex. **Fix:** `<button>` o `role="button"` + `tabIndex={0}` + `onKeyDown`.
- `src/features/automation/components/AutomationScheduler.tsx:159` (compartido con bugs) — click sin keyboard.

### 1.5 Maintainability (8 tras Fase 1) — ✅ alta/media confianza
- ~~`package.json` dependencia no usada (`google-libphonenumber`)~~ — **resuelto en Fase 1**.
- **Exports no usados (6):** `authService.ts` (3) + `automation/components/utils.ts` + `useAutomation.ts`. **Fix:** remover `export` o la declaración. Confirmar con `ts-prune`.
- `src/features/automation/components/AutomationScheduler.tsx:173` — función pura reconstruida cada render. **Fix:** mover arriba.
- `src/features/automation/components/AutomationScheduler.tsx:121` — **giant component** (22 KB / ~500 líneas). **Fix:** partir en `Header` / `RuleForm` / `CredentialsCard` / `ActionBar` (Fase 5).

---

## 2. Roadmap por fases (1 PR por fase)

> Gates por fase: `pnpm lint` limpio · `pnpm exec tsc -b --noEmit` limpio · `pnpm build` OK · `react-doctor` score no inferior al baseline de la fase. `pnpm test` cuando exista (Fase 6+).

### ✅ Fase 1 — Higiene y seguridad (este PR)
- [x] Quitar `google-libphonenumber` (unused dep).
- [x] Añadir `minimumReleaseAge: 10080` y `trustPolicy: no-downgrade` a `pnpm-workspace.yaml`.
- [x] Lockfile pasa verificación de supply-chain (295 entries, 3.5s).
- [x] `pnpm install`, `pnpm dedupe`, gates verde.

**Resultado:** Security 2 → 0 · Maint 9 → 8 · Score 69 → 70 · Issues 57 → 54.

> **Nota arquitectónica:** pnpm 11 deprecó el campo `package.json#pnpm`. Todas las settings de proyecto (incluido el antiguo `onlyBuiltDependencies`, renombrado a `allowBuilds` en v11) viven en `pnpm-workspace.yaml`. Por eso se mantiene el yaml y no se migra a `package.json`.

### Fase 2 — Quick wins bugs (PR #2)
- [ ] `src/router.tsx`: `Promise.all` en `lazy()` de la ruta index.
- [ ] `src/features/automation/hooks/useAutomation.ts`: `onSuccess` con `queryClient.invalidateQueries`.
- [ ] Auditoría + `type="button"` en 7 ubicaciones.
- [ ] `AutomationScheduler.tsx:128`: agrupar `useState` en `useReducer`.
- [ ] `LocationMap.tsx:60`: inicializar state directamente.

### Fase 3 — Accesibilidad lote 1 (PR #3)
- [ ] Añadir `htmlFor` en 13 `<label>`.
- [ ] Añadir `aria-label` o `sr-only` en 9 controles.
- [ ] Crear `pages/ForgotPasswordPage.tsx` + ruta `/forgot-password` (reemplaza `<a href="#">`).
- [ ] Activar `eslint-plugin-jsx-a11y` (`jsx-a11y/recommended`).

### Fase 4 — Performance y barrel imports (PR #4)
- [ ] Reescribir 4 barrel imports a paths directos.
- [ ] `LocationSection.tsx:88` → `useMemo` o constante módulo.
- [ ] `countries.ts:21` y `automationService.ts:89` → un solo `for...of`.
- [ ] `LocationMap.tsx:59` → `useSyncExternalStore` o `suppressHydrationWarning`.

### Fase 5 — Refactor estructural (PR #5)
- [ ] `AutomationScheduler.tsx` → dividir en `Header`, `RuleForm` (RandomWindow+Phone+Location), `CredentialsCard`, `ActionBar`.
- [ ] Aprovechar para mover `useEffect` → handlers.
- [ ] `ts-prune` para detectar y remover exports muertos.

### Fase 6 — Calidad de vida (PR #6)
- [ ] `vitest` + `@testing-library/react` + `jsdom` + `@vitest/coverage-v8`.
- [ ] Smoke tests: `LoginPage` renderiza, router carga `/login`, `automationService` happy path.
- [ ] `prettier` + `.prettierrc` mínimo (`singleQuote`, `semi`, `printWidth: 100`).
- [ ] Instalar `react-doctor` como devDep + scripts `pnpm doctor` y `pnpm doctor:diff`.

### Fase 7 — CI & observabilidad (PR #7)
- [ ] `lint.yml`: añadir `pnpm test` y `pnpm doctor` con `--diff` (falla si score baja).
- [ ] `lint.yml`: ejecutar también en `push` a `develop`.
- [ ] `Dockerfile` stage build: añadir `pnpm lint` y `pnpm test` antes de `pnpm build`.
- [ ] `nginx.conf`: añadir headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP mínima).

---

## 3. Decisiones tomadas

1. **Quitar `google-libphonenumber`** — confirmado muerto (solo en `package.json` y `pnpm-lock.yaml`, sin imports en `src/`).
2. **Reemplazar `<a href="#">` de "¿Olvidaste tu contraseña?"** por ruta dedicada `/forgot-password`.
3. **Migrar config de `pnpm-workspace.yaml` a `package.json#pnpm`** — descartado por incompatibilidad con pnpm 11 (deprecation). Se mantiene el yaml con sintaxis v11.
4. **Refactor de `AutomationScheduler.tsx`** en 4-5 sub-componentes (Header, RuleForm, CredentialsCard, ActionBar).

---

## 4. Métricas de éxito

- Score react-doctor ≥ 90/100 al cierre del plan.
- 0 issues Security y 0 issues de Bugs de tipo "high confidence".
- 100% de A11y issues resueltos o documentados como "fuera de alcance".
- CI bloqueante en lint, tsc, test y doctor-diff.

---

## 5. Riesgos y rollback

- **Riesgo principal:** refactor de `AutomationScheduler` puede romper el flujo principal. Mitigación: tests smoke en Fase 6 *antes* del refactor; PR con revisión detallada.
- **Riesgo de supply chain:** `minimumReleaseAge` y `trustPolicy: no-downgrade` pueden bloquear instalación de parches urgentes. Mitigación: `minimumReleaseAgeExclude` por paquete o release en CI con override.
- **Rollback:** cada fase en rama `sanitization/phase-N`, tag de baseline `pre-sanitization`, revert por commit.

---

## 6. Orden de ejecución

`#1 Higiene` → `#2 Bugs` → `#3 A11y` → `#4 Perf` → `#5 Refactor` → `#6 Calidad` → `#7 CI`.

Las fases tempranas son bajo riesgo y dejan la base limpia para las invasivas.
`#5` se hace *después* de los fixes mecánicos para no mezclar lógica y estilo.
