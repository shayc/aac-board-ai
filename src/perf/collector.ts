import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type CLSMetricWithAttribution,
  type FCPMetricWithAttribution,
  type INPMetricWithAttribution,
  type LCPMetricWithAttribution,
  type MetricWithAttribution,
  type TTFBMetricWithAttribution,
} from "web-vitals/attribution";
import type { VitalRecord } from "./perf-snapshot";
import {
  beginWindow,
  recordInteraction,
  recordLayoutShift,
  recordLongAnimationFrame,
  recordResource,
  recordSoftNavigation,
  recordVital,
  takeSnapshot,
  waitForSpan,
} from "./perf-store";
import { describeElement, routeOf, sanitizeURL } from "./sanitize";

const EVENT_DURATION_THRESHOLD_MS = 16;
const RESOURCE_BUFFER_SIZE = 2000;

type Attribution = VitalRecord["attribution"];

interface Observation {
  observer: PerformanceObserver;
  handleEntries: (entries: PerformanceEntryList) => void;
}

const observations: Observation[] = [];

function observe<T extends PerformanceEntry>(
  type: string,
  handleEntry: (entry: T) => void,
  options: PerformanceObserverInit = {},
): void {
  if (!PerformanceObserver.supportedEntryTypes.includes(type)) {
    return;
  }

  const handleEntries = (entries: PerformanceEntryList) => {
    for (const entry of entries) {
      handleEntry(entry as T);
    }
  };
  const observer = new PerformanceObserver((list) =>
    handleEntries(list.getEntries()),
  );
  observer.observe({ type, buffered: true, ...options });
  observations.push({ observer, handleEntries });
}

function flushObservers(): void {
  for (const { observer, handleEntries } of observations) {
    handleEntries(observer.takeRecords());
  }
}

function handleEventTiming(entry: PerformanceEventTiming): void {
  if (!entry.interactionId) {
    return;
  }

  recordInteraction({
    interactionId: entry.interactionId,
    type: entry.name,
    target: describeElement(entry.target),
    startTime: entry.startTime,
    duration: entry.duration,
    inputDelay: entry.processingStart - entry.startTime,
    processingDuration: entry.processingEnd - entry.processingStart,
    presentationDelay: Math.max(
      0,
      entry.startTime + entry.duration - entry.processingEnd,
    ),
  });
}

function handleLongAnimationFrame(
  entry: PerformanceLongAnimationFrameTiming,
): void {
  recordLongAnimationFrame({
    startTime: entry.startTime,
    duration: entry.duration,
    blockingDuration: entry.blockingDuration,
    renderStart: entry.renderStart,
    styleAndLayoutStart: entry.styleAndLayoutStart,
    scripts: entry.scripts.map((script) => ({
      invoker: sanitizeInvoker(script.invoker),
      invokerType: script.invokerType,
      sourceURL: sanitizeURL(script.sourceURL),
      sourceFunctionName: script.sourceFunctionName,
      sourceCharPosition: script.sourceCharPosition,
      startTime: script.startTime,
      duration: script.duration,
      forcedStyleAndLayoutDuration: script.forcedStyleAndLayoutDuration,
    })),
  });
}

function sanitizeInvoker(invoker: string): string {
  return /^https?:|^blob:/.test(invoker)
    ? sanitizeURL(invoker)
    : invoker.replace(/#[^.\s]+/g, "");
}

function handleResource(entry: PerformanceResourceTiming): void {
  recordResource({
    url: sanitizeURL(entry.name),
    initiatorType: entry.initiatorType,
    startTime: entry.startTime,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
  });
}

function handleLayoutShift(entry: LayoutShift): void {
  recordLayoutShift({
    startTime: entry.startTime,
    value: entry.value,
    hadRecentInput: entry.hadRecentInput,
  });
}

function handleSoftNavigation(entry: PerformanceSoftNavigation): void {
  recordSoftNavigation({
    route: sanitizeURL(entry.name),
    navigationId: entry.navigationId ?? 0,
    startTime: entry.startTime,
    duration: entry.duration,
  });
}

function lcpAttribution({
  attribution,
}: LCPMetricWithAttribution): Attribution {
  return {
    target: attribution.target,
    url: sanitizeURL(attribution.url),
    timeToFirstByte: attribution.timeToFirstByte,
    resourceLoadDelay: attribution.resourceLoadDelay,
    resourceLoadDuration: attribution.resourceLoadDuration,
    elementRenderDelay: attribution.elementRenderDelay,
  };
}

function inpAttribution({
  attribution,
}: INPMetricWithAttribution): Attribution {
  const longestScript = attribution.longestScript;

  return {
    interactionTarget: attribution.interactionTarget,
    interactionType: attribution.interactionType,
    interactionTime: attribution.interactionTime,
    inputDelay: attribution.inputDelay,
    processingDuration: attribution.processingDuration,
    presentationDelay: attribution.presentationDelay,
    longestScriptURL: sanitizeURL(longestScript?.entry.sourceURL),
    longestScriptFunction: longestScript?.entry.sourceFunctionName,
    longestScriptCharPosition: longestScript?.entry.sourceCharPosition,
    longestScriptSubpart: longestScript?.subpart,
    longestScriptDuration: longestScript?.intersectingDuration,
    totalScriptDuration: attribution.totalScriptDuration,
    totalStyleAndLayoutDuration: attribution.totalStyleAndLayoutDuration,
    totalPaintDuration: attribution.totalPaintDuration,
  };
}

function clsAttribution({
  attribution,
}: CLSMetricWithAttribution): Attribution {
  return {
    largestShiftTarget: attribution.largestShiftTarget,
    largestShiftValue: attribution.largestShiftValue,
    largestShiftTime: attribution.largestShiftTime,
    loadState: attribution.loadState,
  };
}

function fcpAttribution({
  attribution,
}: FCPMetricWithAttribution): Attribution {
  return {
    timeToFirstByte: attribution.timeToFirstByte,
    firstByteToFCP: attribution.firstByteToFCP,
    loadState: attribution.loadState,
  };
}

function ttfbAttribution({
  attribution,
}: TTFBMetricWithAttribution): Attribution {
  return {
    waitingDuration: attribution.waitingDuration,
    cacheDuration: attribution.cacheDuration,
    dnsDuration: attribution.dnsDuration,
    connectionDuration: attribution.connectionDuration,
    requestDuration: attribution.requestDuration,
  };
}

function vitalRecorder<T extends MetricWithAttribution>(
  describeAttribution: (metric: T) => Attribution,
): (metric: T) => void {
  return (metric) => {
    recordVital({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      navigationId: metric.navigationId,
      navigationStartTime: metric.navigationStartTime ?? 0,
      route: routeOf(
        new URL(metric.navigationURL ?? "/", location.href).pathname,
      ),
      attribution: describeAttribution(metric),
    });
  };
}

function observeWebVitals(): void {
  const options = { reportAllChanges: true, reportSoftNavs: true };

  onTTFB(vitalRecorder(ttfbAttribution), options);
  onFCP(vitalRecorder(fcpAttribution), options);
  onLCP(vitalRecorder(lcpAttribution), options);
  onCLS(vitalRecorder(clsAttribution), options);
  onINP(vitalRecorder(inpAttribution), {
    ...options,
    durationThreshold: EVENT_DURATION_THRESHOLD_MS,
  });
}

function afterFrames(count: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  const step = (remaining: number) => {
    if (remaining === 0) {
      resolve();
      return;
    }
    requestAnimationFrame(() => setTimeout(() => step(remaining - 1), 0));
  };
  step(count);

  return promise;
}

async function settle(): Promise<void> {
  const pendingImages = Array.from(document.images)
    .filter((image) => !image.complete)
    .map((image) => image.decode().catch(() => undefined));

  await Promise.all(pendingImages);
  await afterFrames(2);
}

export function startCollector(): void {
  performance.setResourceTimingBufferSize(RESOURCE_BUFFER_SIZE);

  observe("event", handleEventTiming, {
    durationThreshold: EVENT_DURATION_THRESHOLD_MS,
  });
  observe("long-animation-frame", handleLongAnimationFrame);
  observe("resource", handleResource);
  observe("layout-shift", handleLayoutShift);
  observe("soft-navigation", handleSoftNavigation);
  observeWebVitals();

  window.__perf = {
    beginWindow: () => {
      flushObservers();
      return beginWindow();
    },
    waitForSpan,
    settle,
    snapshot: () => {
      flushObservers();
      return takeSnapshot();
    },
  };
}
