import { type AssetKey, findAssetKey, getAssetURL } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import { EMPTY_MESSAGE } from "./message-transforms";
import type { Message, MessagePart, TextPart, TilePart } from "./message-types";

// localStorage rather than sessionStorage: an installed app can restart from
// scratch after time in the background, and a message composed ahead of time
// should still be there when the app is opened again.
const STORAGE_KEY = "message-draft";

// A stored asset's URL lasts only as long as the page, so a tile part keeps
// the asset's key in its place.
interface StoredTilePart extends TilePart {
  readonly imageAsset?: AssetKey;
  readonly soundAsset?: AssetKey;
}

type StoredPart = TextPart | StoredTilePart;

export function saveMessageDraft(message: Message): void {
  if (message.parts.length === 0) {
    removeMessageDraft();

    return;
  }

  const stored = { ...message, parts: message.parts.map(toStoredPart) };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // An older draft must not come back in place of this one.
    removeMessageDraft();
  }
}

/** Reads the saved message with its stored media ready to show. */
export async function restoreMessageDraft(): Promise<Message> {
  const stored = readStoredDraft();
  if (!isRecord(stored) || !Array.isArray(stored.parts)) {
    return EMPTY_MESSAGE;
  }

  const storedParts: StoredPart[] = [];

  for (const raw of stored.parts) {
    const part = parseStoredPart(raw);
    if (part) {
      storedParts.push(part);
    }
  }

  if (storedParts.length === 0) {
    return EMPTY_MESSAGE;
  }

  const parts = await Promise.all(storedParts.map(restorePart));

  return {
    parts,
    isWordOpen:
      parseBoolean(stored.isWordOpen, false) && parts.at(-1)?.kind === "text",
    hasPlayed: parseBoolean(stored.hasPlayed, false),
  };
}

function removeMessageDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is unavailable, so no draft is stored either.
  }
}

function toStoredPart(part: MessagePart): StoredPart {
  if (part.kind === "text") {
    return part;
  }

  const imageAsset = findMediaAssetKey(part.imageSrc);
  const soundAsset = findMediaAssetKey(part.soundSrc);

  return {
    ...part,
    imageSrc: imageAsset ? undefined : part.imageSrc,
    soundSrc: soundAsset ? undefined : part.soundSrc,
    imageAsset,
    soundAsset,
  };
}

function findMediaAssetKey(src: string | undefined): AssetKey | undefined {
  return src === undefined ? undefined : findAssetKey(src);
}

function readStoredDraft(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseStoredPart(raw: unknown): StoredPart | undefined {
  if (
    !isRecord(raw) ||
    typeof raw.id !== "string" ||
    typeof raw.label !== "string"
  ) {
    return undefined;
  }

  const { id, label } = raw;
  const language = parseOptionalString(raw.language);

  if (raw.kind === "text") {
    return { kind: "text", id, label, language };
  }

  if (raw.kind !== "tile") {
    return undefined;
  }

  return {
    kind: "tile",
    id,
    label,
    language,
    vocalization: parseOptionalString(raw.vocalization),
    imageSrc: parseOptionalString(raw.imageSrc),
    soundSrc: parseOptionalString(raw.soundSrc),
    imageAsset: parseAssetKey(raw.imageAsset),
    soundAsset: parseAssetKey(raw.soundAsset),
  };
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseAssetKey(value: unknown): AssetKey | undefined {
  if (
    !isRecord(value) ||
    typeof value.boardSetId !== "string" ||
    typeof value.path !== "string"
  ) {
    return undefined;
  }

  return { boardSetId: value.boardSetId, path: value.path };
}

async function restorePart(part: StoredPart): Promise<MessagePart> {
  if (part.kind === "text") {
    return part;
  }

  const { imageAsset, soundAsset, ...tilePart } = part;
  const [imageURL, soundURL] = await Promise.all([
    resolveAssetURL(imageAsset),
    resolveAssetURL(soundAsset),
  ]);

  return {
    ...tilePart,
    imageSrc: imageURL ?? tilePart.imageSrc,
    soundSrc: soundURL ?? tilePart.soundSrc,
  };
}

async function resolveAssetURL(
  key: AssetKey | undefined,
): Promise<string | undefined> {
  if (!key) {
    return undefined;
  }

  // Media that can't be read again leave the part with its label, which still
  // shows and is spoken.
  return getAssetURL(key.boardSetId, key.path).catch(() => undefined);
}
