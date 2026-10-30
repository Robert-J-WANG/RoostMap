# RoostMap

RoostMap is a New Zealand rental-area affordability and commute analysis platform. It uses official rental and statistical geography data to help renters compare areas, understand historical rent trends and evaluate housing costs alongside commuting requirements.

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

The project documents have separate responsibilities:

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
