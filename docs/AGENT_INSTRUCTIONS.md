1 — Quick codebase summary

```
Purpose: Browser-based interior design moodboard: upload room photos, add furniture items (search/upload), drag/resize/rotate items, save rooms to Supabase, manage shopping lists.
Stack: React (JSX), Vite, Supabase (auth, Postgres, Storage), @imgly/background-removal, Pixabay integration, Vitest.
Main folders: src/, src/components, src/lib (supabase, image utilities, persistence), .github/workflows, replit config.
```

2 — Highest-risk security issues (must fix immediately)

```
[DONE] Secrets committed in repo
    Where: .replit contains VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL, PIXABAY key.
    Risk: exposure, abuse, quota theft, unauthorized reads/writes.
    Status: Verified VITE_SUPABASE_ANON_KEY is the new sb_publishable_ key (safe to expose by design) and VITE_SUPABASE_URL is not a secret. VITE_PIXABAY_KEY was a real secret — has been rotated on Pixabay and updated in Vercel env vars + Replit Secrets. Still recommended: remove the hardcoded Pixabay value from .replit now that it lives in Secrets (cleanup, not urgent).

[NOT APPLICABLE] Public storage bucket for uploaded images
    Where: supabase-setup.sql instructs a public "room-images" bucket.
    Risk: user private images publicly available and indexable.
    Status: Checked Supabase Storage — no buckets currently exist in the project. Furniture catalog images are external Pixabay URLs referenced in src/lib/furnitureFixtures.js, not stored in Supabase Storage. If/when user-uploaded room photo storage is implemented, create the bucket as PRIVATE from the start and use signed URLs — do not start public.
    Don't: rely on unpredictable filenames as a protection mechanism.

Client-side upload validation and untrusted inputs
    Where: roomPersistence.js uploads raw data/blob URLs.
    Risk: large/invalid files, malware, DoS, uncontrolled storage.
    Fix: validate MIME by magic bytes, enforce size limits, scan or quarantine suspicious uploads; sanitize filenames; implement server-side checks.
    Don't: trust client validation only.
    Status: Not yet reviewed — pending confirmation of whether room photo upload is implemented at all.

[DONE] Exposed third-party keys in client
    Where: Pixabay key used in client.
    Risk: quota theft and abusive usage.
    Status: Key rotated. Fix (proxy calls through a backend/serverless function) still recommended as a longer-term hardening step, not urgent given low blast radius of this key.
    Don't: embed long-lived backend or admin keys in client code.

CSP and unpinned remote resources
    Where: index.html CSP allows 'unsafe-inline' for styles and a broad list of connect/img sources.
    Risk: weaker XSS protections and supply-chain risk for WASM/model files.
    Fix: tighten CSP, move inline styles to CSS, use nonce/hash for any required inline content, pin CDN assets and use SRI or host critical assets from a trusted origin.
    Don't: disable CSP for tests or dev and then forget to restore it in production.
    Status: Not yet reviewed.
```

2b — RLS verification (completed, not in original doc)

```
[DONE] Row Level Security audit
    Verified directly in Supabase dashboard:
    - rooms: RLS enabled, own-rows-only policies scoped to authenticated, condition auth.uid() = user_id confirmed correct.
    - shopping_lists: RLS enabled, own-rows-only pattern, consistent with rooms.
    - shopping_list_items: RLS enabled, correctly joins through parent shopping_lists table (EXISTS subquery checking shopping_lists.user_id = auth.uid()) — this was the highest-risk table to get wrong and it's correct.
    - furniture_items: RLS enabled, SELECT-only policies for authenticated + public (correct for a public catalog); no INSERT/UPDATE/DELETE policies exist, meaning writes are default-denied for all client roles — correct for a curated catalog.
    Result: no RLS-related action items remain open.
```

3 — High-risk correctness & maintenance (spaghetti)

```
Syntax/runtime bug: bad id generation
    Where: src/App.jsx — id: local-${nanoid()} (missing quotes/backticks)
    Effect: runtime error when adding items.
    Fix: id: local-${nanoid()}
    Status: NOT YET FIXED — next priority.

Global window listeners without guaranteed cleanup
    Where: FurnitureItem, Moodboard, GridSlider, others.
    Effect: memory leaks, setState on unmounted components, unexpected behavior.
    Fix: centralize add/removal; store handlers in refs; ensure cleanup in useEffect(); prefer pointer events or unified hook.
    Status: NOT YET FIXED.

Duplicated gesture/drag/resize logic
    Problem: same code copy-pasted across multiple components → maintenance pain and more bugs.
    Fix: create a single well-tested hook (usePointer/useDrag) that handles mouse+touch lifecycle + cleanup.
    Status: NOT YET FIXED.

Large inline styles and many anonymous inline handlers
    Problem: readability and unnecessary re-renders.
    Fix: move to CSS or memoize style objects; extract small subcomponents.
    Status: NOT YET FIXED.

Lack of explicit types (preparing for TS migration)
    Problem: migrating to TypeScript will generate many inferred/any types and slow migration.
    Fix: add small domain types early (Item, Room, User), use tsconfig.allowJs = true for incremental migration.
    Status: NOT YET FIXED.
```

4 — What the repo needs to be production-ready (prioritized)

Emergency (0–24 hours)

```
[DONE] Remove secrets from repo and rotate keys. (Pixabay rotated; Supabase keys confirmed safe-by-design, no rotation needed)
[N/A]  Make storage private and switch to signed URLs. (no bucket exists yet)
[ ]    Fix obvious runtime errors (id bug) so app is usable.
[ ]    Add secret scanning pre-commit (detect-secrets or git-secrets) and enable GitHub secret scanning.
```

Short term (1–7 days)

```
[ ] Add tsconfig (allowJs:true) and ESLint changes for TypeScript.
[ ] Add CI steps:
    lint (already added)
    test
    type-check (tsc --noEmit)
    run a secret-scan step
[ ] Fix event-listener leaks in high-traffic components (FurnitureItem, GridSlider).
[ ] Add server-side proxy for third-party API calls or add usage restrictions.
[DONE] Harden Supabase RLS policies and audit all DB queries that rely on user id. — verified across all four tables.
```

Mid term (1–4 weeks)

```
[ ] Incremental TypeScript migration and component-by-component type annotations.
[ ] Extract and test reusable hooks (usePointer/useUpload).
[ ] Add upload validation and scanning, size limits, and thumbnailing.
[ ] Add monitoring/alerts (Sentry properly configured and tested — VITE_SENTRY_DSN already present in Vercel env vars, confirm it's wired up).
[ ] Add production build tests and run: performance, asset integrity checks.
```

Long term (weeks/months)

```
[ ] Tighten CSP and pin/host critical WASM/model assets.
[ ] Ongoing secret rotation policy and automated secret detection on PRs.
[ ] Harden rate-limiting and quotas on backend/proxy.
[ ] Add integration tests that simulate uploads and drag/resize interactions.
```

5 — AI agent policy (how an automation should behave)

This section is addressed to any AI agent that will read this file. Agents MUST follow these rules before performing changes.

Agent startup actions (required)

```
Read this file and .ai-agent/config.json (if present) — do not proceed without it.
Check permissions:
    Confirm repository push access and authorisation scope.
    Confirm whether you have the ability to rotate secrets (you likely do not).
Check for a sentinel STOP file:
    If file .ai-agent/AI_STOP exists, stop and notify the human owner.
Query available credits from your platform API (see below). If the platform has no credits API, first ask the human.
```

Change authorization rules

```
Never modify secrets, .replit, or other env-storing files without explicit human approval.
Critical security fixes (removing secrets, making buckets private, rotating keys) require human action: the agent MUST open an issue/PR and explicitly request secret rotation and platform changes.
Non-destructive code fixes (typo fixes, listener cleanup, adding tsconfig, CI additions) may be proposed in a PR. The agent MAY create a branch and open PR if it has push rights and the PR is limited to non-secret changes and follows the credit policy.
```

Agent credit-aware behavior

```
The agent must estimate cost per task (use this sample costing model and your platform's credits API).
    SMALL (quick code fix / single-file lint/type): cost = 1 unit
    MEDIUM (fix multiple files, add tests, add CI step): cost = 5–10 units
    LARGE (migrate multiple components to TS, add hooks, create infra changes): cost = 25+ units
Agent must obtain current available credits: call platform API getCredits() or read .ai-agent/config.json threshold_max_credits.
The agent must not exceed a single-run budget (commit session budget) defined by:
    session_budget = min(available_credits, config.commit_threshold)
If the estimated cost > session_budget:
    Abort changes and open a draft PR with a description and a checklist of prioritized next-smallest tasks.
    Add a comment explaining the credit shortfall and request human confirmation to proceed.
```

Agent safe-commit checklist (must pass before commit)

```
All tests that are present must pass locally (unit tests) or CI must be configured to run them.
Lint and type-check must pass (or the PR must clearly state why tsc is delayed).
No secrets are added or changed in the commit.
A PR description lists all files changed and risks with rollback instructions.
```

Agent suggested workflow

```
Phase 1 (automated): small fixes only — id bug, add listener cleanup skeleton, add tsconfig + eslint + CI job (no secrets), create PR.
Phase 2 (with human approval): rename a handful of files to .tsx, add types, run tests and iterate.
Phase 3 (human operation): rotate keys, change bucket privacy, configure platform secrets. [PARTIALLY DONE — Pixabay key rotated; bucket privacy N/A, no bucket exists]
```

6 — AI sentinel & config examples (agent should read these)

```
Place this config at .ai-agent/config.json (example). Agents must read it.
```

Example (.ai-agent/config.json)
{ "commit_threshold_units": 20, "per_task_cost": { "small": 1, "medium": 7, "large": 25 }, "require_human_for": [ "secrets", "key_rotation", "storage_privacy_changes", "prod_env_changes" ], "stop_file": ".ai-agent/AI_STOP" }

```
Sentinel file to stop all automation: create .ai-agent/AI_STOP (empty). If present, agents must stop.
```

7 — Example agent check pseudocode

```
Pseudocode the agent should run before modifying repo:
```

available = platform.getCredits() # must exist; else ask human
config = repo.read('.ai-agent/config.json') or defaults
if repo.exists(config.stop_file): exit("STOP file present")
if available < config.commit_threshold_units:
    propose_pr("Insufficient credits; I can do X (small) now. Need Y more credits for full migration.")
else:
    perform_small_fixes() # id bug, listener cleanup, tsconfig, lint updates
    create_branch_and_pr("migration/initial-ts-and-cleanup", changes)
    run_ci_and_report()

8 — Examples of specific fixes & results (copy/paste)

```
Fix id bug — change this (src/App.jsx):
    BEFORE: id: local-${nanoid()}, src, label
    AFTER: id: `local-${nanoid()}`, src, label
    RESULT: items can be added without syntax error.
    Status: NOT YET APPLIED.

Listener cleanup skeleton (FurnitureItem, GridSlider)
    Add: const active = useRef([]); useEffect(() => { return () => { active.current.forEach(({type, handler}) => window.removeEventListener(type, handler)); active.current = []; }; }, []);
    When adding listeners: window.addEventListener('mousemove', move); active.current.push({ type: 'mousemove', handler: move });
    Status: NOT YET APPLIED.

Replace public bucket usage with signed URL (server-side change)
    BEFORE: client uses https://.../public/room-images/...
    AFTER: client requests signed URL from server/Supabase via authenticated call.
    RESULT: images not exposed indefinitely.
    Status: N/A — no bucket exists yet. Apply this pattern if/when room photo upload to Storage is built.
```

9 — What human maintainers must do (non-delegatable)

```
[DONE]     Rotate keys & set secrets in the platform secret store. (Pixabay done; Supabase keys confirmed safe-by-design)
[N/A]      Make Supabase storage private and configure RLS and signed URLs. (no bucket exists)
[DONE]     Confirm RLS is correctly configured. (verified across rooms, shopping_lists, shopping_list_items, furniture_items)
[ ]        Approve PRs that modify production configs.
[ ]        Review final TypeScript changes and run full end-to-end tests before merging.
```

10 — What not to do (summary)

```
Do not commit secrets, even temporarily.
Do not perform a big-bang rewrite without staged PRs and tests.
Do not relax CSP or security in production builds for convenience.
Do not rely solely on client validation for security logic.
```

11 — Next steps & checklist (actionable)

```
[DONE] Remove secrets from repo and rotate keys (HUMAN). — Pixabay rotated; still recommended to strip the now-unused hardcoded Pixabay value out of .replit as cleanup.
[N/A]  Make Supabase bucket private and switch to signed URLs (HUMAN). — no bucket exists.
[ ]    Fix id bug and add listener cleanup for FurnitureItem and GridSlider (AUTOMATED OK, small cost). — up next.
[ ]    Add tsconfig (allowJs), ESLint changes, and CI type-check step (AUTOMATED OK).
[ ]    Create PRs for all non-secret changes; require human approval for production infra changes.
```

12 — Contact & references

```
Supabase docs on signed URLs & storage: https://supabase.com/docs
GitHub secret scanning: https://docs.github.com/en/code-security/secret-scanning
Recommended pre-commit tools: detect-secrets, git-secrets
CSP best practices: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
```
