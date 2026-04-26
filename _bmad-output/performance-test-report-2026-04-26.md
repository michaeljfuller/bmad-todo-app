# Performance test report — BMad Todo app

**Date:** 2026-04-26  
**Tester:** Quinn (QA) via Chrome DevTools MCP (`performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight`)  
**Subject:** `http://localhost:5173/` (Vite dev client) + API `http://localhost:3000`

## Environment

| Setting | Value |
|--------|--------|
| Client | `npm run dev` (workspace client), default Vite port **5173** |
| API | Fastify on **3000**, `CORS_ORIGIN=http://localhost:5173` |
| CPU throttling | None |
| Network throttling | None |
| CrUX field data | Not available for localhost |

Lab metrics below reflect **unthrottled local development**, not production or mobile emulation. Use them for regression baselines and relative comparisons, not as end-user guarantees.

## Artifacts

Chrome MCP saved gzip traces with a double `.json` suffix (tool behavior):

| Test | File |
|------|------|
| Full navigation (reload + auto-stop) | `_bmad-output/perf-trace-2026-04-26-load.json.json.gz` |
| In-session interaction | `_bmad-output/perf-trace-2026-04-26-interaction.json.json.gz` |

Open in Chrome **Performance** panel: **Load profile** → choose the `.json.gz` file.

---

## Test 1 — Cold navigation (reload trace)

**Procedure:** Navigate to `http://localhost:5173/`, start trace with `reload: true`, `autoStop: true`.

### Core Web Vitals (lab)

| Metric | Value | Notes |
|--------|-------|--------|
| **LCP** | **105 ms** | Well within “good” (&lt; 2.5 s) |
| **CLS** | **0.00** | No meaningful layout shift on load |
| **INP** | *Not attributed to navigation trace* | Use interaction trace for INP |

### LCP breakdown (insight: `LCPBreakdown`, set `NAVIGATION_0`)

| Phase | Time | Share of LCP |
|-------|------|----------------|
| TTFB | 4 ms | ~3.8% |
| Element render delay | 101 ms | ~96.2% |

LCP element was **text** (secondary caption), not a network-fetched image. Dominant cost is **render delay** after fast TTFB, typical for a small SPA after HTML arrives.

### Critical path (insight: `NetworkDependencyTree`, set `NAVIGATION_0`)

- **Max critical path latency:** ~56 ms  
- Longest chain (simplified): document → `main.tsx` → `App.tsx` → todo modules → **`GET http://localhost:3000/todos`** (~56 ms end-to-end in this trace).  
- Vite transforms dependency chain (`@vite/client`, `@react-refresh`, React, TanStack Query, feature modules) runs in parallel where possible; the **API fetch** is the deepest single-origin bottleneck on first paint path for data.

**Preconnect:** Insight reported no `preconnect` hints. For **production** cross-origin APIs, evaluating `dns-prefetch` / `preconnect` to the API host may shave latency on real networks (not exercised here on loopback).

### Other insights (navigation)

- **CharacterSet** — flagged in the trace summary; worth confirming production HTML sends `charset` early (meta or `Content-Type`). Dev server HTML should be checked in a prod build audit.

---

## Test 2 — Interaction trace (no reload)

**Procedure:** With the todo page already loaded, started trace (`reload: false`, `autoStop: false`), filled **“New task”**, clicked **Add**, then stopped trace.

### Core Web Vitals (lab)

| Metric | Value | Notes |
|--------|-------|--------|
| **INP** | **70 ms** | **Good** (≤ 200 ms) |
| **CLS** | **0.01** | Minor shift; still effectively stable |

### INP breakdown (insight: `INPBreakdown`, set `NO_NAVIGATION`)

Longest interaction in this window was a **`keypress`** (typing in the field), total **70 ms**:

| Phase | Time |
|-------|------|
| Input delay | ~0.5 ms |
| Processing duration | ~29 ms |
| Presentation delay | ~41 ms |

Presentation delay was the largest slice for this interaction—worth watching if the UI grows heavier; for this run, overall INP remains healthy.

---

## Summary

1. **Load:** Excellent lab LCP and CLS on localhost; critical path is short, with **`GET /todos`** as the main data dependency on the path to interactive UI.  
2. **Interaction:** INP in the **good** range for the captured interaction; small CLS.  
3. **Next steps (optional):** Re-run with **CPU 4× slowdown** and **Fast 3G** in DevTools for stress closer to mobile; run a **production build** (`preview` or deployed static + API) for realistic caching and bundle shapes; use **Lighthouse** MCP for a11y/SEO/best-practices (its performance score is separate from these traces—see MCP tool description).

---

## Lighthouse MCP note

`lighthouse_audit` in this MCP is documented as **excluding performance**; use **performance traces** (as here) for Core Web Vitals-style load and interaction analysis.
