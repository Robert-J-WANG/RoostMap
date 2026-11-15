# RoostMap

RoostMap is an independently designed portfolio and learning project being developed as a New Zealand rental-area evidence explorer. It uses official rental and statistical geography data to help renters understand observed weekly rents, historical changes and data coverage across SA2 areas.

RoostMap provides regional statistical evidence rather than live rental listings or a recommendation about the best place to live.

## Product scope

- Explore rental areas using an interactive map
- Filter a consistent data slice by dwelling type, bedroom category and optional weekly-rent limit
- View latest rental observations, historical trends and Reported Bonds
- Compare up to four SA2 areas using the same period and category definitions
- Trace data periods, provisional status, sources and methodology

## Data sources

The core data sources are:

- MBIE Rental Bond Data
- Stats NZ Statistical Area 2 Higher Geographies 2019

Publishable geographic coverage will be determined by successfully joining valid rental observations to Stats NZ SA2 geography.

## Project documentation

The project documents have separate responsibilities:

- [Project design](docs/PROJECT_DESIGN.md) — intended product scope, data meaning and user experience
- [Technical specification](docs/TECHNICAL_SPEC.md) — architecture, contracts and delivery constraints
- [Development outline](docs/DEVELOPMENT_OUTLINE.md) — implementation order and stage acceptance

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
