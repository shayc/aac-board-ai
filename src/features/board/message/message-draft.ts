import { type AssetKey, findAssetKey, getAssetURL } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import { EMPTY_MESSAGE } from "./message-transforms";
import type { Message, MessagePart, TilePart } from "./message-types";

// localStorage rather than sessionStorage: an installed app can restart from
// scratch after time in the background, and a message composed ahead of time
// should still be there when the app is opened again.
const STORAGE_KEY = "message-draft";

/** The stored media of a restored tile part, whose URLs need creating again. */
export interface PartAssets {
  readonly image?: AssetKey;
  readonly sound?: AssetKey;
}

export interface MessageDraft {
  /** The message as it can show right away, before its stored media resolve. */
  readonly message: Message;
  readonly assetsByPartId: ReadonlyMap<string, PartAssets>;
}

export interface PartMedia {
  readonly imageSrc?: string;
  readonly soundSrc?: string;
}

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

export function readMessageDraft(): MessageDraft {
  const assetsByPartId = new Map<string, PartAssets>();
  const stored = readStoredDraft();
  if (!isRecord(stored) || !Array.isArray(stored.parts)) {
    return { message: EMPTY_MESSAGE, assetsByPartId };
  }

  const parts: MessagePart[] = [];

  for (const raw of stored.parts) {
    const parsed = parseStoredPart(raw);
    if (!parsed) {
      continue;
    }

    parts.push(parsed.part);
    if (parsed.assets) {
      assetsByPartId.set(parsed.part.id, parsed.assets);
    }
  }

  if (parts.length === 0) {
    return { message: EMPTY_MESSAGE, assetsByPartId };
  }

  const message: Message = {
    parts,
    isWordOpen:
      parseBoolean(stored.isWordOpen, false) && parts.at(-1)?.kind === "text",
    hasPlayed: parseBoolean(stored.hasPlayed, false),
  };

  return { message, assetsByPartId };
}

export async function resolveDraftAssets(
  assetsByPartId: ReadonlyMap<string, PartAssets>,
): Promise<ReadonlyMap<string, PartMedia>> {
  const entries = await Promise.all(
    [...assetsByPartId].map(
      async ([partId, { image, sound }]) =>
        [
          partId,
          {
            imageSrc: await resolveAssetURL(image),
            soundSrc: await resolveAssetURL(sound),
          },
        ] as const,
    ),
  );

  return new Map(entries);
}

export function withPartMedia(
  message: Message,
  mediaByPartId: ReadonlyMap<string, PartMedia>,
): Message {
  const parts = message.parts.map((part) => {
    const media = mediaByPartId.get(part.id);

    return part.kind === "tile" && media ? { ...part, ...media } : part;
  });

  return { ...message, parts };
}

function removeMessageDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is unavailable, so no draft is stored either.
  }
}

// A stored asset's URL lasts only as long as the page, so a tile part keeps
// the asset's key in its place.
interface StoredTilePart extends TilePart {
  readonly imageAsset?: AssetKey;
  readonly soundAsset?: AssetKey;
}

function toStoredPart(part: MessagePart): MessagePart | StoredTilePart {
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

interface ParsedPart {
  part: MessagePart;
  assets?: PartAssets;
}

function parseStoredPart(raw: unknown): ParsedPart | undefined {
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
    return { part: { kind: "text", id, label, language } };
  }

  if (raw.kind !== "tile") {
    return undefined;
  }

  const part: TilePart = {
    kind: "tile",
    id,
    label,
    language,
    vocalization: parseOptionalString(raw.vocalization),
    imageSrc: parseOptionalString(raw.imageSrc),
    soundSrc: parseOptionalString(raw.soundSrc),
  };
  const image = parseAssetKey(raw.imageAsset);
  const sound = parseAssetKey(raw.soundAsset);
  const assets = image || sound ? { image, sound } : undefined;

  return { part, assets };
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
