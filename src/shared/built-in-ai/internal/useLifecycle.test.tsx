import { StrictMode } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type Mock,
} from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "../errors.ts";
import { makeAIFake } from "./test-fakes/ai-namespace-fake.ts";
import { useLifecycle } from "./useLifecycle.ts";

interface TestOptions {
  mode?: string;
}

interface TestInstance {
  destroy: Mock<() => void>;
  inputQuota?: number;
  marker?: string;
}

const NAMESPACE = "__TestAI";

function buildInstance(overrides: Partial<TestInstance> = {}): TestInstance {
  return { destroy: vi.fn<() => void>(), inputQuota: 1024, ...overrides };
}

function setUserActivation(isActive: boolean): void {
  Object.defineProperty(navigator, "userActivation", {
    value: { isActive },
    configurable: true,
  });
}

beforeEach(() => {
  // Default to no activation so user-gesture gating tests are deterministic.
  setUserActivation(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as unknown as { userActivation?: unknown }).userActivation;
});

describe("useLifecycle", () => {
  test("reports unsupported when the global is undefined", async () => {
    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.error).toBeNull();
    expect(result.current.inputQuota).toBe(0);
  });

  test("transitions idle → ready when availability is 'available'", async () => {
    const { Fake, create } = makeAIFake({
      status: "available",
      buildInstance: () => buildInstance({ marker: "primary" }),
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, { mode: "a" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.inputQuota).toBe(1024);
    expect(result.current.error).toBeNull();
    expect(create).toHaveBeenCalledTimes(1);
    // Auto-create must not register a download monitor — that's only for
    // user-initiated downloads via prepare()/acquire().
    const [createArg] = create.mock.calls[0] as [{ monitor?: unknown }];
    expect(createArg.monitor).toBeUndefined();
  });

  test("auto-create on 'available' never passes through 'downloading'", async () => {
    let resolveCreate!: (value: TestInstance) => void;
    const inst = buildInstance({ marker: "no-flash" });
    const create = vi.fn(
      () =>
        new Promise<TestInstance>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const observed: string[] = [];
    const { result } = await renderHook(() => {
      const lifecycle = useLifecycle<TestOptions, TestInstance>(
        NAMESPACE,
        undefined,
      );
      observed.push(lifecycle.status);
      return lifecycle;
    });

    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(result.current.status).toBe("idle");
    expect(observed).not.toContain("downloading");

    resolveCreate(inst);
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(observed).not.toContain("downloading");
  });

  test("settles at unavailable and never calls create", async () => {
    const { Fake, create } = makeAIFake({
      status: "unavailable",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(create).not.toHaveBeenCalled();
  });

  test("stays idle when availability is 'downloadable' and never auto-creates", async () => {
    const { Fake, create } = makeAIFake({
      status: "downloadable",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(Fake.availability).toHaveBeenCalledTimes(1));
    expect(result.current.status).toBe("idle");
    expect(create).not.toHaveBeenCalled();
  });

  test("prepare() rejects with NoUserActivationError when idle without activation", async () => {
    const { Fake } = makeAIFake({
      status: "downloadable",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    await expect(result.current.prepare()).rejects.toBeInstanceOf(
      NoUserActivationError,
    );
  });

  test("prepare() triggers download and reaches ready when userActivation is active", async () => {
    const { Fake, create } = makeAIFake({
      status: "downloadable",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    setUserActivation(true);
    await result.current.prepare();

    expect(result.current.status).toBe("ready");
    expect(create).toHaveBeenCalledTimes(1);
    // User-initiated downloads do wire a monitor for progress events.
    const [createArg] = create.mock.calls[0] as [{ monitor?: unknown }];
    expect(createArg.monitor).toBeTypeOf("function");
  });

  test("emits progress via downloadprogress events while creating", async () => {
    const monitors: CreateMonitor[] = [];
    let resolveCreate!: (value: TestInstance) => void;
    const create = vi.fn((opts: { monitor?: (m: CreateMonitor) => void }) => {
      const monitor = new EventTarget() as CreateMonitor;
      monitors.push(monitor);
      opts.monitor?.(monitor);
      return new Promise<TestInstance>((resolve) => {
        resolveCreate = resolve;
      });
    });
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    setUserActivation(true);
    void result.current.prepare();

    await vi.waitFor(() => expect(result.current.status).toBe("downloading"));
    expect(result.current.progress).toBe(0);

    monitors[0].dispatchEvent(
      Object.assign(new Event("downloadprogress"), { loaded: 0.4 }),
    );
    await vi.waitFor(() => expect(result.current.progress).toBe(0.4));

    monitors[0].dispatchEvent(
      Object.assign(new Event("downloadprogress"), { loaded: 0.85 }),
    );
    await vi.waitFor(() => expect(result.current.progress).toBe(0.85));

    resolveCreate(buildInstance());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
  });

  test("surfaces a create rejection as status='error' with BuiltInAIError wrapping the cause", async () => {
    const original = new Error("create failed");
    const { Fake } = makeAIFake({
      status: "available",
      buildInstance,
      failCreate: original,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBeInstanceOf(BuiltInAIError);
    expect(result.current.error?.message).toBe("create failed");
    expect(result.current.error?.cause).toBe(original);
  });

  test("surfaces an availability rejection as status='error'", async () => {
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.reject(new Error("availability boom"))),
      create: vi.fn(),
    });

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBeInstanceOf(BuiltInAIError);
    expect(result.current.error?.message).toBe("availability boom");
  });

  test("prepare() after error re-runs the chain and reaches ready on retry", async () => {
    let shouldFail = true;
    const create = vi.fn(() =>
      shouldFail
        ? Promise.reject(new Error("create failed"))
        : Promise.resolve(buildInstance({ marker: "retry" })),
    );
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("error"));

    shouldFail = false;
    setUserActivation(true);
    await result.current.prepare();

    expect(result.current.status).toBe("ready");
    expect(create).toHaveBeenCalledTimes(2);
  });

  test("acquire() resolves with { instance, signal } once ready", async () => {
    const inst = buildInstance({ marker: "live" });
    const { Fake } = makeAIFake({
      status: "available",
      buildInstance: () => inst,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const acquired = await result.current.acquire();
    expect(acquired.instance).toBe(inst);
    expect(acquired.signal).toBeInstanceOf(AbortSignal);
    expect(acquired.signal.aborted).toBe(false);
  });

  test("acquire() parked during downloading resolves to ready when create completes", async () => {
    let resolveCreate!: (value: TestInstance) => void;
    const inst = buildInstance({ marker: "park" });
    const create = vi.fn(
      () =>
        new Promise<TestInstance>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    setUserActivation(true);
    void result.current.prepare();
    await vi.waitFor(() => expect(result.current.status).toBe("downloading"));

    const pending = result.current.acquire();
    resolveCreate(inst);

    const acquired = await pending;
    expect(acquired.instance).toBe(inst);
    expect(result.current.status).toBe("ready");
  });

  test("acquire() rejects with the caller's abort reason mid-download", async () => {
    const create = vi.fn(() => new Promise<TestInstance>(() => undefined));
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    setUserActivation(true);
    // The eventual unmount aborts this prepare with "lifecycle reset" — that
    // is expected; swallow it so it doesn't surface as an unhandled rejection.
    result.current.prepare().catch(() => undefined);
    await vi.waitFor(() => expect(result.current.status).toBe("downloading"));

    const controller = new AbortController();
    const reason = new DOMException("caller bailed", "AbortError");
    const pending = result.current.acquire(controller.signal);
    controller.abort(reason);

    await expect(pending).rejects.toBe(reason);
  });

  test("acquire() throws UnsupportedError when status='unsupported'", async () => {
    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("unsupported"));

    await expect(result.current.acquire()).rejects.toBeInstanceOf(
      UnsupportedError,
    );
  });

  test("acquire() throws UnavailableError when status='unavailable'", async () => {
    const { Fake } = makeAIFake({
      status: "unavailable",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("unavailable"));

    await expect(result.current.acquire()).rejects.toBeInstanceOf(
      UnavailableError,
    );
  });

  test("acquire() throws NotReadyError carrying the original cause when status='error'", async () => {
    const original = new Error("blew up");
    const { Fake } = makeAIFake({
      status: "available",
      buildInstance,
      failCreate: original,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("error"));

    await expect(result.current.acquire()).rejects.toMatchObject({
      name: "NotReadyError",
    });
    await expect(result.current.acquire()).rejects.toBeInstanceOf(
      NotReadyError,
    );
  });

  test("destroys the instance on unmount", async () => {
    const inst = buildInstance({ marker: "doomed" });
    const { Fake } = makeAIFake({
      status: "available",
      buildInstance: () => inst,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result, unmount } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await unmount();
    expect(inst.destroy).toHaveBeenCalledTimes(1);
  });

  test("destroys an instance that resolves after unmount", async () => {
    const inst = buildInstance({ marker: "late" });
    let resolveCreate!: (value: TestInstance) => void;
    const create = vi.fn(
      () =>
        new Promise<TestInstance>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const { unmount } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));

    await unmount();
    resolveCreate(inst);

    await vi.waitFor(() => expect(inst.destroy).toHaveBeenCalledTimes(1));
  });

  test("re-creates and destroys the previous instance when options change", async () => {
    const first = buildInstance({ marker: "one" });
    const second = buildInstance({ marker: "two" });
    const queue: TestInstance[] = [first, second];
    const { Fake, create } = makeAIFake({
      status: "available",
      buildInstance: () => queue.shift()!,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result, rerender } = await renderHook(
      (props: { mode: string } = { mode: "a" }) =>
        useLifecycle<TestOptions, TestInstance>(NAMESPACE, props),
      { initialProps: { mode: "a" } },
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await rerender({ mode: "b" });
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(first.destroy).toHaveBeenCalledTimes(1));
    expect(second.destroy).not.toHaveBeenCalled();
  });

  test("does NOT re-create when a new options object is shallow-equal to the previous one", async () => {
    const { Fake, create } = makeAIFake({
      status: "available",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result, rerender } = await renderHook(
      (props: { mode: string } = { mode: "a" }) =>
        useLifecycle<TestOptions, TestInstance>(NAMESPACE, props),
      { initialProps: { mode: "a" } },
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await rerender({ mode: "a" });

    expect(create).toHaveBeenCalledTimes(1);
  });

  test("acquire() rejects with NoUserActivationError when idle without activation", async () => {
    const { Fake } = makeAIFake({
      status: "downloadable",
      buildInstance,
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    await expect(result.current.acquire()).rejects.toBeInstanceOf(
      NoUserActivationError,
    );
  });

  test("acquire() after unmount rejects with AbortError", async () => {
    const { Fake } = makeAIFake({
      status: "available",
      buildInstance: () => buildInstance({ marker: "post-unmount" }),
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result, unmount } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    // Capture before unmount — `result.current` becomes stale once the hook
    // tears down. `store.acquire` is stable so the captured ref keeps working.
    const acquire = result.current.acquire;
    await unmount();

    await expect(acquire()).rejects.toMatchObject({ name: "AbortError" });
  });

  test("StrictMode double-mount does not create or leak duplicate instances", async () => {
    const { Fake, create, instances } = makeAIFake({
      status: "available",
      buildInstance: () => buildInstance({ marker: "strict" }),
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const { result } = await renderHook(
      () => useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
      { wrapper: StrictMode },
    );

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    // The generation guard in `start`/`isCurrent` may let StrictMode's double
    // effect launch two creations; the stale one must be destroyed. We assert
    // the net live-instance count is exactly one.
    const live = instances.filter(
      (inst) => inst.destroy.mock.calls.length === 0,
    );
    expect(live).toHaveLength(1);
    expect(create.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("two concurrent prepare() during downloading share a single create call", async () => {
    let resolveCreate!: (value: TestInstance) => void;
    const create = vi.fn(
      () =>
        new Promise<TestInstance>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    const { result } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    setUserActivation(true);
    const p1 = result.current.prepare();
    const p2 = result.current.prepare();
    await vi.waitFor(() => expect(result.current.status).toBe("downloading"));

    resolveCreate(buildInstance({ marker: "shared" }));

    await p1;
    await p2;
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("ready");
  });

  test("prepare() rejects with AbortError when the hook unmounts mid-download", async () => {
    const create = vi.fn(() => new Promise<TestInstance>(() => undefined));
    vi.stubGlobal(NAMESPACE, {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    const { result, unmount } = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, undefined),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("idle"));

    setUserActivation(true);
    const pending = result.current.prepare();
    await vi.waitFor(() => expect(result.current.status).toBe("downloading"));

    await unmount();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("two hook instances with different options track lifecycle independently", async () => {
    const { Fake, create, instances } = makeAIFake({
      status: "available",
      buildInstance: () => buildInstance(),
    });
    vi.stubGlobal(NAMESPACE, Fake);

    const hookA = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, { mode: "a" }),
    );
    const hookB = await renderHook(() =>
      useLifecycle<TestOptions, TestInstance>(NAMESPACE, { mode: "b" }),
    );

    await vi.waitFor(() => expect(hookA.result.current.status).toBe("ready"));
    await vi.waitFor(() => expect(hookB.result.current.status).toBe("ready"));
    expect(create).toHaveBeenCalledTimes(2);
    expect(instances).toHaveLength(2);

    await hookA.unmount();
    expect(instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(instances[1].destroy).not.toHaveBeenCalled();
    expect(hookB.result.current.status).toBe("ready");
  });
});
