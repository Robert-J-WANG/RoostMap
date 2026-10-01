# RoostMap Repository Guidance

This file applies to the entire repository.

## 1. Project identity

RoostMap is an independently designed portfolio and learning project focused on
frontend engineering, data visualisation and production-aware delivery. It is
not employment experience, a client project or a team-delivered commercial
system.

The project exists to:

- help renters compare New Zealand rental areas using verified official data;
- demonstrate intermediate-level React and TypeScript frontend engineering;
- practise data processing, mapping, visualisation, testing, accessibility,
  security, Git and CI/CD in a realistic product workflow;
- preserve an honest, step-by-step learning history;
- enable the project owner to explain every major implementation and technical
  decision in an interview.

Never describe planned work as implemented. Never describe RoostMap as
professional employment experience. It may be described as an independently
designed and developed portfolio project.

## 2. Developer context and target depth

The project owner is an early-career developer preparing for software and
frontend development roles in New Zealand. The owner uses the project to learn
the complete development process and must understand the details rather than
only receive a finished product.

The target level is:

```text
Job-ready junior to intermediate frontend engineering
with practical data-product and production awareness
```

This means:

- maintain professional correctness, accessibility, security and testing;
- explain concepts from first principles before relying on abstractions;
- prefer readable, explicit implementations the owner can defend in an
  interview;
- introduce production-aware patterns only when they solve a real requirement;
- measure before optimising;
- avoid enterprise architecture and technology added only for CV appearance.

Do not introduce microservices, Kubernetes, a custom application container,
GraphQL, Redux, a separate custom backend, event-driven architecture or another
major framework unless a verified requirement makes it necessary and the owner
explicitly changes the approved design.

Security, privacy, data integrity and accessibility are never optional because
this is a learning project.

## 3. Current project status

The repository has completed the initial React and TypeScript application and project foundation. Step 03 test foundation work is the current development stage.

Currently complete:

- the Vite React and TypeScript application created in Step 01;
- the initial local and remote Git baseline on `main`;
- the project structure, TypeScript path aliases, environment boundary and minimal application established in Step 02;
- `docs/PROJECT_DESIGN.md`;
- `docs/TECHNICAL_SPEC.md`;
- `docs/DEVELOPMENT_OUTLINE.md`;
- `docs/steps.md` as the single continuing learning record;
- this repository guidance file.

The test foundation, product pages, data pipeline, cloud resources and
deployment are not complete yet. Do not claim that any roadmap page, API,
database table, data workflow or production service exists until its
development step and validation have actually completed.

Update status claims only after checking the repository, tests, deployment
evidence and the relevant learning note.

## 4. Language and communication

Use these defaults:

- communicate with the project owner in Chinese;
- explain plans, concepts, errors, trade-offs and review findings in Chinese;
- keep file names, code identifiers, types, API routes and commit messages in
  English;
- write public-facing repository documentation in English unless the owner
  requests otherwise;
- use New Zealand English in English prose.

Preferred New Zealand English includes:

```text
authorisation
behaviour
colour
optimisation
organisation
visualisation
```

Do not rename an established API contract or identifier only to change spelling.
Chinese learning notes may retain standard English technical terms.

## 5. Source-of-truth rules

Different files answer different questions.

For intended scope and approved decisions:

```text
1. The owner's latest explicit instruction
2. docs/PROJECT_DESIGN.md for product, data meaning and user experience
3. docs/TECHNICAL_SPEC.md for architecture, contracts and delivery constraints
4. docs/DEVELOPMENT_OUTLINE.md for implementation order
```

For actual implemented behaviour:

```text
1. Current source code and runtime configuration
2. Data contracts, database migrations and generated manifests
3. Current automated tests
4. Current-step learning notes
5. README.md
6. Planning documents
```

`docs/PROJECT_DESIGN.md` defines what the finished product is intended to do.
`docs/TECHNICAL_SPEC.md` defines how the approved system is constrained.
`docs/DEVELOPMENT_OUTLINE.md` defines when and in what order it is learned and
implemented. None of these documents proves that a feature currently exists.

When sources disagree:

- identify the exact discrepancy;
- determine whether it is a code defect, stale documentation, unfinished work
  or an intentionally changed requirement;
- report the evidence before proposing a correction;
- do not silently change working code to match stale prose;
- do not rewrite planning history to make the implementation appear smoother
  than it was.

## 6. Collaboration and operation authority

The owner personally performs all development operations so that the project
remains a genuine learning process.

### Read-only requests

Requests such as the following are read-only:

```text
review
inspect
check
compare
discuss
explain
evaluate
suggest
```

For read-only requests:

- inspect relevant files and current state;
- report findings and evidence;
- do not edit the workspace;
- do not run state-changing commands.

Read-only commands such as `pwd`, `rg`, file viewing, `git status` and `git diff`
may be used to establish facts.

### Manual development operations

The owner manually performs:

- terminal commands;
- Git initialisation and every Git operation;
- dependency installation and upgrades;
- project scaffolding and generators;
- source-code implementation during guided development;
- test, build and lint commands;
- database start, reset, migration and seed operations;
- cloud configuration, deployment and secret management.

When guiding one of these operations:

- give one bounded step at a time;
- explain why the step is needed before the command or code;
- name the exact working directory and target file;
- provide copy-ready commands or focused code where appropriate;
- explain the expected result and how the owner verifies it;
- wait for the owner's real output before treating the step as complete.

Do not execute these operations on the owner's behalf unless the owner
explicitly replaces this rule for a specific operation.

### File-edit authority

Only edit repository files when the owner clearly asks to create, modify,
update, apply, replace, save, delete or rename them. A request for code or steps
to apply manually is not permission to edit the workspace.

Before an authorised edit:

- state the intended change briefly;
- name the files expected to change;
- preserve unrelated content and existing owner changes;
- avoid creating extra files outside the current step.

Never discard, overwrite or revert owner changes without an explicit request.

## 7. Learning workflow and step discipline

Follow `docs/DEVELOPMENT_OUTLINE.md` in order. Formal implementation begins
with creating the React + TypeScript application. Project governance content is
prepared before development and is placed into its repository structure during
Step 02; its earlier design process is not a separate learning Step.

Each step uses this loop:

```text
Understand the problem
→ define the acceptance result
→ owner performs the operation
→ verify the real output
→ diagnose and correct errors
→ record the learning note
→ owner performs the Git action
```

Rules:

- expand only the current step;
- do not provide complete future-module implementations in advance;
- keep examples limited to the concept currently being learned;
- do not skip validation because a command appears routine;
- diagnose from the actual error instead of replacing whole files blindly;
- begin the next step only after the current acceptance criteria pass;
- record useful mistakes and fixes instead of hiding the learning path.

Do not introduce a later dependency, folder, database field or abstraction early
unless the current step genuinely requires it.

## 8. Fixed product and data boundaries

The approved product scope comes from `docs/PROJECT_DESIGN.md`.

Core rules include:

- the product covers the publishable New Zealand dataset, not an Auckland-only
  whitelist;
- publishable areas are derived from valid MBIE observations joined to Stats NZ
  SA2 2019 geometry;
- SA2 2019 is the rental-statistics geography and business identifier;
- Region, territorial authority and verified urban/rural fields support
  navigation and display without changing the SA2 statistical unit;
- a higher-geography search can return multiple independent SA2 areas;
- do not force SA2 areas into a fabricated suburb model;
- maps, lists, details, charts, comparisons and reports must use the same data
  slice and definitions;
- missing observations remain missing and are not silently filled from another
  dwelling or bedroom category;
- provisional status, source limitations and observation periods stay visible;
- commute estimates run from an SA2 internal representative point to the
  workplace;
- the product does not provide live rental listings or real-time availability.

The two core official datasets are:

- MBIE Rental Bond Data;
- Stats NZ SA2 Higher Geographies 2019.

Do not invent an indicator, classification or statistical feature that the
source data and approved calculation rules cannot support. Additional data
sources require a concrete product need, licence review, data contract and an
approved design change.

## 9. Approved technology boundaries

Use the stack and implementation boundaries fixed in `docs/TECHNICAL_SPEC.md`.

### Frontend

- Node.js 24 LTS for local frontend, data tooling and normal CI; current baseline 24.21.0;
- npm and `package-lock.json`;
- React, TypeScript strict and Vite;
- ESLint;
- React Router;
- TanStack Query;
- Zustand;
- React Hook Form and Zod;
- react-map-gl through its MapLibre entry point, MapLibre GL JS and MapTiler Cloud;
- Recharts;
- Tailwind CSS, shadcn/ui component source and Lucide icons; Radix primitives only when a selected shadcn/ui component depends on them.

### Services and data

- versioned static rental-data files;
- Azure Static Web Apps managed Functions with HTTP triggers; select `apiRuntime` from the platform-supported values verified at the Functions feasibility step;
- Supabase Auth and PostgreSQL;
- TravelTime through Functions;
- Cloudflare Turnstile for anonymous high-cost API access;
- Supabase custom SMTP, with the production provider selected during account implementation from current deliverability, domain-verification and cost requirements;
- Application Insights for managed Functions; add the browser SDK only when release-stage evidence justifies it and the privacy filters have been verified.

### Testing and delivery

- Vitest;
- React Testing Library;
- Playwright;
- pgTAP where database and RLS work begins;
- GitHub Actions;
- Azure Static Web Apps.

React and managed Functions do not require custom application Docker images.
Local containers are limited to the Supabase CLI development services defined
in the technical specification.

Before adding or replacing a dependency:

1. state the problem it solves;
2. check whether the approved stack already solves it;
3. explain its learning, bundle and maintenance cost;
4. prefer the smallest suitable solution;
5. update the approved design first if it changes architecture or scope.

## 10. Frontend engineering conventions

- Use React function components and TypeScript strict mode.
- Keep route definitions centralised.
- Keep feature-specific components, schemas, services and tests inside their
  feature boundary.
- Move code to shared directories only after genuine cross-feature reuse exists.
- Use TanStack Query for asynchronous server state.
- Use Zustand only for the client interaction state assigned to it in the
  design.
- Use React Hook Form and Zod for the approved form boundaries.
- Add shadcn/ui components only when the current feature needs them, and treat the generated source as project code.
- Use semantic HTML and Tailwind directly for simple structures; do not build a second component system around raw Radix primitives.
- Keep public filter state in the URL and keep income, exact workplace and full
  plans out of URLs.
- Keep unsaved sensitive drafts in memory.
- Write plans to local storage only after an explicit Save locally action.
- Treat loading, empty, partial-data and error states as part of the feature.
- Use semantic HTML, labelled controls, keyboard support and visible focus.
- Provide accessible tabular or textual alternatives for data visualisations.
- Check desktop and mobile behaviour as part of each relevant slice.

Avoid speculative custom hooks, generic components, memoisation or state layers.
Extract them only when reuse, complexity or measured performance justifies it.

## 11. Data-pipeline conventions

- Keep raw official data and generated production data outside normal feature
  commits as specified by `.gitignore` and the technical specification.
- Commit small deterministic fixtures, contracts and `data/source-lock.json`.
- Validate source schema before transforming records.
- Preserve explicit rejection reasons and quality counts.
- Fail on invalid accepted keys, duplicate compound keys, broken joins or
  invalid geometry.
- Keep source URL, dates, licence, provisional status, SHA-256 and pipeline
  version traceable.
- Generate national indexes and Region partitions deterministically.
- Test representative major centres, smaller centres, sparse areas and Chatham
  Islands without turning those samples into a release whitelist.
- Publish an immutable data release bundle and retain a verified previous bundle
  for rollback.

Do not hand-edit generated output to make a quality check pass.

## 12. API, database, privacy and security

- Keep provider credentials and service-role secrets inside Functions.
- Never commit real secrets or copy them into examples, logs or test fixtures.
- Only intentionally public configuration may use the `VITE_` prefix.
- Validate request schemas, sizes, authentication and ownership at the boundary.
- Apply user/IP quotas where required by the design.
- Keep precise workplace, income, tokens and request bodies out of URLs and
  telemetry.
- Do not log access tokens, share tokens, exact addresses, income or secrets.
- Preserve the SA2-to-workplace route direction and the approved arrival-time
  semantics.
- Enable RLS on every user business table and test cross-user denial.
- Keep service-only tables inaccessible to browser roles.
- Use migrations for every database schema change.
- Store only share-token hashes and follow the fragment plus POST resolve flow.
- Keep local-storage and cloud persistence user-initiated.
- Do not weaken a privacy or ownership boundary to simplify a demo.

## 13. Testing, CI/CD and verification

Add the appropriate quality gate in the same iteration that introduces the
capability. Do not postpone all tests, CI or deployment work until the end.

The owner runs commands. Provide the relevant command and review the actual
output before reporting success.

Typical gates include:

```text
lint
unit and component tests
data contract and quality tests
Functions build and API tests
Supabase migration reset and pgTAP
Playwright for established user flows
production build
Preview and Production smoke tests
```

Use focused checks first, then the full current gate before a PR is complete.
Do not create tests that merely repeat implementation details. Prioritise
business calculations, data contracts, privacy/security boundaries, error
handling and critical user behaviour.

Never describe an unexecuted test, build, workflow, Preview or deployment as
passing. If a check cannot run, state the exact blocker and whether it is caused
by the change or the environment.

The CI baseline is created after the project quality scripts and application
shell are stable, then extended in the same Step that introduces each new
capability. CD begins with the first minimal public deployment and follows the
same incremental rule. The first deployment
validates the delivery path; it does not mean the product is publicly launched.

## 14. Documentation responsibilities

### `docs/PROJECT_DESIGN.md`

This is the canonical product baseline. It owns product scope, official-data
meaning, business calculations, routes, user experience and product acceptance.
Do not place implementation commands, folder layouts or CI configuration here.

### `docs/TECHNICAL_SPEC.md`

This is the canonical technical baseline. It owns architecture, data contracts,
frontend boundaries, APIs, identity, database, security, testing and delivery
constraints. Change it only when implementation evidence or an approved
requirement changes a technical decision.

### `docs/DEVELOPMENT_OUTLINE.md`

This is the concise implementation sequence. It owns phases, meaningful Steps,
outputs, learning topics, validation, acceptance and Git boundaries. Keep exact
commands, code and actual results out of the outline.

### `docs/steps.md`

This single file preserves the real manual steps, commands, output, mistakes,
diagnosis, fixes and learning conclusions for the whole project. Organise it by
meaningful engineering stages instead of creating one file per iteration or
copying every outline checkpoint into a separate note section. Expand the
current stage progressively and do not pre-write later work as though it already
happened.

### `README.md`

This is the public entry point. Describe only implemented behaviour as complete
and clearly separate current status from future scope.

After an implementation change, update documentation in this order where
applicable:

```text
1. Source, configuration, data contract, migration and tests
2. Current-step learning note
3. Product design, technical specification or development outline only if
   the approved baseline changed
4. README when public implemented status changed
```

For documentation-only edits, check Markdown structure, code fences, links,
scope claims and `git diff --check`. Do not request unrelated application tests.

## 15. Git workflow

RoostMap uses:

```text
stable main
→ short-lived branch
→ implementation and tests
→ Pull Request
→ required CI and Preview
→ self-review and correction
→ squash merge
→ main deployment and smoke test
→ delete completed branch
```

Do not create or maintain a long-lived `develop` branch. Do not work directly on
`main` after the initial documentation baseline.

Branch names use a clear category and purpose, for example:

```text
chore/project-foundation
spike/data-join
feat/data-first-sa2
feat/explore-map
fix/missing-periods
data/2026-04-refresh
```

All Git commands are performed manually by the owner. Do not stage, commit,
push, merge, rebase, reset, clean, force-push, delete a branch, create a tag or
open a Pull Request on the owner's behalf.

Before advising a Git operation:

- inspect the current branch and status read-only;
- distinguish current-step files from pre-existing owner changes;
- explain what the command changes;
- avoid destructive recovery commands;
- verify the result from the owner's output.

## 16. Definition of done

A step is complete only when:

- the owner understands its purpose and relevant concepts;
- the implementation matches the current approved scope;
- unrelated files remain unchanged;
- expected loading, empty, error, accessibility and privacy behaviour is handled
  where relevant;
- the owner has run the relevant checks and shared real results;
- failures and environment limits are reported honestly;
- CI, Preview, deployment and smoke tests have passed when that iteration
  requires them;
- the current learning note records the real process;
- documentation does not overstate implementation status;
- no secret or sensitive value has been introduced;
- the owner performs the intended Git action.

The repository must remain understandable, evidence-based and interview-ready
throughout development, not only after the final release.
