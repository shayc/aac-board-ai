import {
  type AssetKey,
  type Board,
  type BoardButton,
  type BoardKey,
  BoardNotFoundError,
  findAssetKey,
  getAssetURL,
  loadStoredBoard,
} from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import { parseOptionalString } from "@shared/utils/parse-optional-string";
import { reportErrorsTogether } from "@shared/utils/report-errors-together";
import { settleAll } from "@shared/utils/settle-all";
import { EMPTY_MESSAGE } from "./message-transforms";
import type {
  ButtonKey,
  Message,
  MessagePart,
  TextPart,
  TilePart,
} from "./message-types";

// localStorage, not sessionStorage: an installed app can restart from scratch
// in the background, and a message composed ahead of time must survive that.
const STORAGE_KEY = "message-draft";

// A stored asset's URL dies with the page, so a tile part saves its asset key.
// Embedded media is too large to save, so it is read back from the part's source.
interface SavedTilePart extends TilePart {
  readonly imageAssetKey?: AssetKey;
  readonly soundAssetKey?: AssetKey;
}

type SavedPart = TextPart | SavedTilePart;

interface SavedDraft extends Omit<Message, "parts"> {
  readonly parts: readonly SavedPart[];
}

export function saveMessageDraft(message: Message): void {
  if (message.parts.length === 0) {
    removeMessageDraft();

    return;
  }

  const parts = message.parts.map(toSavedPart);
  if (trySaveDraft({ ...message, parts })) {
    return;
  }

  // Only a linked URL can be long; keys to stored media stay.
  const compactParts = parts.map(withoutLinkedMedia);
  if (!trySaveDraft({ ...message, parts: compactParts })) {
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

  const [assetURLByKey, sourceBoardByPath] = await Promise.all([
    readAssetURLs(savedParts),
    readSourceBoards(savedParts),
  ]);
  const parts = savedParts.map((part) =>
    restorePart(part, assetURLByKey, sourceBoardByPath),
  );

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
    // Reading a source costs a board load, so only embedded media saves it.
    source:
      isEmbedded(part.imageSrc) || isEmbedded(part.soundSrc)
        ? part.source
        : undefined,
    imageAssetKey,
    soundAssetKey,
  };
}

function findAssetKeyOf(src: string | undefined): AssetKey | undefined {
  return src === undefined ? undefined : findAssetKey(src);
}

// An object URL with no stored asset behind it would come back broken.
function toSavedSrc(src: string | undefined): string | undefined {
  return src === undefined || isEmbedded(src) || /^blob:/i.test(src)
    ? undefined
    : src;
}

// A URL's scheme is case-insensitive.
function isEmbedded(src: string | undefined): boolean {
  return src !== undefined && /^data:/i.test(src);
}

function trySaveDraft(draft: SavedDraft): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

    return true;
  } catch {
    return false;
  }
}

function withoutLinkedMedia(part: SavedPart): SavedPart {
  if (part.kind === "text") {
    return part;
  }

  return { ...part, imageSrc: undefined, soundSrc: undefined };
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
    source: parseButtonKey(raw.source),
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

function parseButtonKey(value: unknown): ButtonKey | undefined {
  if (
    !isRecord(value) ||
    typeof value.boardSetId !== "string" ||
    typeof value.boardId !== "string" ||
    typeof value.buttonId !== "string"
  ) {
    return undefined;
  }

  return {
    boardSetId: value.boardSetId,
    boardId: value.boardId,
    buttonId: value.buttonId,
  };
}

function assetKeysOf(part: SavedPart): AssetKey[] {
  if (part.kind === "text") {
    return [];
  }

  return [part.imageAssetKey, part.soundAssetKey].filter(
    (key) => key !== undefined,
  );
}

// A part keeps its words when its source board is gone or can't be read.
async function readSourceBoards(
  parts: readonly SavedPart[],
): Promise<Map<string, Board | undefined>> {
  const boardKeyByPath = new Map<string, BoardKey>();

  for (const part of parts) {
    if (part.kind === "tile" && part.source) {
      boardKeyByPath.set(sourceBoardPath(part.source), part.source);
    }
  }

  const { values: boardEntries, errors } = await settleAll(
    Array.from(
      boardKeyByPath,
      async ([path, key]) => [path, await loadSourceBoard(key)] as const,
    ),
  );
  reportErrorsTogether(
    errors,
    "Failed to read source boards of the message draft",
  );

  return new Map(boardEntries);
}

function sourceBoardPath({ boardSetId, boardId }: BoardKey): string {
  return JSON.stringify([boardSetId, boardId]);
}

async function loadSourceBoard(key: BoardKey): Promise<Board | undefined> {
  try {
    return await loadStoredBoard(key);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      return undefined;
    }

    throw error;
  }
}

function restorePart(
  part: SavedPart,
  assetURLByKey: ReadonlyMap<AssetKey, string | undefined>,
  sourceBoardByPath: ReadonlyMap<string, Board | undefined>,
): MessagePart {
  if (part.kind === "text") {
    return part;
  }

  const { imageAssetKey, soundAssetKey, ...tilePart } = part;
  const imageURL = imageAssetKey && assetURLByKey.get(imageAssetKey);
  const soundURL = soundAssetKey && assetURLByKey.get(soundAssetKey);
  const sourceButton = findSourceButton(tilePart.source, sourceBoardByPath);

  return {
    ...tilePart,
    imageSrc: imageURL ?? tilePart.imageSrc ?? sourceButton?.imageSrc,
    soundSrc: soundURL ?? tilePart.soundSrc ?? sourceButton?.soundSrc,
  };
}

function findSourceButton(
  source: ButtonKey | undefined,
  sourceBoardByPath: ReadonlyMap<string, Board | undefined>,
): BoardButton | undefined {
  if (!source) {
    return undefined;
  }

  return sourceBoardByPath
    .get(sourceBoardPath(source))
    ?.buttons.find((button) => button.id === source.buttonId);
}
