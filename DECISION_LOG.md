# DECISION LOG — Product Planning Guide

Open this at the start of every new project. Walk through it top to bottom
before writing a line of code. Each section presents the real options, the
honest trade-offs, and a "choose X if..." guide so you can make intentional
decisions — not accidental ones.

**How to use it:**
1. Read the question.
2. Read all the options (don't skip to your default).
3. Use the "choose X if..." to make the call.
4. Fill in the **Our choice** block at the bottom of each section.
5. When you're done, your choices become the DECISION_LOG for this project.

The goal is that future-you (or a future agent) can read this file and
understand not just *what* was decided, but *why* — and when to revisit.

---

## ☑ Phase 0 — Product identity (do this first, before any tech)

Answer these before any tech decision. Tech serves product, not the other
way around. If you skip this section, you will make tech decisions that
don't fit the product you're actually building.

**1. Who specifically is this for?**
Name a real person, not a category. "Quinn, age 4" beats "young children."
"Me, a 33-year-old guy trying to track my investments" beats "retail investors."

**2. What is the single most important thing it does?**
If it did only one thing, what is it? Everything else is secondary.

**3. What does it explicitly NOT do?**
Define the walls. Prevents scope creep. Write at least three.

**4. What does "done enough to launch" look like?**
Complete this sentence: "A user can _____ and that's enough to ship."

**5. How does it make money?** (See Monetization section below.)

**6. How do users find it?** (See Distribution section below.)

---

---

## ☑ Decision 1 — Language

**The question:** TypeScript or JavaScript?

---

### Option A: TypeScript (strict)

**What it is:** JavaScript with a compile-time type system. The compiler
catches entire classes of bugs before they reach the browser.

**Pros:**
- Catches "undefined is not a function" and "missing property" bugs before runtime
- Agents write dramatically safer code with types — they can't accidentally pass a string where a number is expected
- IDEs give you autocomplete, jump-to-definition, and refactoring tools that only work with types
- Scales well — on a 10k+ line codebase, JS becomes unmanageable without types
- Vitest, ESLint, and all major tools have first-class TypeScript support
- Force-multiplies agent sessions: the type errors *are* the spec

**Cons:**
- More upfront setup (tsconfig.json, type declarations for some libraries)
- Some JS-only libraries have incomplete or missing types (usually solvable with `@types/...`)
- Slightly steeper learning curve for newcomers
- Adds a compile step (negligible with Vite)

**Best when:** any project that will run more than 2 sessions, or be touched by AI agents.

---

### Option B: JavaScript (plain)

**What it is:** No type system. Faster to start. Easier to prototype.

**Pros:**
- Zero setup — no tsconfig, no type annotations
- Slightly faster for throwaway prototypes
- No type errors blocking you when you're moving fast

**Cons:**
- AI agents make more mistakes without types — they can't verify their own output
- Bugs surface at runtime, not compile time — harder to catch without a full test suite
- Refactoring is risky and tedious at scale
- You'll want TypeScript by session 3 anyway; migrating is painful

**Best when:** truly one-off HTML prototypes that will never grow. Toy scripts. Nothing serious.

---

### Choose TypeScript if...
- The project will live longer than one week → **TypeScript**
- AI agents will be writing the code → **TypeScript** (this is almost always yes)
- The project has more than one file → **TypeScript**
- You want to scale or hire later → **TypeScript**

### Choose JavaScript if...
- You're building a 2-hour throwaway prototype that you'll delete → **JavaScript**
- Otherwise → **TypeScript**

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 2 — Framework

**The question:** How does the UI get built and rendered?

---

### Option A: React (with Vite)

**What it is:** Component-based UI library. The most common framework by far.
Vite is the build tool — it's fast, minimal config, and works with TypeScript out of the box.

**Pros:**
- Enormous ecosystem — any library you need has React support
- Agents are best at React; it's the dominant framework in their training data
- Component model is a natural fit for game UIs, dashboards, and complex layouts
- Tailwind, shadcn/ui, Radix, and virtually all UI libraries work out of the box
- Hot module replacement with Vite is fast
- Easy to split into separate files as the project grows (see little-hunters lesson)

**Cons:**
- More JavaScript sent to the browser than necessary for simple pages
- Client-side rendered by default (no SEO without a server)
- Hooks can be confusing until the mental model clicks

**Best when:** any interactive single-page app — games, dashboards, tools, educational apps.

---

### Option B: Next.js

**What it is:** React with server-side rendering, file-based routing, and
a built-in API layer.

**Pros:**
- Server-side rendering = SEO out of the box (critical for marketing pages)
- File-based routing: create a file in `app/`, it becomes a URL
- API routes built in — no separate Express server needed
- Vercel deployment is one command
- Full-stack in one codebase: UI + backend + auth in one repo

**Cons:**
- More complex than Vite + React — server vs. client components add mental overhead
- Slower build times than Vite for large projects
- Overkill for games and canvas apps (server rendering doesn't help you)
- Edge cases with caching, hydration, and streaming are hard to debug

**Best when:** content-heavy sites with SEO needs, marketing pages, apps where the server-side data fetching pattern helps (e.g., dashboards with frequent server reads).

---

### Option C: Vanilla TypeScript (no framework)

**What it is:** Plain TypeScript, DOM manipulation, no component model.
What webbyspin uses for its views layer.

**Pros:**
- Fastest runtime performance — no virtual DOM overhead
- Full control over every DOM operation
- Works perfectly with Pixi.js and Three.js (which don't want React in the way)
- Smallest bundle size

**Cons:**
- No component model — you build your own view management
- Agents are slower with vanilla DOM than with React
- UI reuse is harder — no natural component boundary
- Gets messy fast without a clear architecture (webbyspin has a custom router + view system)

**Best when:** canvas-first apps (games, drawing tools), performance-critical rendering, or when you need full control of the DOM for animation/IK rigs.

---

### Option D: Svelte / SvelteKit

**What it is:** Compiles components to vanilla JS at build time. No virtual DOM.

**Pros:**
- Extremely small bundle sizes
- Reactivity is built into the language syntax (no useState)
- SvelteKit gives you routing + SSR like Next.js, but simpler
- Fast to prototype

**Cons:**
- Smaller ecosystem than React
- Agents are less fluent in Svelte (less training data)
- Fewer component libraries compared to React
- If you use React everywhere else, switching to Svelte adds cognitive overhead

**Best when:** size-sensitive apps, or if you're comfortable with Svelte already.

---

### Choose based on your project type:

| Project type | Framework |
|---|---|
| Game / drawing tool / canvas-first | Vanilla TS + Pixi.js or Three.js |
| Single-page app / tool / dashboard | React + Vite |
| Marketing site / SEO-critical | Next.js |
| App with both SEO and interactivity | Next.js |
| Small prototype, learning project | React + Vite |
| Max performance, smallest bundle | Svelte |

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 3 — Styling

**The question:** How does the UI get its visual appearance?

---

### Option A: CSS design tokens (style.css with custom properties)

**What it is:** A single `style.css` file with `:root { --token: value }` custom
properties. Components use `var(--token)` references. Primitive classes (.btn,
.modal, .tile) defined once and reused everywhere. What webbyspin uses.

**Pros:**
- Theming is trivial — swap `--bg` from dark to light and the whole app updates
- No build step — CSS custom properties work in every browser
- Design tokens make agent sessions consistent — they use the same variables you defined
- Perfectly supports `prefers-color-scheme` and runtime theme switching
- Scales to 50k+ line apps without becoming unmanageable (webbyspin proof)

**Cons:**
- No utility classes — you write more CSS by hand
- Requires discipline to keep the token set small and consistent
- Newcomers expect Tailwind and may be confused by the custom system

**Best when:** apps with custom design systems, canvas apps, anything with dynamic theming.

---

### Option B: Tailwind CSS

**What it is:** Utility-first CSS framework. Classes like `flex gap-4 p-2 rounded-lg`
in the JSX instead of separate CSS files.

**Pros:**
- Extremely fast to prototype — no context switching between JSX and CSS files
- Agents are very good at Tailwind (it's everywhere in training data)
- Design constraints built in — spacing, colors, and radii come from a predefined scale
- Tiny production bundle (only includes classes you use)
- shadcn/ui, Radix UI, and most modern component libraries are Tailwind-first

**Cons:**
- JSX gets verbose with long class strings
- Custom themes require a Tailwind config file — not trivially swapped at runtime
- Runtime theme switching (dark/light toggle) requires CSS custom props inside Tailwind anyway
- Not a good fit for canvas apps (where styling is all programmatic)

**Best when:** React apps with lots of layout work, dashboard UIs, apps where you're using shadcn/ui or Radix components, rapid prototyping.

---

### Option C: CSS Modules

**What it is:** Each component gets its own `.module.css` file. Class names are
scoped to the component automatically — no global collision.

**Pros:**
- True style encapsulation — no accidental overrides
- Plain CSS, no build-time abstractions to learn
- Works alongside a token system (import tokens from a global file)

**Cons:**
- More files to manage (one .module.css per component)
- Agents sometimes miss the import or get the syntax wrong
- No utility classes — verbose for layout work
- Dynamic theming still needs custom properties

**Best when:** large teams where style encapsulation prevents accidents. Overkill for solo projects.

---

### Option D: Inline styles (in-JSX style objects)

**What it is:** `style={{ backgroundColor: theme.bg, padding: 16 }}` directly in JSX.

**Pros:**
- No external files — everything in one place
- Perfect for heavily dynamic, theme-driven components (little-hunters uses this)
- No class name collisions possible
- Works great for SVG-heavy UIs where colors are computed

**Cons:**
- No hover states, media queries, or pseudo-selectors (requires workarounds)
- No Tailwind or design token reuse
- Gets messy fast on complex layouts
- CSS animations require a `<style>` injection workaround

**Best when:** game scenes and SVG-heavy components where every color is a variable anyway.

---

### The real answer: combine them

| Layer | Approach |
|---|---|
| Design tokens (colors, spacing, radius, motion) | CSS custom properties in `style.css` |
| Layout and composition | Tailwind or token-based classes |
| Game / canvas / SVG components | Inline styles |
| Complex interactive components | Primitive classes (.btn, .modal) in style.css |

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 4 — State management

**The question:** How does data flow through the app and get shared between components?

---

### Option A: React built-ins (useState + useReducer + Context)

**What it is:** React's own state hooks. `useState` for local state, `useReducer`
for complex local state, `Context` for sharing state without prop-drilling.

**Pros:**
- Zero dependencies — it's in React itself
- Agents know it perfectly
- Perfect for small-to-medium apps
- Easy to understand and reason about

**Cons:**
- Context re-renders all consumers on every change — can cause performance issues at scale
- Global state across many components becomes awkward without a state library
- Complex async patterns (optimistic updates, sync queues) need custom code

**Best when:** apps with mostly local state, simple data flows, prototypes.

---

### Option B: Zustand

**What it is:** Minimal global state library. One `useStore` hook, subscribe
anywhere. What veg3D uses.

**Pros:**
- Tiny (1.1kb). No boilerplate. Zero provider wrapping.
- Selective subscriptions — components only re-render when their slice changes
- Works perfectly with TypeScript
- Agents know it well
- Supports immer for immutable updates out of the box

**Cons:**
- One more dependency
- Can encourage putting too much in global state
- Not as powerful as Redux for very complex state machines

**Best when:** any app with meaningful shared state (auth, theme, user data, game state).
The default choice for most of your projects.

---

### Option C: Jotai

**What it is:** Atom-based state (like Recoil). Each piece of state is an
`atom`; components subscribe to specific atoms.

**Pros:**
- Very fine-grained — components only re-render when their specific atom changes
- Great for complex interdependent state (derived values, computed state)
- Works well with async atoms (fetching, caching)

**Cons:**
- More conceptual overhead than Zustand
- Less common — agents make more mistakes with Jotai than Zustand
- Overkill for most apps

**Best when:** apps with many small independent state slices with lots of derivations.

---

### Option D: Redux Toolkit

**What it is:** The "canonical" React state library. Actions, reducers, slices, selectors.

**Pros:**
- Powerful devtools — time-travel debugging, action replay
- Clear patterns for complex async (RTK Query)
- Battle-tested at massive scale

**Cons:**
- Significant boilerplate even with Toolkit
- Overkill for solo/small projects
- Agents write Redux correctly but it's slow and verbose

**Best when:** large teams, complex apps, when you need the devtools for debugging.
Probably not your default.

---

### Choose:
- Small app, mostly local state → **useState + useReducer**
- Any shared state, auth, theme, game state → **Zustand**
- Many derived/computed atoms → **Jotai**
- Large team, complex async, devtools critical → **Redux Toolkit**

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 5 — Storage + backend

**The question:** Where does user data live, and how does it get there?

---

### Option A: localStorage only

**What it is:** Browser-side key-value storage. Data lives on the device.

**Pros:**
- Zero setup. Zero cost. Zero backend.
- Works offline
- No auth required
- Perfect for prototypes, single-device tools

**Cons:**
- Data is lost if the user clears their browser storage
- No cross-device sync
- No sharing between users
- 5–10MB limit per origin (usually fine for app state, not for media)
- Can't build social features on top of this

**Best when:** prototypes, personal tools, games where save data doesn't need to follow the user.

---

### Option B: localStorage write-through to Supabase (the webbyspin pattern)

**What it is:** localStorage serves as an offline cache. All writes go to
localStorage immediately (synchronous, instant UI feedback), then queue
an async upsert to Supabase. On reconnect, the queue drains. Server is the
source of truth; localStorage is the cache.

**Pros:**
- App feels instant — UI responds to localStorage, not to the network
- Works offline
- Cross-device sync when online
- User data survives browser clears
- Scales to millions of records
- Supabase free tier is generous for early projects

**Cons:**
- More complex than pure localStorage (need a sync queue, conflict resolution)
- Requires Supabase setup (15 min, documented in RUNBOOK.md)
- Requires auth (users need accounts for data to be user-specific)

**Best when:** any app where users need their data to follow them across devices,
or where you want to build features that depend on server-side data.

---

### Option C: Supabase (server as source of truth, no local cache)

**What it is:** Every read/write goes directly to Supabase. No local cache.

**Pros:**
- Simpler code — no sync queue or cache invalidation
- Server is always current
- Supabase Realtime gives you live updates across devices instantly

**Cons:**
- App requires internet connection to function at all
- Every interaction has network latency
- More Supabase reads = higher cost at scale

**Best when:** collaborative apps where real-time sync is more important than offline
capability (shared documents, live dashboards, multi-user games).

---

### Option D: Firebase (Firestore + Auth)

**What it is:** Google's backend-as-a-service. Similar to Supabase but NoSQL.

**Pros:**
- Excellent real-time sync out of the box
- Firebase Auth is extremely easy to set up (Google sign-in in 10 min)
- Generous free tier
- Good mobile SDK

**Cons:**
- NoSQL document model is less flexible than Supabase's Postgres
- Vendor lock-in — harder to migrate away from Firebase than Supabase
- Querying is limited compared to SQL (no joins)
- Less agent knowledge than Supabase

**Best when:** mobile-first apps, real-time features (chat, live collaboration), when you need Google sign-in quickly.

---

### Option E: PlanetScale / Turso / Neon (serverless SQL)

**What it is:** Serverless Postgres or MySQL. Scales automatically.

**Pros:**
- Full SQL power
- Serverless — no always-on cost
- Scales from 0 to millions without infra changes
- PlanetScale's branching model is great for schema changes

**Cons:**
- Needs a server layer (API routes or Edge Functions) — no direct browser access
- More setup than Supabase (which bundles auth + storage + DB together)
- More expensive at scale than Supabase

**Best when:** apps that need a database but don't need Supabase's auth/storage,
or when you need to optimize database costs independently.

---

### Choose:
- Prototype / personal tool → **localStorage**
- Any real app with user accounts → **localStorage write-through to Supabase**
- Real-time collaboration → **Supabase Realtime or Firebase**
- Complex data model with joins → **Supabase (Postgres)**
- Mobile-first + simple data → **Firebase**

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 6 — Authentication

**The question:** How do users log in, and how are their sessions managed?

---

### Option A: No auth (anonymous / local-only)

**What it is:** No login. App works without an account. Data tied to the device.

**Pros:**
- Zero friction — user opens the app and starts immediately
- No email collection, no privacy concerns around credentials
- No auth bugs to debug

**Cons:**
- No cross-device sync
- No user-specific features (leaderboards, sharing, profiles)
- Can't communicate with users later

**Best when:** kids' games (Quinn doesn't have an email), personal local-only tools,
prototypes, or as the initial state before adding auth later.

---

### Option B: Supabase Auth (email + password + magic link + OAuth)

**What it is:** Supabase bundles a full auth system. Supports email/password,
magic links (passwordless), and OAuth providers (Google, Apple, GitHub, etc.).
What webbyspin uses.

**Pros:**
- All-in-one: auth + database + storage in one dashboard
- Magic link means users don't need to remember a password
- Google OAuth is one toggle in the Supabase dashboard
- Free tier handles thousands of users
- Row Level Security (RLS) ties data to users automatically
- Sessions managed via JWT — no custom session code

**Cons:**
- Setup takes 15-20 min the first time (documented in RUNBOOK.md)
- Email deliverability requires a custom SMTP sender for production (Resend works well)
- Supabase Auth is less opinionated than Clerk — you build your own UI

**Best when:** any app where you're already using Supabase for the database.
This is your default for anything with user accounts.

---

### Option C: Clerk

**What it is:** Auth-as-a-service. Drop in `<SignIn/>` and `<UserButton/>`
components and auth is done. Handles everything including the UI.

**Pros:**
- Fastest to implement — literally drop in components
- Beautiful prebuilt UI for sign-in, sign-up, user profile
- Multi-factor auth, session management, and org management built in
- Excellent Next.js integration

**Cons:**
- Free tier has a user limit (10k MAU before billing kicks in)
- More expensive than Supabase at scale
- Adds a vendor dependency for a core function
- No database — you still need Supabase/Postgres for data

**Best when:** Next.js apps where you want auth done in an hour, B2B apps with
org management, apps where the auth UI needs to be polished quickly.

---

### Option D: Firebase Auth

**What it is:** Google's auth system. Pairs naturally with Firestore.

**Pros:**
- Google sign-in is trivial
- Works great for mobile (React Native / Flutter)
- Generous free tier

**Cons:**
- Tightly coupled to the Firebase ecosystem
- Less SQL-friendly than Supabase

**Best when:** you're already using Firebase for your database.

---

### Choose:
- Kids' app, no accounts needed → **No auth (local-only)**
- Using Supabase for DB → **Supabase Auth**
- Next.js app, need auth fast with good UI → **Clerk**
- Firebase DB already → **Firebase Auth**

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 7 — Deployment

**The question:** Where does the app live on the internet?

---

### Option A: Cloudflare Pages

**What it is:** Static site hosting on Cloudflare's global edge network.
Connect your GitHub repo, set the build command, and every push to `main`
auto-deploys. Every branch gets a preview URL.

**Pros:**
- Genuinely the fastest CDN in the world — files served from the nearest edge node
- Free tier is extremely generous (unlimited requests, 500 builds/month)
- Preview deploys on every branch — show clients or test yourself before merging
- Custom domain setup is straightforward
- Cloudflare Workers for serverless functions on the same platform
- One-click rollback in the dashboard
- What webbyspin uses

**Cons:**
- Build cache can be finicky on first setup
- Workers are not Node.js — edge runtime has some limitations (no fs, no some libraries)
- For server-rendered apps (Next.js), need to use `@cloudflare/next-on-pages` adapter

**Best when:** static sites, SPAs, Vite + React apps, anything that builds to a `dist/` folder.

---

### Option B: Vercel

**What it is:** The company behind Next.js. Optimized for Next.js but works with anything.

**Pros:**
- The absolute fastest way to deploy a Next.js app
- Preview URLs on every PR
- Serverless functions (Node.js runtime — no edge-runtime limitations)
- Excellent DX — `npx vercel` to deploy in one command
- Generous free tier for personal projects

**Cons:**
- Gets expensive faster than Cloudflare at scale (bandwidth costs)
- Slight vendor lock-in for Next.js-specific features
- For non-Next.js apps, Cloudflare Pages is often faster and cheaper

**Best when:** Next.js apps, apps that need Node.js serverless functions, when DX speed is the priority.

---

### Option C: Railway

**What it is:** Full server hosting. Runs Node.js, Python, Postgres, Redis — actual servers, not just static files.

**Pros:**
- Runs real servers — no edge runtime limitations
- Great for Express APIs, full-stack apps with background jobs
- Postgres included
- Easy to understand pricing ($5/month starter)

**Cons:**
- Always-on cost (no free tier that scales to zero)
- More complex than static hosting
- Overkill for pure frontend apps

**Best when:** apps with a backend server (like mango-grove's Express API), background job queues, anything that can't be serverless.

---

### Option D: Netlify

**What it is:** Similar to Vercel and Cloudflare Pages. Good static hosting.

**Pros:**
- Long track record, simple to use
- Form handling built in
- Identity (auth) built in (though limited)

**Cons:**
- More expensive than Cloudflare at scale
- Smaller edge network than Cloudflare
- Less compelling than Vercel or Cloudflare for new projects

**Best when:** If you're already familiar with it. Otherwise Cloudflare Pages or Vercel are better defaults today.

---

### Choose:
- Vite + React / any SPA → **Cloudflare Pages**
- Next.js → **Vercel** (or Cloudflare Pages with adapter)
- Express API / full backend → **Railway**
- Need a database near the compute → **Railway** or **Supabase + Cloudflare Pages**

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 8 — Testing

**The question:** How do you catch bugs before they reach users?

---

### Unit tests

#### Option A: Vitest

**What it is:** Vite-native test runner. Instant startup, compatible with Jest API.
What webbyspin uses (370 tests).

**Pros:**
- Starts in milliseconds (no jest startup overhead)
- Shares your Vite config — no separate babel/ts setup
- 100% Jest API compatible — agents know it perfectly
- Coverage via c8/v8 built in
- `--watch` mode is excellent

**Cons:**
- Slightly less mature than Jest (occasional edge cases with mocking)
- Large enterprise teams may prefer Jest's longer track record

**Best when:** any Vite project. Default choice.

#### Option B: Jest

**What it is:** The OG JavaScript test runner. The standard for React projects for years.

**Pros:**
- Maximum ecosystem support
- Excellent mocking system
- Large community, tons of examples

**Cons:**
- Slow startup vs Vitest
- Requires separate babel/ts config for TypeScript
- For Vite projects, Vitest is strictly better

**Best when:** non-Vite projects, or if you have existing Jest tests to maintain.

---

### E2E tests

#### Option A: Playwright

**What it is:** Microsoft's E2E testing framework. Tests in real browsers.
What webbyspin uses.

**Pros:**
- Tests run in Chromium, Firefox, and WebKit — real cross-browser coverage
- Excellent TypeScript support
- Auto-waits for elements — no flaky `waitForTimeout` hacks needed
- Can record tests by interacting with the browser
- Screenshot and video on failure
- Works well with CI

**Cons:**
- Slower than unit tests — run on CI, not on every save
- Browser download required (`npx playwright install`)
- Overkill for very simple apps

#### Option B: Cypress

**What it is:** The original popular E2E framework. Tests in a special Chrome.

**Pros:**
- Very popular — lots of examples and plugins
- Great interactive test runner UI
- Time-travel debugging

**Cons:**
- Only tests in Chrome (unless using Cypress Cloud)
- Slower than Playwright on CI
- Playwright has largely superseded it for new projects

---

### Coverage thresholds (don't skip this)

Set minimum coverage in `vitest.config.ts`. This makes agents produce tests
alongside features, not after:

```ts
coverage: {
  provider: 'v8',
  thresholds: { lines: 60, functions: 60, branches: 60 }
}
```

Start at 60% — achievable without killing velocity. Raise as the project matures.

---

### The minimum viable test suite

1. **One unit test per utility function** — pure functions are trivial to test and catch the most bugs
2. **One test per state machine transition** — what happens when the user does X?
3. **One E2E smoke test** — sign in → use the core feature → confirm it worked
4. **One E2E for the payment/upgrade flow** (if monetized)

### Our choice
- **Unit framework:**
- **E2E framework:**
- **Coverage threshold:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 9 — Analytics

**The question:** How do you know what users are actually doing?

---

### Option A: PostHog

**What it is:** Open-source product analytics with a self-hostable option.
Event tracking, funnels, session recordings, feature flags. What webbyspin uses.

**Pros:**
- Generous free tier (1M events/month)
- Self-hostable (GDPR-friendly)
- Feature flags built in — ship features to segments without re-deploying
- Session recordings — watch real users use your app
- Works great with TypeScript

**Cons:**
- More setup than Google Analytics (need to wire up events yourself)
- EU self-host can have latency if server is far from users

**Best when:** any app where you want to understand user behavior, not just pageviews.

---

### Option B: Plausible

**What it is:** Privacy-first, GDPR-compliant analytics. No cookies, no personal
data. Just pageviews and basic events.

**Pros:**
- Zero cookie consent banner needed (GDPR compliant by design)
- Very simple — 5 min to set up
- Lightweight script (~1kb)
- Fixed pricing (not event-based)

**Cons:**
- Less powerful than PostHog — no funnels, no user identification, no session recordings
- No feature flags
- Paid only ($9/mo)

**Best when:** sites where privacy is paramount (health apps, kids' apps), marketing pages,
or when you just need pageviews and don't need deep behavioral analytics.

---

### Option C: Google Analytics 4

**What it is:** The standard. Free, powerful, widely integrated.

**Pros:**
- Free
- Deep integration with Google Ads and Search Console
- Widely known — any marketer knows how to read it

**Cons:**
- Cookie consent required (GDPR)
- CCPA issues in California
- Data goes to Google — not appropriate for health or kids' apps
- Complex event model takes time to learn
- Heavy script

**Best when:** marketing-driven apps where Google Ads integration matters.

---

### Option D: No analytics

**Pros:** Zero privacy concerns, zero setup, zero cost.
**Cons:** You're flying blind. You won't know what's broken until users complain.

**Best when:** purely local apps, prototypes, apps where even knowing the user exists is a privacy concern.

---

### Analytics consent pattern

If you collect any analytics, you need a consent banner in most markets:
- EU/UK: explicit opt-in required
- California (CCPA): opt-out required
- Kids' apps (COPPA): no behavioral tracking at all

webbyspin's pattern: ship a consent banner, gate all PostHog calls behind
`analytics.consent === 'granted'`. Agents can implement this in ~2 hours
using the `consent-banner.ts` pattern in webbyspin as a reference.

### Our choice
- **Choice:**
- **Consent approach:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 10 — Monetization

**The question:** How does this make money?

---

### Option A: Free + one-time unlock ($4.99–$14.99)

**What it is:** Core experience is free. A single payment unlocks premium features permanently.
What webbyspin is targeting (mirroring Monument Valley 3).

**Pros:**
- Lowest friction — users try before they pay
- No subscription fatigue
- Simple to implement (one Stripe/Lemon Squeezy product)
- Users feel good about it — they own what they paid for
- Works on web (Stripe) and App Store (IAP)

**Cons:**
- One-time revenue — no recurring income
- Need high volume to make meaningful money at $4.99
- Churn isn't a concept, but neither is LTV growth

**Best when:** apps with a clear "free to play, pay to own more" divide. Games, creative tools,
apps with a natural premium tier (export, cloud sync, advanced features).

---

### Option B: Subscription ($4–$15/month)

**What it is:** Monthly or annual recurring payment for access to the full app or premium features.

**Pros:**
- Predictable recurring revenue — best for business valuation
- Aligns your incentives with users staying happy (churn = lost revenue)
- Higher total revenue per user over time (LTV >> one-time price)
- Annual plans give cash upfront

**Cons:**
- Harder sell — users resist recurring charges
- Subscription fatigue is real in 2026
- Need strong ongoing value to justify renewal
- Churn management is a real job

**Best when:** apps with ongoing value delivery (new content, AI queries, active community),
SaaS tools, apps targeting professionals who expense it.

---

### Option C: Freemium (free forever with paid tier)

**What it is:** Free tier with real value, paid tier with more.

**Pros:**
- Maximizes top-of-funnel — everyone can use the app
- Clear upgrade path
- Works well with both one-time and subscription

**Cons:**
- Free users have real costs (storage, API calls, server costs)
- Need to design the paywall carefully — free tier must be good enough to share,
  not so good that no one upgrades

**Best when:** almost always — it's the structure, not the model. The question is
what's free and what's paid.

---

### Option D: B2B / licensing

**What it is:** Sell to organizations, not individuals. Schools, studios,
companies. Higher ACV, fewer customers.

**Pros:**
- $500–$5,000/year per customer vs. $4.99 one-time
- Less churn than consumer
- Procurement cycles mean long-term contracts
- Little Hunters → school districts. Strategy Workshop → agencies.

**Cons:**
- Sales cycle is long and relationship-driven
- Need invoicing, contracts, enterprise auth (SSO)
- Support burden is higher

**Best when:** apps with a natural institutional buyer (education, enterprise tools,
professional services).

---

### Option E: Advertising

**Pros:** Revenue without asking users to pay.
**Cons:** Degrades the experience. Not appropriate for kids. Requires massive
scale to generate meaningful revenue. Misaligns incentives (users are the product).

**Best when:** almost never for your products. You've explicitly said "ad-free"
is part of your brand.

---

### Payment processors

| Processor | Best for | Fee | Notes |
|---|---|---|---|
| **Stripe** | Web payments, subscriptions | 2.9% + $0.30 | Industry standard, excellent docs |
| **Lemon Squeezy** | Digital products, SaaS | 5% + $0.50 | Handles VAT globally, simpler than Stripe |
| **RevenueCat** | Mobile IAP (iOS/Android) | 1% | Abstracts Apple/Google IAP |
| **Apple IAP** | iOS App Store | 15–30% | Required for paid features in iOS apps |
| **Google Play** | Android | 15–30% | Required for paid features in Android apps |

**Rule:** Web payments → Stripe or Lemon Squeezy. Mobile paid features → must use
Apple/Google IAP (App Store rules). Use RevenueCat to manage both.

### Our choice
- **Model:**
- **Processor:**
- **Free tier includes:**
- **Paid tier unlocks:**
- **Price point:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 11 — AI / LLM integration

**The question:** Does this app use AI, and if so, how?

---

### Option A: No AI

**Best when:** pure games, simple tools, apps where AI adds no clear user value.
Don't add AI for its own sake.

---

### Option B: Anthropic API (Claude) via server proxy

**What it is:** Call Claude models from a server-side function (Cloudflare Worker,
Vercel Edge Function, Express route). Client sends a prompt, server adds the
API key and forwards to Anthropic.

**Pros:**
- Most capable model available (Claude 3.5+)
- API key stays on the server — not exposed to the client
- Streaming responses work well
- What moneymango-app uses

**Cons:**
- Cannot call from browser directly (CORS)
- Costs per token — need rate limiting for user-facing calls
- Need a server layer (adds complexity)

**Best when:** any app where Claude's reasoning quality matters — financial analysis,
educational content generation, complex instruction-following.

---

### Option C: Procedural / deterministic AI (no LLM)

**What it is:** Algorithmic generation — seeded randomness, noise functions,
L-systems, attractors. What webbyspin's AI Gallery uses (1,000 deterministic webs
generated without any LLM call).

**Pros:**
- Zero API cost
- Works offline
- Fully deterministic — same seed = same output every time
- Fast — no network round-trip
- Can generate thousands of variations without rate limits

**Cons:**
- Not "intelligent" — the system can't understand user intent
- Creative ceiling set by the algorithm, not language understanding

**Best when:** generative art, game content, any app where the "AI" is really
"algorithmic variation" — veg3D, webbyspin AI Gallery, procedural level generation.

---

### Option D: Local LLM via Ollama

**What it is:** Run open-source models locally. Proxy them as Anthropic API
by setting `ANTHROPIC_BASE_URL=http://localhost:11434/v1`. Use `qwen2.5-coder:7b`
for coding tasks.

**Pros:**
- Free — no API cost
- Works offline
- Privacy — data never leaves the machine

**Cons:**
- Much weaker than Claude for complex reasoning
- Requires local GPU (8GB+ VRAM for 7B models, 24GB+ for 32B)
- Not suitable for production (user-facing) — only for local dev/agent sessions

**Best when:** agent sessions when you're offline or rate-limited. Not for
user-facing features in production.

---

### Our choice
- **Choice:**
- **Model:**
- **Integration pattern:**
- **Rate limiting strategy:**
- **Why:**
- **Revisit if:**

### Forward compatibility (even when v1 says "no AI")

When v1 explicitly excludes AI/ML (Option A), the v1 data model must not preclude adding it in v2. Test before locking the schema: can the v1 tables feed a future ML pipeline without a rewrite? If not, restructure now.

The pillar protects v1's identity. The data model protects v2's optionality. Both are earned separately.

(Example: Bearing's "no LLM" pillar forbids AI in v1, but the `event` and `reflection` tables are designed so a future anomaly-detection layer could plug in without schema migration.)

---

---

## ☑ Decision 12 — Rendering engine (for games and canvas apps)

**The question:** How does the visual content get drawn? (Skip if building a standard web app.)

---

### Option A: Pixi.js

**What it is:** 2D WebGL renderer. Fast, battle-tested, excellent for 2D games
and canvas drawing tools. What webbyspin uses.

**Pros:**
- Best-in-class 2D performance (GPU-accelerated)
- Excellent TypeScript support
- Texture management, sprite sheets, filters, particle systems built in
- Works naturally alongside DOM elements
- Pixi.js v8 is modern and well-maintained

**Cons:**
- 2D only
- Larger bundle than vanilla Canvas2D
- Learning curve for the Pixi-specific APIs (Container, Graphics, Texture)

**Best when:** 2D games, drawing tools, interactive canvas apps, anything that needs
60fps with many moving objects.

---

### Option B: Three.js / React Three Fiber (R3F)

**What it is:** 3D WebGL library. R3F wraps it in React components. What veg3D uses.

**Pros:**
- Full 3D — cameras, lights, materials, shadows
- Enormous ecosystem (drei helpers, postprocessing, physics)
- R3F makes Three.js feel like React (declarative scene graph)
- WebGPU compute paths available

**Cons:**
- 3D is hard. Camera math, material systems, and performance optimization take time.
- Heavier than Pixi for pure 2D
- WebGPU is still not universal

**Best when:** 3D generative art (veg3D), 3D games, anything with depth, shadows,
or 3D camera movement.

---

### Option C: Canvas2D (vanilla)

**What it is:** Direct browser Canvas API. `ctx.fillRect()`, `ctx.drawImage()`, etc.
What webbyspin uses for thumbnails (`thumb.ts`).

**Pros:**
- Zero dependencies
- Works in every browser
- Fast enough for simple 2D rendering
- Easy to understand

**Cons:**
- No GPU acceleration (CPU only)
- Complex scenes get slow quickly
- No sprite management, texture caching, or filters

**Best when:** simple thumbnails, chart rendering, small canvas previews. Reach for
Pixi when you need performance.

---

### Option D: Unity / Unreal

**What it is:** Full game engines. Export to WebGL, mobile, desktop.

**Pros:**
- Professional game tools — physics, animation rigs, level editor, asset pipeline
- Large asset marketplace
- Unity's C# is approachable

**Cons:**
- Much higher complexity than a web canvas approach
- WebGL exports from Unity are large and slow to load (~50MB+)
- Not a natural fit for web-first products
- Build times are long

**Best when:** 3D games with complex physics, animation, and level design that
justify the engine overhead. Not for web-first interactive tools.

---

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 13 — Distribution

**The question:** Where do users actually find and install this?

---

| Channel | Audience reach | Revenue cut | Approval | Best for |
|---|---|---|---|---|
| **Web (direct)** | Anyone with a browser | 0% | None | All your projects |
| **Cloudflare/Vercel URL** | Direct link sharers | 0% | None | Beta, friends, family |
| **itch.io** | Indie game players | 10% suggested | None | Games, creative tools |
| **App Store (iOS)** | 1B+ iOS users | 15–30% | Apple review (days–weeks) | Mobile games, kids apps |
| **Google Play** | Android users | 15–30% | Google review (hours–days) | Mobile apps |
| **PWA (Progressive Web App)** | Any mobile browser | 0% | None | Bridge to App Store |
| **Poki** | 350M+ casual gamers | Revenue share | Partnership required | Casual web games |
| **B2B direct** | Enterprise buyers | 0% | None | High-value, low-volume |

### The mobile path (for webbyspin / little-hunters)

1. **PWA first** — add a `manifest.json` and service worker. Users can "install"
   from Chrome on Android or Safari on iOS. Takes 1 day.
2. **Capacitor** — wrap the PWA in a native shell. Same codebase, submits to
   App Store. Gives access to native APIs (push notifications, camera). ~90 day decision gate.
3. **App Store / Play Store submission** — requires Apple Developer account ($99/yr)
   and Google Play account ($25 one-time).

### Kids' app compliance (COPPA — required for anyone under 13)

- No behavioral advertising
- No collection of personal data from children
- Verifiable parental consent before collecting any data
- Privacy policy must be clearly written and accessible
- Consider kidSAFE+ certification ($400–800/yr) for App Store Kids Category

### Our choice
- **Primary channel:**
- **Secondary channels:**
- **Mobile strategy:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Decision 14 — Monorepo vs. separate repos

**The question:** Do related apps/packages live in one repo or separate ones?

---

### Option A: Separate repos (one repo per app)

**What it is:** webbyspin, little-hunters, veg3D — each in their own GitHub repo with
their own `package.json`, CI, and deploy configuration.

**Pros:**
- Clear separation — no chance of accidentally breaking another app
- Each repo has its own CI, deploy, and CLAUDE.md
- Simpler for agents (clear scope — this repo is this app)
- Cloudflare Pages connects to one repo per project

**Cons:**
- Shared code (design tokens, utilities, auth helpers) must be duplicated or extracted
  into a package — adds overhead
- No atomic cross-app changes
- More GitHub repos to manage

**Best when:** apps that are truly independent products (webbyspin vs. little-hunters).

---

### Option B: Monorepo (pnpm workspace / turborepo)

**What it is:** All apps in one repo under `apps/`. Shared packages in `packages/`.
What mango-grove and veg3D use.

**Pros:**
- Shared code is trivial — `import { Button } from '@repo/ui'`
- Atomic cross-app changes in one commit
- One CI pipeline for everything
- pnpm workspace manages dependencies efficiently

**Cons:**
- More complex setup
- Agents need clear workspace-level CLAUDE.md and per-app CLAUDE.mds to know where to work
- `.env` does NOT inherit into worktrees — must be copied manually (documented in AGENTS.md)
- A bug in a shared package can break all apps at once

**Best when:** apps that share significant code (shared auth, shared UI components,
shared API), or apps that are designed as one product family (mango-grove).

---

### Our choice
- **Choice:**
- **Why:**
- **Revisit if:**

---

---

## ☑ Legal + compliance checklist (complete before public launch)

Work through this before going live. Check each item, record the date completed.

| Item | Required for | Date done |
|---|---|---|
| Privacy Policy drafted | Any app collecting data | |
| Privacy Policy reviewed by a human (not just AI-drafted) | Before public launch | |
| Terms of Service drafted | Any app | |
| Cookie/analytics consent banner | EU/UK users | |
| COPPA compliance audit | Any app used by under-13s | |
| kidSAFE+ certification | App Store Kids Category | |
| LLC formed | Before accepting any payment | |
| DUNS number obtained | App Store enrollment | |
| USPTO trademark search | Before marketing heavily | |
| USPTO application filed (Classes 9 + 41) | Before scale | |
| Apple Developer account ($99/yr) | iOS distribution | |
| Google Play account ($25 one-time) | Android distribution | |
| App Store Small Business Program enrolled | After $1M revenue | |

---

---

## ☑ Summary — fill this in as your project's decision record

Once you've walked through the sections above, fill in this summary.
This becomes the permanent record for this project.

| Decision | Choice | Key reason | Revisit if |
|---|---|---|---|
| Language | | | |
| Framework | | | |
| Styling | | | |
| State management | | | |
| Storage + backend | | | |
| Auth | | | |
| Deploy | | | |
| Testing | | | |
| Analytics | | | |
| Monetization | | | |
| AI integration | | | |
| Rendering engine | | | |
| Distribution | | | |
| Repo structure | | | |

### Project identity recap
- **Product name:**
- **Who it's for:**
- **The one thing it does:**
- **What it does NOT do (top 3):**
- **Done enough to launch when:**
- **Year 1 revenue target:**
