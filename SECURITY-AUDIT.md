# Security Audit Report

**Project:** MijnLVS - Moskee Leerling Volgsysteem (Student Tracking System)
**Type:** React SPA (Create React App) with Supabase backend
**Date:** 2026-03-18
**Auditor:** Automated Security Review

---

## Executive Summary

This audit reviewed the MijnLVS frontend codebase -- a multi-tenant React SPA serving mosque educational institutions. The application handles sensitive personal data including student records, parent/guardian information, financial data (payments/contributions), and authentication credentials.

**Overall Risk Rating: MEDIUM-HIGH**

The application demonstrates some security awareness (error sanitization, session timeouts, security headers, environment validation) but has several significant issues that should be addressed, particularly around cryptographic weakness in password generation, excessive logging in production builds, localStorage token storage, and a CSP that allows `unsafe-eval`.

### Summary of Findings

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 6     |
| MEDIUM   | 10    |
| LOW      | 6     |
| **Total**| **24**|

---

## CRITICAL Findings

### C-1: `Math.random()` Used for Temporary Password Generation

- **Severity:** CRITICAL
- **File:** `src/utils/authHelpers.js`, lines 70-82
- **Description:** The `generateTempPassword()` function uses `Math.random()` to generate temporary passwords that are sent to teachers and parents. `Math.random()` is not cryptographically secure -- its output can be predicted, especially in V8-based engines where the internal state of the xorshift128+ PRNG can be reconstructed from observed outputs. Since these passwords grant access to accounts that can view children's personal data, this is a critical vulnerability.
- **Affected Code:**
  ```js
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  // ... repeated for all character types
  return password.split('').sort(() => Math.random() - 0.5).join('');
  ```
- **Recommended Fix:** Replace `Math.random()` with `crypto.getRandomValues()`:
  ```js
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const index = array[0] % chars.length;
  ```
  Also replace the Fisher-Yates shuffle comparator -- `Math.random() - 0.5` produces a biased shuffle. Use a proper Fisher-Yates implementation with `crypto.getRandomValues()`.

### C-2: CSP Allows `unsafe-eval` in Script Sources

- **Severity:** CRITICAL
- **File:** `vercel.json`, line 39
- **Description:** The Content-Security-Policy header includes `'unsafe-eval'` in the `script-src` directive. This effectively neutralizes CSP protection against many XSS attack vectors, as an attacker who achieves script injection can use `eval()`, `new Function()`, `setTimeout('string')`, etc. to execute arbitrary code. While this may have been added for Tailwind CSS CDN compatibility, it is a significant weakening of the security boundary.
- **Current Value:**
  ```
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com https://cdn.tailwindcss.com
  ```
- **Recommended Fix:** Remove `'unsafe-eval'` from the CSP. If the Tailwind CDN truly requires it, migrate to a build-time Tailwind CSS integration (PostCSS/Tailwind CLI) instead of the CDN `<script>` tag. The CDN approach is also a performance concern for production. Also remove `'unsafe-inline'` from `script-src` and use nonce-based or hash-based CSP instead.

---

## HIGH Findings

### H-1: Tailwind CSS Loaded via CDN `<script>` Tag in Production

- **Severity:** HIGH
- **File:** `public/index.html`, line 13
- **Description:** The application loads Tailwind CSS via `<script src="https://cdn.tailwindcss.com"></script>`. This is explicitly intended for development only (per Tailwind's own documentation). In production it:
  1. Creates a dependency on a third-party CDN (supply chain risk).
  2. Requires `'unsafe-eval'` in CSP (see C-2).
  3. Generates styles at runtime, degrading performance.
  4. If the CDN is compromised, arbitrary JavaScript executes in the application context.
- **Recommended Fix:** Install Tailwind CSS as a build dependency (`npm install -D tailwindcss`) and configure it with PostCSS (already partially present in devDependencies: `autoprefixer`, `postcss`). Remove the CDN script tag.

### H-2: Auth Tokens Stored in localStorage (XSS-Accessible)

- **Severity:** HIGH
- **Files:** `src/services/api.js` lines 41-53, `src/contexts/AuthContext.js` lines 58, 118, `src/supabaseClient.js` line 31 (`persistSession: true`)
- **Description:** Supabase session tokens (including access tokens and refresh tokens) are persisted in localStorage via Supabase's default `persistSession: true` configuration. The application also stores the full user object in localStorage (`currentUser_{subdomain}`). localStorage is accessible to any JavaScript running on the same origin, making tokens vulnerable to exfiltration via XSS. Given the `'unsafe-eval'` CSP issue (C-2), the attack surface is enlarged.
- **Recommended Fix:**
  1. At minimum, remove the redundant `currentUser_{subdomain}` storage -- it duplicates what Supabase already stores and increases the attack surface.
  2. Consider configuring Supabase to use a custom storage adapter with shorter-lived tokens.
  3. Prioritize fixing CSP (C-2) to reduce XSS risk.

### H-3: Hardcoded Production API URL as Fallback

- **Severity:** HIGH
- **Files:** `src/services/api.js` lines 8, 11; `src/utils/envValidation.js` lines 23, 116
- **Description:** The production backend URL (`https://moskee-backend-api-production.up.railway.app`) is hardcoded as a fallback in multiple locations. If environment validation fails, the app silently falls back to this URL. This means:
  1. The production URL is embedded in every client build (discoverable via source maps or bundle inspection).
  2. If env vars are misconfigured, the app may silently connect to an unintended backend.
  3. An attacker knowing the Railway URL could target the backend directly.
- **Recommended Fix:** Fail explicitly if `REACT_APP_API_BASE_URL` is not set in production builds instead of silently falling back. The `getSecureConfig()` fallback on line 112-118 returns a working API URL even when validation throws -- this defeats the purpose of validation.

### H-4: Excessive Console Logging in Production Builds

- **Severity:** HIGH
- **Files:** Multiple (255 occurrences of `console.log/warn/error` across 36 files)
- **Description:** The codebase contains 255 console logging calls across 36 source files. Many of these are not guarded by `NODE_ENV` checks and will execute in production. Logged data includes:
  - API request URLs and methods (`src/services/api.js` line 63)
  - Authentication state information (`src/contexts/AuthContext.js`, 25+ occurrences)
  - User names and IDs (`src/contexts/DataContext.js`, 81+ occurrences)
  - Email payload contents (`src/utils/authHelpers.js` line 138)
  - M365 configuration details (`src/features/admin/settings/SettingsTab.js`)
  This data is visible in the browser's developer console and may aid attackers in understanding system internals.
- **Recommended Fix:**
  1. Wrap all console statements (except error handling) in `process.env.NODE_ENV === 'development'` guards.
  2. Or use a logging utility that is automatically stripped in production builds (e.g., babel-plugin-transform-remove-console).
  3. Remove the explicit logging of email payloads at `authHelpers.js:138`.

### H-5: Client Secret Sent from Frontend in M365 Test Email Flow

- **Severity:** HIGH
- **File:** `src/features/admin/settings/M365ConfigModal.js`, lines 80-105
- **Description:** When testing the M365 email configuration, the client secret value entered in the form is sent directly from the frontend to the backend API endpoint `/api/email/test-m365`. While the production save flow correctly avoids sending the secret (letting the backend retrieve it from the database), the test flow transmits it over the network from the browser. This means the secret is visible in browser DevTools Network tab and could be intercepted.
- **Recommended Fix:** Modify the test email flow to work like the save flow -- save the configuration first, then trigger a test that uses the stored secret on the backend. Never transmit the client secret from the frontend.

### H-6: `.env` Not Listed in `.gitignore`

- **Severity:** HIGH
- **File:** `.gitignore`
- **Description:** The `.gitignore` file excludes `.env.local`, `.env.development.local`, `.env.test.local`, and `.env.production.local`, but does NOT exclude the base `.env` file. If a developer creates a `.env` file (which is the standard CRA convention for environment variables), it would be committed to version control, potentially exposing `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, and `REACT_APP_API_BASE_URL`. While no `.env` file currently exists in the repository, the omission is a ticking time bomb.
- **Recommended Fix:** Add `.env` to `.gitignore`:
  ```
  .env
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local
  ```

---

## MEDIUM Findings

### M-1: No `.env.example` File

- **Severity:** MEDIUM
- **File:** Project root (missing file)
- **Description:** There is no `.env.example` file documenting required environment variables. Developers must read source code to discover which variables are needed. This increases the risk of misconfiguration and makes it harder to set up secure deployments.
- **Recommended Fix:** Create a `.env.example` file:
  ```
  REACT_APP_SUPABASE_URL=https://your-project.supabase.co
  REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
  REACT_APP_API_BASE_URL=https://your-backend-url.railway.app
  ```

### M-2: Demo Credentials Displayed in Development Mode

- **Severity:** MEDIUM
- **File:** `src/pages/LoginPage.js`, lines 347-356
- **Description:** The login page displays demo account credentials (admin/teacher/parent emails and passwords) when `NODE_ENV === 'development'`. While this is guarded by the environment check, if a development build is accidentally deployed to a public URL, credentials would be visible. The passwords shown (`admin`, `leraar`, `ouder`) suggest weak demo passwords exist in the system.
- **Recommended Fix:**
  1. Additionally guard this block behind a `localhost` hostname check.
  2. Ensure demo accounts do not exist in production databases.

### M-3: No Rate Limiting on Login Form

- **Severity:** MEDIUM
- **File:** `src/pages/LoginPage.js`, `src/contexts/AuthContext.js`
- **Description:** The login form has no client-side rate limiting or lockout mechanism. While server-side rate limiting may exist (in the backend), the frontend does not implement any throttling after failed attempts. An attacker can submit unlimited login attempts from the browser.
- **Recommended Fix:** Implement client-side rate limiting:
  1. Track failed login attempts.
  2. After N failures (e.g., 5), impose an exponential backoff delay.
  3. Show a CAPTCHA after repeated failures.
  Note: This must be paired with server-side rate limiting for effective protection.

### M-4: Password Reset Does Not Enforce Strong Password Policy

- **Severity:** MEDIUM
- **File:** `src/pages/ResetPasswordPage.js`, lines 145-155
- **Description:** The password reset page only enforces a minimum length of 8 characters. The application has a comprehensive `validatePasswordStrength()` function in `src/utils/authHelpers.js` that checks for uppercase, lowercase, digits, special characters, and common weak patterns -- but this function is NOT used on the password reset page. Similarly, the registration page (`RegistrationPage.js` line 443) only checks for 8-character minimum.
- **Recommended Fix:** Import and use `validatePasswordStrength()` from `authHelpers.js` in both `ResetPasswordPage.js` and `RegistrationPage.js`.

### M-5: Service Worker Caches API Responses Including Authenticated Data

- **Severity:** MEDIUM
- **File:** `public/sw.js`, lines 93-141
- **Description:** The service worker caches responses from Supabase REST API endpoints (`/rest/v1/`) using a network-first strategy. Cached API responses may contain sensitive data (student records, parent PII, payment information). This data persists in the Cache Storage even after the user logs out, as the logout flow (`AuthContext.js` lines 136-154) clears localStorage but does not clear service worker caches.
- **Recommended Fix:**
  1. Clear all caches on logout: `caches.keys().then(names => names.forEach(name => caches.delete(name)))`.
  2. Do not cache authenticated API responses, or cache them with a short TTL.
  3. Add `Cache-Control: no-store` to authenticated API responses on the backend.

### M-6: RBAC Enforced Only at Route Level, Not at Data Level

- **Severity:** MEDIUM
- **Files:** `src/App.js` lines 36-60, `src/contexts/DataContext.js`
- **Description:** Role-based access control is enforced via the `ProtectedRoute` component which checks `currentUser.role` and redirects unauthorized users. However:
  1. The role comes from `currentUser` stored in React state (originally from localStorage/Supabase).
  2. The DataContext fetches data based on the role but does not enforce authorization on the API calls themselves -- it trusts the frontend role assignment.
  3. A user could modify localStorage or intercept/replay API calls to access data for other roles.
  Authorization must ultimately be enforced on the backend (Supabase RLS policies + backend middleware).
- **Recommended Fix:** Verify that the backend enforces RBAC via Supabase Row-Level Security (RLS) policies and API middleware. The frontend role checks are UX convenience only and should not be the security boundary.

### M-7: User Object Stored Redundantly in localStorage

- **Severity:** MEDIUM
- **File:** `src/contexts/AuthContext.js`, lines 58, 118
- **Description:** The full user object (including role, email, name, and ID) is stored in localStorage under `currentUser_{subdomain}`. This data could be tampered with to manipulate the client-side role check. While the app re-fetches the user on session restore (line 53-54), the localStorage copy creates a window for manipulation.
- **Recommended Fix:** Remove the `currentUser_` localStorage entries. Rely solely on the Supabase session and re-fetch the user profile from the database on each session restore (which is already implemented).

### M-8: `innerHTML` Used in Service Worker Registration and PWA Prompt

- **Severity:** MEDIUM
- **Files:** `src/serviceWorkerRegistration.js` line 119, `src/components/PWAInstallPrompt.js` line 136
- **Description:** Both files use `innerHTML` to inject HTML content into the DOM. While the injected content is static (no user-controlled data flows into the template), this pattern is fragile -- future modifications could inadvertently introduce XSS if dynamic data is interpolated.
- **Recommended Fix:** Replace `innerHTML` usage with DOM API methods (`createElement`, `textContent`, `appendChild`) or React portals.

### M-9: Open Redirect Potential in Subdomain Switching

- **Severity:** MEDIUM
- **File:** `src/contexts/AuthContext.js`, lines 156-181
- **Description:** The `switchSubdomain` function constructs a new URL using user-influenced input (the subdomain parameter) and navigates to it via `window.location.href`. While there is some hostname parsing logic, a carefully crafted subdomain value could potentially redirect to a malicious domain if the hostname parsing logic produces an unexpected result.
- **Recommended Fix:** Validate that the constructed `newHost` ends with `.mijnlvs.nl` before navigating. Add an allowlist of valid TLDs.

### M-10: `react-scripts` 5.0.1 Has Known Vulnerabilities

- **Severity:** MEDIUM
- **File:** `package.json`, line 17
- **Description:** The project uses `react-scripts` version `5.0.1` which bundles `webpack-dev-server`, `postcss`, and many other dependencies that have had security advisories since this version was released. CRA (Create React App) is no longer actively maintained by the React team and is considered deprecated in favor of modern frameworks. Running `npm audit` on a CRA 5.0.1 project typically reveals 50+ vulnerabilities in the dependency tree.
- **Recommended Fix:**
  1. Short-term: Run `npm audit fix` to patch what can be patched.
  2. Medium-term: Consider migrating to Vite or another actively maintained build tool.
  3. Long-term: The React team recommends migrating away from CRA entirely.

---

## LOW Findings

### L-1: No CSRF Protection on Form Submissions

- **Severity:** LOW
- **File:** Multiple form components
- **Description:** Form submissions (login, registration, password reset, settings updates) do not include CSRF tokens. Since the app uses Bearer token authentication (not cookies), traditional CSRF is not directly exploitable. However, the Supabase session cookies set by `persistSession: true` could theoretically be leveraged.
- **Recommended Fix:** Supabase's token-based auth model largely mitigates CSRF. Ensure that no cookie-based authentication is introduced without adding CSRF protection.

### L-2: Two Conflicting Manifest Files

- **Severity:** LOW
- **Files:** `public/manifest.json`, `public/site.webmanifest`
- **Description:** The project has two manifest files with different content. `index.html` references both (lines 10 and 30). `site.webmanifest` uses generic placeholder values (`"name": "MyWebSite"`, `"short_name": "MySite"`) suggesting it was not customized. Having conflicting manifests can cause unpredictable PWA behavior and the placeholder content exposes that the site was built from a template.
- **Recommended Fix:** Remove `site.webmanifest` and keep only `manifest.json` (which has correct MijnLVS branding). Update `index.html` to reference only `manifest.json`.

### L-3: `performanceMonitor` Exposed on Global `window` Object

- **Severity:** LOW
- **File:** `src/utils/performanceMonitor.js`, line 205
- **Description:** The performance monitor instance is attached to `window.performanceMonitor`, making it accessible from the browser console. It also overrides `window.fetch` in development mode (line 148) to intercept all network requests. While gated by development mode for the fetch override, the `window.performanceMonitor` assignment is unconditional.
- **Recommended Fix:** Guard the global assignment: `if (process.env.NODE_ENV === 'development') { window.performanceMonitor = performanceMonitor; }`

### L-4: Email Validation Uses Weak Regex

- **Severity:** LOW
- **Files:** `src/features/admin/teachers/AddTeacherModal.js` line 31, `src/features/admin/settings/M365ConfigModal.js` line 52, `src/features/admin/parents/AddParentModal.js` line 106
- **Description:** Email validation uses the pattern `/\S+@\S+\.\S+/` which accepts many invalid email addresses (e.g., `a@b.c`, `@@..`, strings with spaces before/after). While server-side validation should be the true gatekeeper, weak client-side validation can lead to confusion and data quality issues.
- **Recommended Fix:** Use a more robust email regex or leverage the HTML5 `type="email"` input validation (which is already in use but supplemented by the weak regex). Consider using a validation library.

### L-5: Missing `Subresource Integrity` (SRI) on CDN Script

- **Severity:** LOW
- **File:** `public/index.html`, line 13
- **Description:** The Tailwind CDN script tag lacks an `integrity` attribute. If the CDN is compromised or serves modified content, the browser has no way to detect the tampering.
- **Recommended Fix:** If the CDN approach is kept (not recommended -- see H-1), add SRI: `<script src="https://cdn.tailwindcss.com" integrity="sha384-..." crossorigin="anonymous"></script>`. Note: SRI is difficult with the Tailwind CDN since it serves dynamic content. This reinforces the recommendation to move to build-time Tailwind.

### L-6: Session Timeout Duration May Be Too Long

- **Severity:** LOW
- **File:** `src/hooks/useSessionTimeout.js`, line 4
- **Description:** The session timeout is set to 2 hours of inactivity. For an application handling children's personal data and financial information, this may be too permissive. If a user walks away from a shared computer, the session remains active for 2 hours.
- **Recommended Fix:** Consider reducing the timeout to 30-60 minutes for standard users, or making it configurable per role (shorter for admins who have more access).

---

## Positive Security Findings

The following security practices are already implemented and should be maintained:

1. **Error Sanitization** (`src/utils/errorHandling.js`): Production errors are sanitized to remove sensitive patterns (emails, tokens, UUIDs, API keys) before being displayed to users.
2. **Environment Variable Validation** (`src/utils/envValidation.js`): Validates required environment variables on startup with proper URL format checks.
3. **Security Headers** (`vercel.json`): Includes `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy`.
4. **Session Timeout with Warning** (`src/hooks/useSessionTimeout.js`): Implements idle-based session timeout with user warning before logout.
5. **Password Strength Validation** (`src/utils/authHelpers.js`): Comprehensive password policy checking (though not universally applied -- see M-4).
6. **Protected Routes** (`src/App.js`): Role-based route protection with proper redirect flow.
7. **Error Boundary** (`src/components/ErrorBoundary.js`): Catches React errors gracefully; development details are hidden in production.
8. **Global Error Handling** (`src/utils/errorHandling.js`): Catches unhandled promise rejections and JavaScript errors.
9. **HTTPS Enforcement**: CSP includes HSTS with 1-year max-age and includeSubDomains.
10. **M365 Secret Handling**: The welcome email flow correctly avoids sending the M365 client secret from the frontend (see `src/utils/authHelpers.js` line 126 comment).

---

## Remediation Priority

### Immediate (before next deployment)
1. **C-1**: Replace `Math.random()` with `crypto.getRandomValues()` in password generation
2. **H-6**: Add `.env` to `.gitignore`
3. **H-4**: Remove or guard the most sensitive console.log statements (especially `authHelpers.js:138` which logs email payloads)

### Short-term (within 1-2 weeks)
4. **C-2 + H-1**: Remove Tailwind CDN, integrate Tailwind via PostCSS build, remove `unsafe-eval` and `unsafe-inline` from CSP
5. **H-5**: Refactor M365 test email flow to avoid sending client secret from frontend
6. **M-4**: Apply `validatePasswordStrength()` to password reset and registration pages
7. **M-5**: Clear service worker caches on logout
8. **M-7**: Remove redundant `currentUser_` localStorage entries

### Medium-term (within 1-2 months)
9. **H-3**: Fail explicitly on missing API URL in production instead of silent fallback
10. **M-3**: Implement client-side login rate limiting
11. **M-10**: Run `npm audit fix` and plan CRA migration
12. **M-9**: Validate subdomain redirects against allowlist
13. **L-2**: Clean up duplicate manifest files

### Ongoing
14. **H-2**: Monitor Supabase auth storage security best practices
15. **M-6**: Verify backend RBAC enforcement (requires backend audit)
16. **H-4**: Implement production logging strategy (structured logging to external service, strip console statements from builds)

---

## Scope Limitations

This audit covered the **frontend codebase only**. The following were NOT audited:
- Backend API (`moskee-backend-api-production.up.railway.app`)
- Supabase configuration (RLS policies, auth settings, database security)
- Infrastructure security (Railway, Vercel, DNS configuration)
- Third-party dependency source code (only package versions were reviewed)
- Penetration testing / dynamic analysis

A complete security assessment should include a backend audit, Supabase RLS policy review, and dynamic penetration testing.
