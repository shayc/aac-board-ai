# `internal/`

> Internal. Import the public surface from `@shared/built-in-ai`, not from this folder.

The shared engine that every built-in AI hook and `create*` factory run on. One store per consumer; one `create()` path; one progress store the global indicator reads from; one equality rule that decides when options have "really" changed.

## States

```
                  (start)
                     │
                     ▼
   ┌──────────────► idle ──────prepare() / acquire()───┐
   │           ▲      ▲                                │
   │           │      └──auto-create on "available"────┤
   │           │                                       │
   │      (silent provision, no flash)                 │
   │                                                   ▼
   │                                              downloading
   │                                                   │
   └────────────────── prepare() retry ──┐             │
                                         │             ▼
   unsupported   unavailable   error ◄───┘           ready
   (terminal)   (terminal)    (one retry allowed)   (terminal-good)
```

- `idle` is the holding state: model is supported but a download is required, **or** an auto-create is silently in flight (no `downloading` flash for the already-local case).
- `downloading` is entered only on user-initiated provision via `prepare()` or `acquire()` — visible because progress matters.
- `error` is recoverable once: `prepare()` from `error` restarts the chain. A second failure rejects with `NotReadyError`; no infinite retry loop.
- Terminal states throw their typed error on `acquire()`.

## Files

| File                                       | Role                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [store.ts](store.ts)                       | The state machine. Owns `snapshot`, `start`/`stop`/`prepare`/`acquire`, listener fan-out.                                                            |
| [useLifecycle.ts](useLifecycle.ts)         | React adapter. Stabilizes options, spins up one store per component, wires `useSyncExternalStore`.                                                   |
| [create-instance.ts](create-instance.ts)   | Single-shot create path: namespace lookup → availability → user-activation guard → `create()` with progress wiring. Shared with `create*` factories. |
| [progress-store.ts](progress-store.ts)     | Cross-instance singleton. Both `create-instance` and the public `useGlobalDownloadProgress` read/write through it.                                   |
| [options-equality.ts](options-equality.ts) | Shallow per-key equality used by `useLifecycle` to decide when to re-create. Array-valued options must be memoized by callers.                       |
| [types.ts](types.ts)                       | `Status`, `BaseHookReturn`, `AINamespace`, `DestroyableInstance`.                                                                                    |

## Invariants worth knowing

- **A rejected action never mutates `status` or `error`.** Caller-aborts surface as `AbortError` from the call site only.
- **Options identity drives re-creation.** [options-equality.ts](options-equality.ts) does shallow per-key equality; array-valued options must be memoized by callers.
- **Unmount aborts in flight.** The store's controller fires `"lifecycle reset"`/`"lifecycle unmounted"`; instances that resolve after unmount are destroyed quietly.
- **Auto-create on `"available"` stays gesture-free.** It runs while `status === "idle"` (no `downloading` flash), so a concurrent `acquire()` must _park_ on it, not throw `NoUserActivationError`.
