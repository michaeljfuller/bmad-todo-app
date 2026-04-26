# Security review — bmad-todo-app

**Date:** 2026-04-26  
**Scope:** `api/` (Fastify 5, Drizzle, SQLite), `client/` (Vite, React 19), shared contracts.  
**Method:** Static review (grep + targeted file reads); not a penetration test or dependency audit.

---

## Executive summary

The codebase follows several important safe defaults: **parameterized DB access**, **strict JSON schemas** with `additionalProperties: false`, **safe handling of 500-series errors** in the API envelope, **React text rendering** for user-controlled todo text (no `dangerouslySetInnerHTML`), and **Swagger UI gated off production**. Gaps are mostly **defense-in-depth and operational hardening**: no **auth**, no **rate limiting**, limited **HTTP security headers**, and a few **client-side trust** edges on list responses.

---

## Strengths (keep as-is)

| Area | What we observed |
|------|-------------------|
| SQL injection | Todos use Drizzle `insert` / `update` / `delete` / `select` with bound values; schema `sql` templates are static defaults, not user input. |
| Input validation | `postBodySchema` enforces string `text` with `minLength: 1`, `maxLength: 10_000`; patch body is boolean-only. |
| Mass assignment | Bodies use `additionalProperties: false`. |
| ID handling | `parseTodoId` rejects non-numeric / unsafe integer ids before DB work; aligns with 404 behavior. |
| XSS (primary UI) | Todo `text` is rendered inside normal React children (`{todo.text}`), which escapes HTML. |
| Error leakage (5xx) | `error-envelope.js` returns a generic message for `statusCode >= 500`. |
| CORS | Plugin only registers when `CORS_ORIGIN` is set; avoids a wildcard default. Methods include PATCH/DELETE needed by the SPA. |
| OpenAPI UI | `@fastify/swagger` / UI path returns early when `NODE_ENV === 'production'` after shared schemas are registered. |
| Browser credentials | `fetch` uses `credentials: 'omit'` — appropriate if the API is not cookie-session based; reduces accidental cookie exposure to the API origin. |

---

## Findings and remediations

### 1. Broken access control — no authentication or authorization (severity: **high** for any shared/real deployment)

**Finding:** The `/todos` API has no auth. Any client that can reach the network can list, create, update, and delete **all** todos.

**Risk:** Data breach, vandalism, and abuse in any environment where the API is reachable beyond a single trusted operator.

**Remediation:**

- Add an identity layer appropriate to the product (e.g. API keys for internal tools, session cookies + CSRF for browser-first, or OAuth2/JWT for SPAs).
- Scope every row by **tenant / user id** in the DB and in every query.
- Revisit CORS once cookies are used (`credentials: 'include'` + explicit `Access-Control-Allow-Credentials` + non-wildcard origin).

---

### 2. Denial of service and abuse — no rate limiting (severity: **medium**)

**Finding:** Nothing throttles request frequency or list size. `GET /todos` returns the full table with no pagination.

**Risk:** Resource exhaustion (CPU, SQLite writer lock, bandwidth), noisy neighbors on shared hosting.

**Remediation:**

- Add **rate limiting** (`@fastify/rate-limit` or edge/WAF limits) keyed by IP or, better, by authenticated subject.
- Introduce **pagination** (cursor or offset) and a sane default page size for `GET /todos`.

---

### 3. Missing HTTP security headers (API + static client) (severity: **low–medium**)

**Finding:** No `@fastify/helmet` (or equivalent) on the API; `client/index.html` has no **Content-Security-Policy** meta or injected CSP from hosting.

**Risk:** For this SPA, XSS is already mitigated by React defaults, but CSP and related headers add **defense in depth** (e.g. if a future dependency introduces inline script or if the app is embedded).

**Remediation:**

- API: register `@fastify/helmet` with a policy tuned for JSON-only responses.
- Client: serve the built SPA with CSP (default-src 'self'; script-src strict), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` via CDN/reverse proxy or meta where appropriate.

---

### 4. Client trusts list shape without per-item validation (severity: **low**)

**Finding:** `fetchTodos` checks that `todos` is an array but returns `todos as Todo[]` without `isTodoShape` on each element (unlike `patchTodo` / `createTodo`).

**Risk:** A buggy or compromised API could return unexpected types; unlikely to become stored XSS in current components (strings still go through React text nodes), but it weakens integrity and could confuse accessibility or future render paths.

**Remediation:** Map the array through `isTodoShape` and reject or filter invalid entries before updating UI state.

---

### 5. 4xx responses echo `err.message` (severity: **low**, process risk)

**Finding:** For non-validation, non-5xx errors, `error-envelope.js` sends `err.message` to the client when present.

**Risk:** Today messages look controlled (`TODO_NOT_FOUND`, etc.). A future route that does `throw new Error(someUserDerivedString)` could leak internals or enable **reflected nuisance** content (still generally safe in React text nodes, but poor practice).

**Remediation:** Prefer a fixed catalog of messages by `err.code`, or map server-side exceptions to stable, non-sensitive strings before send.

---

### 6. `mapApiError` surfaces some server `message` values (severity: **low**)

**Finding:** After allowlisted codes, client may show `serverMessage` if length ≤ 200 and it does not match “internal” heuristics.

**Risk:** Low for XSS in React text; slightly higher for **social engineering** copy if an attacker could influence API error text via another bug.

**Remediation:** Tighten client copy to allowlisted codes + generic fallbacks, or sanitize length and character class more aggressively.

---

### 7. CORS configuration ergonomics (severity: **low**, misconfiguration)

**Finding:** `CORS_ORIGIN` is a single trimmed string passed to `@fastify/cors` `origin`.

**Risk:** Multi-environment setups sometimes need multiple allowed origins; a single string can tempt overly broad values (e.g. regex matching too much) if extended ad hoc.

**Remediation:** Document allowed patterns; if multiple origins are required, use an explicit allow-list function with exact string matches (avoid naive substring checks).

---

### 8. Dependency and supply chain (severity: **operational**)

**Finding:** No `npm audit` / lockfile review was run as part of this pass.

**Remediation:** Run `npm audit` (or `pnpm audit`) in CI for `api` and `client`, and patch high/critical advisories on a defined SLA.

---

## Out of scope / not observed

- No `dangerouslySetInnerHTML`, `eval`, or `new Function` in application source reviewed.
- No raw SQL concatenation with request data in the todos path.
- Cookie-based sessions were not in use for the API client calls reviewed, so classic **CSRF** against cookie auth was not applicable to the current `fetch` configuration.

---

## Suggested priority order

1. AuthN/AuthZ + row-level scope if the API will ever be on a shared network.  
2. Rate limits + list pagination.  
3. Helmet + CSP for hosting.  
4. Harden error/message surfaces (server + `mapApiError`).  
5. Strict `fetchTodos` item validation.

---

*Prepared as a static architecture/security review; validate remediations with tests and, where appropriate, external assessment.*
