import {
  createContext,
  Profiler,
  use,
  type ProfilerOnRenderCallback,
  type ReactNode,
} from "react";
import type { ComponentName } from "./perf-names";
import { recordRender } from "./perf-store";

export interface PerfProfilerProps {
  id: ComponentName;
  children: ReactNode;
}

const ParentProfilerContext = createContext<ComponentName | undefined>(
  undefined,
);

export function ProfiledSubtree({ id, children }: PerfProfilerProps) {
  const parent = use(ParentProfilerContext);

  const handleRender: ProfilerOnRenderCallback = (
    _id,
    phase,
    actualDuration,
    _baseDuration,
    _startTime,
    commitTime,
  ) => {
    recordRender({ id, parent, phase, actualDuration, commitTime });
  };

  return (
    <ParentProfilerContext value={id}>
      <Profiler id={id} onRender={handleRender}>
        {children}
      </Profiler>
    </ParentProfilerContext>
  );
}
