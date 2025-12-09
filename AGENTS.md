# AGENTS.md

Project: **AAC Board AI** — React 19 + TypeScript AAC board.  
Critical: **Accessibility must not break.** Chrome Built-In AI optional → always provide fallback.

## Commands

| Action  | Command        |
| ------- | -------------- |
| Install | `npm install`  |
| Dev     | `npm run dev`  |
| Test    | `npm test`     |
| Lint    | `npm run lint` |

Before completion: `npm run lint && npm test`

## Code Requirements

- **TS strict** — no `any` unless justified.
- **React Compiler** active → avoid `useMemo`/`useCallback` unless required.
- **Co-locate** component + test + style.
- **Accessibility mandatory**:
  - semantic HTML, ARIA, keyboard nav.
- **AI usage**:
  - check API availability, implement graceful fallback.

## Structure

```
src/
├─ app/ Shell, providers, layout
├─ features/ Modules (AAC logic)
├─ pages/ Routes
└─ shared/ UI, utils, Chrome AI helpers
```

Aliases: `@app`, `@features`, `@pages`, `@shared`

## Testing Rules

- Tests sit beside code (`*.test.tsx`).
- Update tests when behavior/UI changes.
- Use coverage for critical changes.

## Boundaries

Always:

- Maintain accessibility & strict typing.
- Follow structure + aliases.
- Add/update tests for behavior changes.

Ask first:

- New deps
- Build/CI/tooling config changes
- New `src/features/*` modules

Never:

- Break accessibility
- Commit secrets
- Skip tests
- Disable TS strict
- Remove fallbacks for unsupported AI

## Completion Output

Reply with:
Changes:

- files modified/added

Tests:

- npm test result summary

Assumptions:

- design decisions

Follow-ups:

- recommended next steps
