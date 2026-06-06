# Plan de Saneamiento — `attendance/front`

> Documento de referencia para sanear el repo contra los issues detectados por
> `react-doctor@0.4.0`, preservando comportamiento y separando los cambios en
> PRs chicos, reversibles y con gates objetivos.

## 0. Baseline y progreso

- **Herramienta:** `pnpm doctor` (alias de `react-doctor --verbose`).
- **Comando CI-friendly:** `pnpm doctor:diff`.

| Fase | Score | Issues | Security | Bugs | Perf | A11y | Maint | Estado |
|------|-------|--------|----------|------|------|------|-------|--------|
| Baseline | 69 | 57 | 2 | 13 | 8 | 25 | 9 | ✅ |
| 1 · Higiene y seguridad | 70 | 54 | **0** | 13 | 8 | 25 | 8 | ✅ |
| 2 · Bugs quick wins | 75 | 43 | 0 | **3** | 7 | 25 | 8 | ✅ |
| 3 · A11y lote 1 | 80 | 21 | 0 | 3 | 7 | **3** | 8 | ✅ |
| 4 · Performance | 82 | 14 | 0 | 3 | **0** | 3 | 8 | ✅ |
| 5 · Refactor scheduler | 100 | **0** | 0 | 0 | 0 | 0 | **0** | ✅ |
| 6 · Vitest + Prettier | 100 | 0 | 0 | 0 | 0 | 0 | 0 | ✅ |
| 7 · CI & nginx | 100 | 0 | 0 | 0 | 0 | 0 | 0 | ✅ |

> Resultado final: **react-doctor 100/100, 0 issues**. Cierre anticipado de las
> 5 fases (las estimaciones preveían 90+ al final; la fase 5 absorbió
> Mantenibilidad más rápido de lo previsto al limpiar exports muertos y mover
> la lógica de eventos a handlers).

## 0.1 Stack y contexto

- **Stack:** React 19 + Vite 7 + TS 5.9 + Tailwind 4 + React Router 7 (data) + TanStack Query 5 + react-hook-form 7 + Leaflet + Headless UI.
- **Tooling:** ESLint 9 flat + `eslint-plugin-jsx-a11y`, pnpm 11.3 (con supply-chain hardening), Vitest 4 + Testing Library + jsdom, Prettier 3.
- **CI:** `.github/workflows/lint.yml` con 4 jobs: `lint` (eslint + prettier + tsc), `test` (vitest), `build` (depende de lint+test), `doctor` (react-doctor, continue-on-error).
- **CD:** `.github/workflows/deploy.yml` se dispara con tag `vX.Y.Z`; valida que la versión del tag coincida con `package.json`, build/push a GHCR (linux/amd64 + arm64) y deploy vía SSH al VPS con `docker compose` y logout inmediato del registry.
- **Runtime:** Docker multi-stage con `node:lts-alpine` (build — ahora corre `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` antes de buildear) + `nginx:alpine` (serve). `nginx.conf` hace SPA fallback a `index.html`, cachea `/assets/` por 30 días y emite headers de seguridad + CSP.

### Convenciones del documento
- ✅ Alta confianza / bajo riesgo — ejecutado.
- 🟡 Media confianza — ejecutado con notas.
- ⚪ Baja / producto — no abordado.

---

## 1. Hallazgos por categoría (mapeo 1:1 con react-doctor)

### 1.1 Security — ✅ cerrado en Fase 1
- ✅ `pnpm-workspace.yaml`: `minimumReleaseAge: 10080` y `trustPolicy: no-downgrade` añadidos.
- ✅ `google-libphonenumber` (dependencia muerta) eliminado.

### 1.2 Bugs — ✅ cerrado en Fases 2 y 5
- ✅ `src/router.tsx`: `Promise.all` en `lazy()` de la ruta index (Fase 2).
- ✅ `src/features/automation/hooks/useAutomation.ts`: `invalidateQueries` en `useManualActionToken` (Fase 2).
- ✅ `<button>` sin `type` en 7 ubicaciones (Fase 2).
- ✅ `LocationMap.tsx`: state inicializado en effect → eliminado (Fase 2).
- ✅ `AutomationScheduler.tsx`: useReducer para `submit` (idle|saving|done{status}) (Fase 5).
- ✅ Lógica de evento en effect (`credentialsMetadata` mirror) → eliminado (Fase 5).
- ✅ Datos hacia el padre vía effect + callback → levantado al hook de formulario (Fase 5).

### 1.3 Performance — ✅ cerrado en Fase 4
- ✅ 4 barrel imports reemplazados por paths directos.
- ✅ `LocationSection`: array prop memoizado con `useMemo`.
- ✅ `countries.ts` y `automationService.ts`: cadenas `.map().filter()` colapsadas a un `for...of`.

### 1.4 Accessibility — ✅ cerrado en Fases 3 y 5
- ✅ 13 `<label>` con `htmlFor` añadido.
- ✅ 9 controles con `aria-label` / `aria-pressed` / `aria-labelledby`.
- ✅ `<a href="#">` de "¿Olvidaste mi contraseña?" reemplazado por `<Link to="/forgot-password">` + nueva `ForgotPasswordPage` (Fase 3).
- ✅ `<div role="group">` → `<fieldset>` + `<legend>` (Fase 5).
- ✅ `<div role="status">` → `<output aria-live="polite">` (Fase 5).
- ✅ `<span onClick>` en toggle de visibilidad de contraseña → `<button type="button">` con `aria-label`/`aria-pressed` (Fase 3).
- ✅ `eslint-plugin-jsx-a11y@6.10.2` añadido como devDep con reglas recomendadas (Fase 3).

### 1.5 Maintainability — ✅ cerrado en Fases 1 y 5
- ✅ `google-libphonenumber` eliminado (Fase 1).
- ✅ 4 exports muertos en `authService.ts` (`clearTokens`, `refreshSession`, `ensureAuthTokens`, `NetworkError`) → module-private (Fase 5).
- ✅ `isValidTime` y `automationKeys` → module-private (Fase 5).
- ✅ Re-exports muertos de `useFormContext`/`useWatch`/`Control` en `useAutomationForm` → eliminados (Fase 5).
- ✅ `AutomationScheduler.tsx` dividido en 7 sub-componentes + hook de formulario (Fase 5).
- ✅ `toggleDay` y helpers de form (`toFormValues`, `buildPersistPayload`) movidos a module scope (Fase 5).

---

## 2. Roadmap por fases — HISTÓRICO

### ✅ Fase 1 — Higiene y seguridad
- [x] Quitar `google-libphonenumber` (unused dep).
- [x] Añadir `minimumReleaseAge: 10080` y `trustPolicy: no-downgrade` a `pnpm-workspace.yaml`.
- [x] `pnpm install`, gates verde.

**Resultado:** Security 2 → 0 · Maint 9 → 8 · Score 69 → 70 · Issues 57 → 54.

> **Nota arquitectónica:** pnpm 11 deprecó el campo `package.json#pnpm`. Todas
> las settings de proyecto (incluido el antiguo `onlyBuiltDependencies`,
> renombrado a `allowBuilds` en v11) viven en `pnpm-workspace.yaml`. La
> configuración de hardening aplicada:
> ```yaml
> allowBuilds:
>   esbuild: true
> minimumReleaseAge: 10080
> trustPolicy: no-downgrade
> trustPolicyExclude:        # añadido en fases 3 y 6 para transitive deps
>   - semver@6.3.1
>   - ast-v8-to-istanbul@1.0.2
> ```

### ✅ Fase 2 — Quick wins bugs
- [x] `src/router.tsx`: `Promise.all` en `lazy()`.
- [x] `useAutomation.ts`: `invalidateQueries` en `useManualActionToken`.
- [x] `type="button"` en 7 ubicaciones.
- [x] `LocationMap.tsx`: state inicializado directo, sin effect.
- [ ] `useReducer` para AutomationScheduler → **movido a Fase 5** (el refactor del giant component absorbe el cambio limpiamente).

**Resultado:** Bugs 13 → 3 · Score 70 → 75 · Issues 54 → 43.

### ✅ Fase 3 — Accesibilidad lote 1
- [x] `htmlFor` en 13 `<label>`.
- [x] `aria-label` / `aria-pressed` / `aria-labelledby` en 9 controles.
- [x] `pages/ForgotPasswordPage.tsx` + ruta `/forgot-password`.
- [x] `eslint-plugin-jsx-a11y@6.10.2` con reglas recomendadas.

**Resultado:** A11y 25 → 3 · Score 75 → 80 · Issues 43 → 21.

### ✅ Fase 4 — Performance
- [x] 4 barrel imports a paths directos.
- [x] `LocationSection` con `useMemo` en el tuple `[lat, lng]`.
- [x] `countries.ts` y `automationService.ts`: cadenas `.map().filter()` a `for...of`.

**Resultado:** Perf 7 → 0 · Score 80 → 82 · Issues 21 → 14.

### ✅ Fase 5 — Refactor estructural (giant component)
- [x] `useAutomationForm.ts`: hook con `useForm` + `useReducer` para `submit` + payload builder + `FormProvider`.
- [x] `SchedulerHeader.tsx`, `HeroSection.tsx`, `TimezonePicker.tsx`, `ScheduleBlock.tsx`, `ActionBar.tsx`, `SaveToast.tsx` (memo cada uno).
- [x] `AutomationScheduler.tsx` reducido de 533 → ~165 líneas.
- [x] Exports muertos eliminados (8 symbols).
- [x] Bonus: `useReducer` (Fase 2 diferido), eventos en effect eliminados, datos a padre eliminados, `toggleDay`/helpers a module scope.

**Resultado:** Bugs 3 → 0 · A11y 3 → 0 · Maint 8 → 0 · Score 82 → **100** · Issues 14 → **0**.

### ✅ Fase 6 — Calidad de vida
- [x] `vitest@4.1.7` + `@testing-library/react` + `jsdom` + `@vitest/coverage-v8` + Prettier 3.
- [x] `vitest.config.ts` + `src/test/setup.ts` + `.prettierrc` + `.prettierignore`.
- [x] Tests smoke (15 tests, 3 files): `utils.test.ts`, `toggleDay.test.ts`, `router.test.tsx`.
- [x] Scripts `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`, `pnpm format`, `pnpm format:check`, `pnpm typecheck`, `pnpm doctor`, `pnpm doctor:diff`.
- [x] `react-doctor` **no** se instala como devDep (sus deps transitivas beta en `effect` fallan `trustPolicy: no-downgrade`); se ejecuta vía `npx`.

**Resultado:** Score 100/100 mantenido. Cobertura base establecida.

### ✅ Fase 7 — CI & observabilidad
- [x] `.github/workflows/lint.yml` con 4 jobs: `lint`, `test`, `build` (necesita lint+test), `doctor` (continue-on-error).
- [x] Trigger en `push` a develop/master + `pull_request`.
- [x] `Dockerfile`: build stage corre `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` antes de buildear.
- [x] `nginx.conf`: headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) + CSP estricta.

**Resultado:** CI bloqueante para regresiones de lint/typecheck/test/build.

---

## 3. Decisiones tomadas

1. **Quitar `google-libphonenumber`** — confirmado muerto.
2. **Reemplazar `<a href="#">`** por ruta dedicada `/forgot-password` — implementado en Fase 3.
3. **Workspace config en `pnpm-workspace.yaml`** — pnpm 11 deprecó `package.json#pnpm`. El yaml es ahora la única ubicación canónica.
4. **Refactor de `AutomationScheduler.tsx`** en 7 piezas (Header, Hero, Timezone, ScheduleBlock reutilizable, ActionBar, SaveToast, hook de formulario) — cerrado en Fase 5.
5. **`react-doctor` vía npx, no devDep** — sus transitivas `effect@4.0.0-beta.70` etc. fallan el trust policy estricto. Mantener via `npx -y react-doctor@latest` preserva el flujo sin contaminar el install graph.

---

## 4. Métricas de éxito (alcanzadas)

- ✅ Score react-doctor ≥ 90/100 → **100/100**.
- ✅ 0 issues Security y 0 issues de Bugs de tipo "high confidence" → **0/0/0/0**.
- ✅ 100% de A11y issues resueltos → **0**.
- ✅ CI bloqueante en lint, tsc, test, format, build y doctor (continue-on-error).
- ✅ Suite de tests base (15 tests smoke).

---

## 5. Riesgos y mitigación (post-mortem)

- **`trustPolicy: no-downgrade` es estricto** — bloquea deps con cambios de trust evidence. Mitigación: `trustPolicyExclude` por paquete, ejecutado en Fases 3 y 6.
- **`react-doctor` no instalable localmente** — decisión consciente de usar `npx` para evitar deps beta. Documentado en `package.json` scripts.
- **Refactor de `AutomationScheduler`** se hizo sin tests (no había suite). Mitigación: validación manual con `pnpm build` y gates verdes; tests añadidos en Fase 6 sobre las piezas críticas (utils + toggleDay + router smoke).

---

## 6. Commits del plan (orden cronológico)

```
fase 1   37eaf09  chore(sanitization): phase 1 — pnpm hardening + drop unused google-libphonenumber
fase 2   e9bcddc  fix(sanitization): phase 2 — quick bug wins
fase 3   4bfc604  fix(sanitization): phase 3 — accessibility lote 1
fase 4   3719f38  perf(sanitization): phase 4 — performance
fase 5   548e289  refactor(sanitization): phase 5 — split AutomationScheduler + drop dead exports
fase 6   5450dc7  chore(sanitization): phase 6 — vitest + prettier + smoke tests
fase 7   fcc308b  ci(sanitization): phase 7 — CI, Docker, nginx hardening
docs     545a229  docs(sanitization): update SANITIZACION.md with final results
merge    c58e1ad  Merge branch 'master' into develop
style    85e9afe  style(sanitization): apply prettier to merged automationService.ts
```

## 7. Estrategia de branching (post-saneamiento)

Tras la consolidación, el repo quedó con una sola rama activa:

| Rama | Estado | Notas |
|------|--------|-------|
| `develop` (local + `origin/develop`) | ✅ activa, default en GitHub | Contiene los 8 commits de sanitization + el fix `539d933` (mark-endpoint). |
| `master` | 🗑️ borrada (local + remoto) | Reemplazada por `develop`. GitHub no permite borrar la rama default, así que se cambió el default a `develop` antes de borrar `master` (`gh repo edit jezer10/attendance-react --default-branch develop`). |
| `fix/attendance-mark-endpoint` | 🗑️ borrada en origin | Ya mergeada en `develop` (PR #7). GitHub prunea automáticamente las branches con PR cerrado. |
| `chore/sync-develop-with-master` | 🗑️ borrada en origin | Ya mergeada en `develop` (PR #6). Idem. |

### Política recomendada a futuro

- **`develop`** es la rama de integración. PRs contra develop.
- Para deploys, abrir PRs con tag semver o usar `workflow_dispatch` con input de versión, similar al `.github/workflows/deploy.yml` actual.
- Mantener `develop` siempre verde: CI corre lint + format + tsc + test + build + doctor en cada push.
- Feature branches: nombre `<tipo>/<scope-corto>`, hacer PR contra develop, mergear, borrar branch. No acumular ramas zombie.

### Resultado de la consolidación

- Merge conflict único y mínimo: 4 líneas en `automationService.ts` (URL + body del endpoint `markAutomationNow`). Resuelto tomando el fix de `develop` (HEAD) que es el comportamiento correcto del API.
- Prettier reformateó el archivo mergeado al estilo del repo (un solo commit `style(sanitization)`).
- Gates en `develop` post-merge: ✅ lint, ✅ format, ✅ test (15/15), ✅ typecheck, ✅ build, ✅ doctor 100/100.
- Default branch en GitHub: `develop`. `origin/HEAD` ya no apunta a `master` (que ya no existe).
