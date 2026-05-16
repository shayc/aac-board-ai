/**
 * DX smoke + type-gate proof. Compiled by `tsc` but intentionally not wired
 * into the app. Demonstrates the uniform four-member surface and that the
 * `stream` capability is gated by the type.
 */
import { useProofreader, useRewriter, useTranslator } from "./presets";

export function TranslatorExample() {
  const t = useTranslator({ sourceLanguage: "en", targetLanguage: "fr" });

  async function onClick() {
    if (t.status !== "available") {
      return;
    }
    const text = await t.run("Hello");
    for await (const chunk of t.stream("Hello again")) {
      console.log(chunk);
    }
    console.log(text);
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={t.status !== "available"}
    >
      Translate ({t.status} {Math.round(t.progress * 100)}%)
    </button>
  );
}

export function ProofreaderExample() {
  const p = useProofreader();
  const r = useRewriter({ tone: "more-casual" });

  async function onClick() {
    const result = await p.run("I has a apple");
    console.log(result.correctedInput, result.corrections.length);
    console.log(await r.run("make this casual"));

    // @ts-expect-error Proofreader cannot stream — gated at the type level.
    p.stream("nope");
  }

  return (
    <button type="button" onClick={() => void onClick()}>
      Proofread ({p.status})
    </button>
  );
}
