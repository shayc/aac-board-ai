import { type AssetKey, findAssetKey, getAssetURL } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import { parseOptionalString } from "@shared/utils/parse-optional-string";
import { EMPTY_MESSAGE } from "./message-transforms";
import type { Message, MessagePart, TextPart, TilePart } from "./message-types";

// Use localStorage so a pre-composed message survives background app restarts.
const STORAGE_KEY = "message-draft";

// Object URLs expire with the page, so persist the storage key instead.
interface SavedTilePart extends TilePart {
  readonly imageAssetKey?: AssetKey;
  readonly soundAssetKey?: AssetKey;
}

type SavedPart = TextPart | SavedTilePart;

export function saveMessageDraft(message: Message): void {
  if (message.parts.length === 0) {
    removeMessageDraft();

    return;
  }

  const draft = { ...message, parts: message.parts.map(toSavedPart) };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // An older draft must not come back in place of this one.
    removeMessageDraft();
  }
}

/** Never rejects: the board opens whether or not the draft can be read. */
export async function restoreMessageDraft(): Promise<Message> {
  const saved = readSavedDraft();
  if (!isRecord(saved) || !Array.isArray(saved.parts)) {
    return EMPTY_MESSAGE;
  }

  const savedParts: SavedPart[] = [];

  for (const raw of saved.parts) {
    const part = parseSavedPart(raw);
    if (part) {
      savedParts.push(part);
    }
  }

  if (savedParts.length === 0) {
    return EMPTY_MESSAGE;
  }

  const parts = await Promise.all(savedParts.map(restorePart));

  return {
    parts,
    isWordOpen:
      parseBoolean(saved.isWordOpen, false) && parts.at(-1)?.kind === "text",
    hasPlayed: parseBoolean(saved.hasPlayed, false),
  };
}

function removeMessageDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is unavailable, so no draft is saved either.
  }
}

function toSavedPart(part: MessagePart): SavedPart {
  if (part.kind === "text") {
    return part;
  }

  const imageAssetKey = findAssetKeyOf(part.imageSrc);
  const soundAssetKey = findAssetKeyOf(part.soundSrc);

  return {
    ...part,
    imageSrc: imageAssetKey ? undefined : toSavedSrc(part.imageSrc),
    soundSrc: soundAssetKey ? undefined : toSavedSrc(part.soundSrc),
    imageAssetKey,
    soundAssetKey,
  };
}

function findAssetKeyOf(src: string | undefined): AssetKey | undefined {
  return src === undefined ? undefined : findAssetKey(src);
}

// Drop unbacked blob: URLs, which expire with the page.
function toSavedSrc(src: string | undefined): string | undefined {
  return src?.startsWith("blob:") ? undefined : src;
}

function readSavedDraft(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseSavedPart(raw: unknown): SavedPart | undefined {
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
    imageAssetKey: parseAssetKey(raw.imageAssetKey),
    soundAssetKey: parseAssetKey(raw.soundAssetKey),
  };
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

async function restorePart(part: SavedPart): Promise<MessagePart> {
  if (part.kind === "text") {
    return part;
  }

  const { imageAssetKey, soundAssetKey, ...tilePart } = part;
  const [imageURL, soundURL] = await Promise.all([
    resolveAssetURL(imageAssetKey),
    resolveAssetURL(soundAssetKey),
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

  return getAssetURL(key.boardSetId, key.path).catch(() => undefined);
}
