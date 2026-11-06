import type { Locator, Page } from "@playwright/test";
import type { SpanName } from "../src/perf/perf-names.ts";

export interface App {
  page: Page;
  goto: (path?: string) => Promise<void>;
  press: (target: Locator) => Promise<void>;
  type: (text: string) => Promise<void>;
}

export interface Flow {
  title: string;
  span: SpanName;
  kind: "load" | "interaction";
  isFirstVisit?: boolean;
  isolateRuns?: boolean;
  setup?: (app: App) => Promise<void>;
  run: (app: App) => Promise<void>;
}

export function defineFlow(flow: Flow): Flow {
  return flow;
}

export function createApp(page: Page, origin: string): App {
  return {
    page,
    goto: async (path = "/") => {
      await page.goto(new URL(path, origin).href);
    },
    press: async (target) => {
      const element = await target.elementHandle();
      await element?.scrollIntoViewIfNeeded();
      await element?.waitForElementState("stable");
      await element?.waitForElementState("enabled");
      const box = await element?.boundingBox();
      if (!box) {
        throw new Error(`No bounding box for ${target.toString()}`);
      }

      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    },
    type: async (text) => {
      await page.keyboard.type(text);
    },
  };
}
