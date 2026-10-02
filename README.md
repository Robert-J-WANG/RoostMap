# RoostMap

RoostMap is a New Zealand rental-area affordability and commute analysis platform. It uses official rental and statistical geography data to help renters compare areas, understand historical rent trends and evaluate housing costs alongside commuting requirements.

## Current status

The React application foundation, automated test foundation, responsive product shell and continuous delivery foundation are in place.

The application includes client-side routing for Home and Methodology, a shared Header, Main and Footer structure, unknown-route and route-error handling, Tailwind CSS design tokens, and project-owned shadcn/ui components.

The complete quality pipeline covers linting, component tests, the production build and Playwright browser tests. Pull requests deploy and verify Azure Static Web Apps previews; updates merged into main trigger a fresh production build, production deployment and deployed smoke test. The delivery configuration also provides SPA fallback, basic response headers, failed-test diagnostics and automatic preview cleanup.

## Planned product capabilities

- Explore rental areas using an interactive map
- View current rental observations and historical trends
- Compare multiple SA2 areas
- Estimate rental affordability from household income
- Evaluate commuting time and cost
- Save local or account-based plans
- Generate private shareable reports

## Data sources

The planned core data sources are:

- MBIE Rental Bond Data
- Stats NZ Statistical Area 2 Higher Geographies 2019

Publishable geographic coverage will be determined by successfully joining valid rental observations to Stats NZ SA2 geography.

## Project documentation

This README records the public summary of the project's implemented state. The detailed documents have separate responsibilities:

- [Project design](docs/PROJECT_DESIGN.md) — intended product scope, data meaning and user experience
- [Technical specification](docs/TECHNICAL_SPEC.md) — architecture, contracts and delivery constraints
- [Development outline](docs/DEVELOPMENT_OUTLINE.md) — implementation order and stage acceptance
- [Development learning notes](docs/steps.md) — chronological reasoning, operations and verification

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run component tests once:

```bash
npm run test
```

Run component tests in watch mode:

```bash
npm run test:watch
```

Run the browser tests:

```bash
npm run test:e2e
```

Run the complete local quality check:

```bash
npm run check
```
