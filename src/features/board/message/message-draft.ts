import { type AssetKey, findAssetKey, getAssetURL } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import { parseOptionalString } from "@shared/utils/parse-optional-string";
import { reportErrorsTogether } from "@shared/utils/report-errors-together";
import { settleAll } from "@shared/utils/settle-all";
import { EMPTY_MESSAGE } from "./message-transforms";
import type { Message, MessagePart, TextPart, TilePart } from "./message-types";

// localStorage, not sessionStorage: an installed app can restart from scratch
// in the background, and a message composed ahead of time must survive that.
const STORAGE_KEY = "message-draft";

// A stored asset's URL dies with the page, so a tile part saves its asset key.
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

  const media = new Map<string, number>();
  const parts = message.parts.map((part) => toSavedPart(part, media));

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...message, parts, media: [...media.keys()] }),
    );

    return;
  } catch {
    // Embedded media can exceed the storage quota even with just one copy.
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...message, parts: message.parts.map(withoutMedia) }),
    );
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

  const media: readonly unknown[] = Array.isArray(saved.media)
    ? saved.media
    : [];
  const savedParts: SavedPart[] = [];

  for (const raw of saved.parts) {
    const part = parseSavedPart(raw, media);
    if (part) {
      savedParts.push(part);
    }
  }

  if (savedParts.length === 0) {
    return EMPTY_MESSAGE;
  }

  const assetURLByKey = await readAssetURLs(savedParts);
  const parts = savedParts.map((part) => restorePart(part, assetURLByKey));

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

function toSavedPart(part: MessagePart, media: Map<string, number>) {
  if (part.kind === "text") {
    return part;
  }

  const imageAssetKey = findAssetKeyOf(part.imageSrc);
  const soundAssetKey = findAssetKeyOf(part.soundSrc);

  return {
    ...part,
    imageSrc: imageAssetKey ? undefined : toSavedSrc(part.imageSrc, media),
    soundSrc: soundAssetKey ? undefined : toSavedSrc(part.soundSrc, media),
    imageAssetKey,
    soundAssetKey,
  };
}

function findAssetKeyOf(src: string | undefined): AssetKey | undefined {
  return src === undefined ? undefined : findAssetKey(src);
}

// An object URL with no stored asset behind it would come back broken.
function toSavedSrc(src: string | undefined, media: Map<string, number>) {
  if (!src?.startsWith("data:")) {
    return src?.startsWith("blob:") ? undefined : src;
  }

  const existing = media.get(src);
  if (existing !== undefined) {
    return existing;
  }

  const index = media.size;
  media.set(src, index);

  return index;
}

function withoutMedia(part: MessagePart): MessagePart {
  if (part.kind === "text") {
    return part;
  }

  const { kind, id, label, language, vocalization } = part;

  return { kind, id, label, language, vocalization };
}

function readSavedDraft(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseSavedPart(
  raw: unknown,
  media: readonly unknown[],
): SavedPart | undefined {
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
    imageSrc: parseSavedSrc(raw.imageSrc, media),
    soundSrc: parseSavedSrc(raw.soundSrc, media),
    imageAssetKey: parseAssetKey(raw.imageAssetKey),
    soundAssetKey: parseAssetKey(raw.soundAssetKey),
  };
}

function parseSavedSrc(value: unknown, media: readonly unknown[]) {
  return parseOptionalString(typeof value === "number" ? media[value] : value);
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

// A part keeps its words without a picture or sound that can't be read. The
// map is keyed by each part's own key object, which restorePart looks up again.
async function readAssetURLs(
  parts: readonly SavedPart[],
): Promise<Map<AssetKey, string | undefined>> {
  const { values: assetURLEntries, errors } = await settleAll(
    parts
      .flatMap(assetKeysOf)
      .map(
        async (key) =>
          [key, await getAssetURL(key.boardSetId, key.path)] as const,
      ),
  );
  reportErrorsTogether(
    errors,
    "Failed to read stored assets of the message draft",
  );

  return new Map(assetURLEntries);
}

function assetKeysOf(part: SavedPart): AssetKey[] {
  if (part.kind === "text") {
    return [];
  }

  return [part.imageAssetKey, part.soundAssetKey].filter(
    (key) => key !== undefined,
  );
}

function restorePart(
  part: SavedPart,
  assetURLByKey: ReadonlyMap<AssetKey, string | undefined>,
): MessagePart {
  if (part.kind === "text") {
    return part;
  }

  const { imageAssetKey, soundAssetKey, ...tilePart } = part;
  const imageURL = imageAssetKey && assetURLByKey.get(imageAssetKey);
  const soundURL = soundAssetKey && assetURLByKey.get(soundAssetKey);

  return {
    ...tilePart,
    imageSrc: imageURL ?? tilePart.imageSrc,
    soundSrc: soundURL ?? tilePart.soundSrc,
  };
}
