# ELITE — Egyptian Legal Assistant · Master Implementation Spec

> This document is the refined, presentation-ready specification derived from the product
> owner's requirements. It is grounded in the **actual** codebase as it exists today and is
> written so any engineer (or AI agent) can execute it end-to-end. Hand this to the builder
> as the single source of truth.

---

## 0. Product summary

**ELITE** is an AI legal assistant specialized **exclusively in Egyptian law**. A user signs
up, opens a chat, and asks a legal question in Arabic; the assistant replies as a senior
Egyptian legal consultant, citing the relevant statute articles, with a confidence indicator.
The product also offers legal document generation, templates, and a knowledge base.

**This release must be a polished, fully functional product fit for a live demo**, where the
model will be tested against a variety of Egyptian-law scenarios.

### Current architecture (verified in repo — do not re-discover)

| Layer | Reality on disk | Notes |
|---|---|---|
| Active frontend | `client/` (React 19, react-scripts, Tailwind v4) | This is what Vercel builds — see `vercel.json` |
| Legacy frontend | `src/` (root) | **Dead code.** Do not edit. Consider deleting in cleanup. |
| Backend | `api/` (Express on `@vercel/node`) | Single function entry: `api/server.js` |
| Data store | `api/store.js` → SQLite (`better-sqlite3`) at `api/storage/elite.db` | **DONE.** Real SQL DB, zero external setup; auto-creates + auto-migrates the old `users.json`. |
| Unused | `api/models/User.js` (Mongoose) | **Not wired to live auth.** Either adopt or remove — see §6. |
| AI provider | Groq `llama-3.3-70b-versatile` via `api/service/service.js` | `CHAT_PROVIDER=groq`, `GROQ_API_KEY` required |
| Retrieval | `api/service/retrieval.js` | Keyword scoring over `api/data/laws/*.json` + `api/data/laws.json` |
| System prompt | `api/prompts/elite-system.txt` + `language-enforcement.txt` | Arabic-only enforcement |

> ⚠️ **Persistence caveat (must be acknowledged in the demo plan):** the file-based store in
> `api/store.js` does **not** survive Vercel serverless cold starts reliably (the function
> filesystem is ephemeral). Today this is mitigated only by `SEED_EMAIL`/`SEED_PASSWORD_HASH`.
> See §6 for the required decision before calling this "production."

---

## 1. AI behavior — greetings & small talk (Requirement #1)

**Goal:** Basic greetings and welcome/small-talk messages must be answered **warmly and
professionally, with NO confidence badge and NO citations**. Legal answers keep both.

### Functional requirements
- A greeting/small-talk turn returns `confidence: ""` and `citations: []` (already the shape
  in `service.js:160`). The frontend must render **nothing** for empty confidence/citations
  (verify `client/src/pages/Chat.jsx` does not show a badge when `confidence === ""`).
- Detection must be **robust**, not brittle. The current `isGreeting()` (`service.js:15`) only
  matches a hardcoded set + a few regexes. Replace/extend it to reliably catch:
  - Greetings: `مرحبا / أهلاً / السلام عليكم / صباح-مساء الخير / هاي / hi / hello`.
  - Identity/meta: "من أنت؟", "ماذا تستطيع أن تفعل؟", "كيف تعمل؟", "شكراً", "مع السلامة".
  - Thanks / closings / acknowledgements ("تمام", "شكرًا جزيلاً").
- Greeting/meta replies should be **varied** (already via `SIMPLE_REPLIES`) and **professional
  in tone** — introduce ELITE, invite a legal question, no legal disclaimers, no boilerplate.
- A message that contains a greeting **plus** a real legal question must be treated as a
  **legal** turn (do not short-circuit to the greeting reply).

### Acceptance
- "السلام عليكم" → friendly intro, no badge, no citations.
- "من أنت وما الذي تفعله؟" → professional capability overview, no badge.
- "أهلاً، عايز أعرف حقوقي في الإيجار" → full legal answer **with** citations + confidence.

---

## 2. AI behavior — professional, accurate legal answers (Requirements #2 & #5)

**Goal:** Answers read like a senior Egyptian legal consultant: authoritative, structured,
accurate, Arabic-only — and robust across many scenarios for the live test.

### Improve the system prompt (`api/prompts/elite-system.txt`)
Keep the existing 8-section structure but tighten it for quality and demo-safety:

1. **Persona:** senior Egyptian legal consultant at "ELITE"; formal Modern Standard Arabic;
   confident but never reckless.
2. **Grounding & honesty (critical for a live test):**
   - Cite **only** articles present in the retrieved knowledge base; never invent article
     numbers, case law, or fees. (Already stated — reinforce and make it the top rule.)
   - When the KB has no relevant article, answer from **general legal principles** and set
     `confidence: "medium"`, explicitly stating no specific article was found.
   - Never guarantee litigation outcomes; always note that specifics depend on case facts.
3. **Answer shape, adaptive — not one rigid template for everything:**
   - Simple factual question → concise, direct, still professional (don't force all 8 headings).
   - Complex scenario → full structured analysis (issue → executive summary → legal analysis →
     practical steps → required documents → timeframe/costs → recommendations → references).
   - The current prompt forces the full 8-section format on *every* reply, which feels robotic
     on simple questions. Make depth **proportional to the question**.
4. **Scope guard:** out-of-scope (medical/engineering/programming/non-Egyptian-law) → the exact
   canned Arabic refusal already defined, with `is_out_of_scope=true`, `confidence="low"`.
5. **Language:** Arabic-only enforcement stays (`language-enforcement.txt`) — keep the foreign
   -script retry in `service.js:176`.

### Output contract (keep)
The JSON contract in `service.js` (`answer`, `confidence`, `confidence_reason`,
`is_out_of_scope`, `used_article_ids`) is good. Keep it. Ensure the frontend renders
`confidence_reason` on hover/tooltip of the badge.

### Retrieval quality (supports accurate citations)
Current retrieval (`retrieval.js`) is keyword-overlap with Arabic stop-words and `topK=3`.
For the demo:
- Verify every law category in `api/data/laws/` has good `keywords` arrays (retrieval leans
  heavily on them — `scoreArticle` weights keywords ×5).
- Consider raising `topK` to 4–5 for complex questions and de-duplicating near-identical
  articles.
- (Stretch) Normalize Arabic (strip diacritics, unify أ/إ/آ→ا, ة→ه, ى→ي) in `tokenize()` so
  user spelling variants still match.

### Test scenarios to pass (the demo matrix)
Prepare and verify answers for at least one question in **each** loaded law area:
civil code, penal code, criminal procedure, labor law, companies law, consumer protection,
personal status, real estate, tax law. Plus: a greeting, a meta question, an out-of-scope
question, and an ambiguous question (should ask for clarification or answer at medium
confidence). Document expected behavior for each before the demo.

---

## 3. Better signup (Requirement #3)

**Decision (confirmed by product owner):** collect **First name, Last name, Phone number,
Account type, and Governorate** in addition to email + password.

### Data model — `api/store.js`
Extend `createUser` and the persisted user record with:
| Field | Type | Required | Validation |
|---|---|---|---|
| `firstName` | string | ✅ | non-empty, trimmed |
| `lastName` | string | ✅ | non-empty, trimmed |
| `phone` | string | ✅ | Egyptian mobile: `^(\+20|0)?1[0125]\d{8}$` |
| `accountType` | enum | ✅ | `individual` \| `lawyer` |
| `governorate` | enum | ✅ | one of the 27 Egyptian governorates |
| `email` | string | ✅ | valid email, unique, lowercased (exists) |
| `passwordHash` | string | ✅ | bcrypt, min 8 chars (exists) |

- Update `saveToDisk()` / `loadFromDisk()` to persist the new fields.
- Keep backward compatibility: existing `users.json` records without these fields must still
  load (default to empty/`individual`).

### API — `api/routes/auth.js`
- `POST /api/auth/signup`: accept and **validate** all new fields server-side (never trust the
  client). Return clear, Arabic, field-specific errors (e.g. "رقم الهاتف غير صحيح").
- Include safe user fields in the token response and in `GET /api/user/me`
  (`api/routes/user.js:14`) so the UI can greet the user by name. **Never** return
  `passwordHash`.
- Consider a single source-of-truth list of governorates in `api/data/governorates.json`
  (Arabic + value) shared by validation and the frontend.

### Frontend — `client/src/pages/Signup.jsx`
- Add the new fields with a clean, professional, RTL layout consistent with the existing
  `auth.css` brand panel.
- Client-side validation mirroring the server (inline errors, disabled submit until valid).
- Account type as a segmented control / radio (فرد / محامٍ). Governorate as a searchable
  select populated from `governorates.json`.
- Phone field with Egyptian format hint.
- After signup, store the richer `user` object via `AuthContext.setSession`
  (`client/src/auth/AuthContext.jsx`) and personalize the app (e.g. "مرحباً، {firstName}").

### Acceptance
- Submitting with an invalid Egyptian phone → inline Arabic error, no account created.
- A created account persists name/phone/type/governorate and they appear on the Account page
  (`client/src/pages/Account.jsx`).
- `GET /api/user/me` returns the new fields (minus password).

---

## 4. Professional, "real product" polish (Requirement #4)

Treat this as a checklist to make the app feel like a shipped product during the presentation.

### UX / UI
- Personalize: greet the signed-in user by first name in the navbar/Chat header.
- **Chat experience:** streaming or a clear typing indicator; graceful empty state with sample
  Egyptian-law prompts the demo audience can try; copy-to-clipboard and "save to favorites"
  on each answer (favorites API already exists in `store.js`/`user.js`).
- **Citations UI:** render each cited article as an expandable card (law name, number, year,
  article number, text) — data is already returned in `citations`.
- **Confidence badge:** colored chip (high/medium/low) with `confidence_reason` tooltip; hidden
  entirely for greetings.
- **Error states:** the Arabic error messages already in `service.js` (rate limit, server
  error) must surface as friendly toasts (`client/src/component/Toast`), not raw text.
- **Loading & disabled states** on every async button (signup, send, generate doc).
- **Mobile/RTL:** verify the recent mobile refactor (see git log) holds for the new signup
  fields and citation cards.

### Reliability
- Confirm `GROQ_API_KEY`, `GROQ_MODEL`, `CHAT_PROVIDER`, `JWT_SECRET` are set in Vercel env
  (do **not** rely on `dev_secret` fallback in `auth.js:8` for the demo).
- Rate-limit handling (429) already returns a friendly Arabic message — verify the UI shows it
  and offers retry.
- Guard against empty/whitespace messages on both client and `controller.js`.

### Housekeeping (recommended)
- Remove dead legacy `src/` tree (root) to avoid confusion — only `client/` ships.
- Remove stray log files in repo (`api/api.log`, `api/api.err`, `client/react.log`, etc.) and
  ensure they're gitignored.
- Remove unused Mongoose `User.js` **or** adopt it (see §6) — don't leave both.

---

## 5. Acceptance criteria (definition of done for the demo)

- [ ] Greetings & meta questions: friendly professional reply, **no** badge, **no** citations.
- [ ] Legal questions: structured professional Arabic answer, accurate citations from KB,
      confidence badge with reason. Depth scales with question complexity.
- [ ] No invented articles/case law in any tested scenario.
- [ ] Out-of-scope questions: canned Arabic refusal, low confidence.
- [ ] Arabic-only output guaranteed (foreign-script retry verified).
- [ ] Signup collects + validates first name, last name, phone (EG format), account type,
      governorate; data persists and shows on Account page.
- [ ] `GET /api/user/me` returns new fields without password; UI greets user by name.
- [ ] All async actions have loading/disabled/error states; errors shown as toasts.
- [ ] Demo matrix (§2) rehearsed: one question per law area + greeting + meta + out-of-scope +
      ambiguous, with documented expected behavior.
- [ ] Env vars set in Vercel; no `dev_secret`/missing-key fallbacks in the demo path.

---

## 6. Open decisions to confirm BEFORE building

These genuinely change the implementation and should be answered by the product owner:

1. **Persistence — RESOLVED (file store + seed account).** SQLite (`better-sqlite3`) was tried but
   its native module is unreliable on Vercel serverless (caused 500s), so `api/store.js` was
   reverted to the **file-based JSON store** (in-memory Maps + `users.json`), which has no native
   deps and is safe on Vercel. Login in production is guaranteed by the **env-seeded account**
   (`SEED_EMAIL` + `SEED_PASSWORD_HASH`) which is re-created on every cold start.
   - ⚠️ **Known limitation:** on Vercel the filesystem is ephemeral, so user *sign-ups* don't
     persist across cold starts — only the seeded account is durable. For real multi-user
     persistence, move `store.js` to a networked DB (MongoDB Atlas — cluster already referenced in
     `.env.example`; or Neon Postgres). The `store.js` function signatures are the only seam.
   - **Required Vercel env vars:** `JWT_SECRET`, `SEED_EMAIL`, `SEED_PASSWORD_HASH`,
     `CHAT_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL`.
2. **Login fields.** Email + password only (keep), confirmed?
3. **`accountType = lawyer`** — does it unlock anything different (e.g. advanced templates), or
   is it just profile metadata for now?
4. **Languages.** Output is Arabic-only by design. Confirm the UI chrome stays Arabic/RTL only
   (no English toggle) for the demo.
5. **Legacy `src/` + Mongoose model** — OK to delete as cleanup?

---

## 7. Suggested execution order (when greenlit)

1. System prompt + greeting/scope hardening (§1, §2) — highest demo impact, lowest risk.
2. Signup data model + API + validation (§3 backend).
3. Signup UI + Account page display (§3 frontend).
4. Chat UX polish: citations cards, confidence badge, toasts, sample prompts (§4).
5. Reliability + env + housekeeping (§4, §6).
6. Rehearse the demo matrix (§2) and fix any inaccurate/invented citations.

---

*Grounded against the repository state on the `main` branch. File paths and line references are
accurate as of writing; re-verify line numbers before editing since earlier steps may shift
them.*
