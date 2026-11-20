import { type AssetKey, findAssetKey, getAssetURL } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import { parseOptionalString } from "@shared/utils/parse-optional-string";
import { reportErrorsTogether } from "@shared/utils/report-errors-together";
import { settleAll } from "@shared/utils/settle-all";
import { EMPTY_MESSAGE } from "./message-transforms";
import type { Message, MessagePart, TextPart, TilePart } from "./message-types";

// localStorage, not sessionStorage: an installed app can restart in the
// background, and the draft must survive it.
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

  const savedParts = saved.parts
    .map(parseSavedPart)
    .filter((part) => part !== undefined);
  if (savedParts.length === 0) {
    return EMPTY_MESSAGE;
  }

  const assetURLByKey = await readAssetURLs(savedParts);
  const parts = savedParts.map((part) => fromSavedPart(part, assetURLByKey));

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

// A blob: URL dies with the page; restoring it would show a broken image.
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

// An asset that fails to load is skipped; its part keeps the label.
// Keyed by object identity: fromSavedPart looks up the same key objects.
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

function fromSavedPart(
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
