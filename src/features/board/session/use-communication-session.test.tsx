import { AppProviders } from "@shared/providers/app-providers";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { CommunicationSessionProvider } from "./communication-session-provider";
import { useCommunicationSession } from "./use-communication-session";

function SessionProviders({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <CommunicationSessionProvider>{children}</CommunicationSessionProvider>
    </AppProviders>
  );
}

async function renderSession() {
  const rendered = await renderHook(useCommunicationSession, {
    wrapper: SessionProviders,
  });
  const replace = async (text: string) => {
    const { session, message } = rendered.result.current;
    session.acceptSuggestion({ text, revision: message.revision });
    await rendered.rerender();
  };

  return { ...rendered, replace };
}

describe("communication session", () => {
  beforeEach(() => {
    stubSpeech();
    stubAudio();
  });

  test.each([
    ["I want water", ["I", "want", "water"]],
    ["How are you?", ["How", "are", "you?"]],
    ["Hello, world.", ["Hello,", "world."]],
    ["a well-being U.S.A. day", ["a", "well-being", "U.S.A.", "day"]],
  ])("accepts text and preserves punctuation: %s", async (text, labels) => {
    const { result, replace } = await renderSession();
    await replace(text);

    expect(result.current.message.parts.map((part) => part.label)).toEqual(
      labels,
    );
    expect(result.current.message.displayText).toBe(text);
  });

  test("accepting empty text clears the existing draft", async () => {
    const { result, replace } = await renderSession();
    await replace("existing");
    await replace("");
    expect(result.current.message.parts).toHaveLength(0);
  });

  test("rejects suggestions from an earlier revision even when text returns to the same value", async () => {
    const { result, replace, rerender } = await renderSession();
    await replace("hello");
    const revision = result.current.message.revision;
    await replace("changed");
    await replace("hello");
    result.current.session.acceptSuggestion({ text: "stale result", revision });
    await rerender();

    expect(result.current.message.displayText).toBe("hello");
  });

  test("gives repeated selections independent occurrence identities", async () => {
    const { result, rerender } = await renderSession();
    result.current.session.appendAndPlay({ label: "hello" });
    result.current.session.appendAndPlay({ label: "hello" });
    await rerender();
    const [first, second] = result.current.message.parts;

    expect(first.id).not.toBe(second.id);
    expect(result.current.message.displayText).toBe("hello hello");
  });

  test("a new provider starts an empty session after the previous one unmounts", async () => {
    const first = await renderSession();
    await first.replace("private draft");
    await first.unmount();
    const second = await renderSession();

    expect(second.result.current.message.parts).toHaveLength(0);
  });
});
