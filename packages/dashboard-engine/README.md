# @ay/dashboard-engine

Reusable dashboard infrastructure for React applications: widget registries, responsive grids, schema-driven configuration panels, isolated widget error boundaries, and pluggable persistence and broadcast middleware.

The engine is app-agnostic. Consumers provide widget definitions, render context, and persistence adapters.

## Development

```bash
pnpm --filter @ay/dashboard-engine typecheck
pnpm --filter @ay/dashboard-engine test
pnpm --filter @ay/dashboard-engine build
```

Licensed under the MIT License; see [LICENSE](./LICENSE).

