export interface SpokenPart {
  id: string;
  text: string;
}

export interface PartTracker {
  text: string;
  partIdAt: (charIndex: number) => string | null;
}

interface PartSpan {
  id: string;
  start: number;
  end: number;
}

export function createPartTracker(parts: SpokenPart[]): PartTracker {
  const chunks: string[] = [];
  const spans: PartSpan[] = [];

  let offset = 0;
  for (const part of parts) {
    const chunk = part.text.trim().replace(/\s+/g, " ");
    chunks.push(chunk);
    spans.push({ id: part.id, start: offset, end: offset + chunk.length });
    offset += chunk.length + 1;
  }

  const text = chunks.join(" ");

  return {
    text,
    partIdAt: (charIndex) =>
      spans.find((span) => charIndex >= span.start && charIndex < span.end)
        ?.id ?? null,
  };
}
