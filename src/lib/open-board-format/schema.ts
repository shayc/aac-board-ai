/**
 * Open Board Format (OBF) Zod Schemas
 *
 * These schemas represent the Open Board Format, designed for sharing communication boards and board sets
 * between Augmentative and Alternative Communication (AAC) applications.
 *
 * Official OBF specification: https://www.openboardformat.org/docs
 *
 * @author Shay Cojocaru
 * @license MIT
 */

import { z } from "zod";

/** Unique identifier as a string. */
export const IDSchema = z.coerce.string();
export type ID = z.infer<typeof IDSchema>;

/**
 * Format version of the Open Board Format, e.g., 'open-board-0.1'.
 */
export const FormatVersionSchema = z.string().regex(/^open-board-.+$/);
export type FormatVersion = z.infer<typeof FormatVersionSchema>;

/**
 * Custom extension properties. Keys must start with 'ext_'.
 *
 * Note: We intersect this with object schemas to allow only `ext_*` passthrough keys.
 */
export const ExtensionsSchema = z.record(
  z.string().regex(/^ext_.+/),
  z.unknown()
);
export type Extensions = z.infer<typeof ExtensionsSchema>;

/**
 * Locale code as per BCP 47 language tags, e.g., 'en', 'en-US', 'fr-CA'.
 */
export const LocaleCodeSchema = z.string();
export type LocaleCode = z.infer<typeof LocaleCodeSchema>;

/**
 * Mapping of string keys to localized string values.
 */
export const LocalizedStringsSchema = z.record(z.string(), z.string());
export type LocalizedStrings = z.infer<typeof LocalizedStringsSchema>;

/**
 * String translations for multiple locales.
 */
export const StringsSchema = z.record(z.string(), LocalizedStringsSchema);
export type Strings = z.infer<typeof StringsSchema>;

/**
 * Represents custom actions for spelling.
 * Prefixed with '+' followed by the text to append.
 */
export const SpellingActionSchema = z.string().regex(/^\+.+$/);
export type SpellingAction = z.infer<typeof SpellingActionSchema>;

/**
 * Represents specialty actions.
 * Standard actions are prefixed with ':'.
 * Custom actions start with ':ext_'.
 */
export const SpecialtyActionSchema = z.union([
  z.enum([":space", ":clear", ":home", ":speak", ":backspace"]),
  z.string().regex(/^:ext_.+$/),
]);
export type SpecialtyAction = z.infer<typeof SpecialtyActionSchema>;

/**
 * Possible actions associated with a button.
 */
export const ButtonActionSchema = z.union([
  SpellingActionSchema,
  SpecialtyActionSchema,
]);
export type ButtonAction = z.infer<typeof ButtonActionSchema>;

/**
 * Licensing information for a resource.
 */
export const LicenseSchema = z
  .object({
    /** Type of the license, e.g., 'CC-BY-SA'. */
    type: z.string(),
    /** URL to the license terms. */
    copyright_notice_url: z.url().optional(),
    /** Source URL of the resource. */
    source_url: z.url().optional(),
    /** Name of the author. */
    author_name: z.string().optional(),
    /** URL of the author's webpage. */
    author_url: z.url().optional(),
    /** Email address of the author. */
    author_email: z.email().optional(),
  })
  .and(ExtensionsSchema);
export type License = z.infer<typeof LicenseSchema>;

/**
 * Common properties for media resources (images and sounds).
 *
 * When multiple references are provided, they should be used in the following order:
 * 1. data
 * 2. path
 * 3. url
 */
export const MediaSchema = z
  .object({
    /** Unique identifier for the media resource. */
    id: IDSchema,
    /** Data URI containing the media data. */
    data: z.string().optional(),
    /** Path to the media file within an .obz package. */
    path: z.string().optional(),
    /** Data URL to fetch the media programmatically. */
    data_url: z.url().optional(),
    /** URL to the media resource. */
    url: z.url().optional(),
    /** MIME type of the media, e.g., 'image/png', 'audio/mpeg'. */
    content_type: z.string().optional(),
    /** Licensing information for the media. */
    license: LicenseSchema.optional(),
  })
  .and(ExtensionsSchema);
export type Media = z.infer<typeof MediaSchema>;

/**
 * Information about a symbol from a proprietary symbol set.
 */
export const SymbolInfoSchema = z.object({
  /** Name of the symbol set, e.g., 'symbolstix'. */
  set: z.string(),
  /** Filename of the symbol within the set. */
  filename: z.string(),
});
export type SymbolInfo = z.infer<typeof SymbolInfoSchema>;

/**
 * Represents an image resource.
 *
 * When resolving the image, if multiple references are provided, they should be used in the following order:
 * 1. data
 * 2. path
 * 3. url
 * 4. symbol
 */
export const ImageSchema = MediaSchema.and(
  z.object({
    /** Information about a symbol from a proprietary symbol set. */
    symbol: SymbolInfoSchema.optional(),
    /** Width of the image in pixels. */
    width: z.number().optional(),
    /** Height of the image in pixels. */
    height: z.number().optional(),
  })
);
export type Image = z.infer<typeof ImageSchema>;

/**
 * Represents a sound resource.
 */
export const SoundSchema = MediaSchema; // No additional properties.
export type Sound = z.infer<typeof SoundSchema>;

/**
 * Information needed to load another board.
 */
export const LoadBoardSchema = z
  .object({
    /** Unique identifier of the board to load. */
    id: IDSchema.optional(),
    /** Name of the board to load. */
    name: z.string().optional(),
    /** Data URL to fetch the board programmatically. */
    data_url: z.url().optional(),
    /** URL to access the board via a web browser. */
    url: z.url().optional(),
    /** Path to the board within an .obz package. */
    path: z.string().optional(),
  })
  .and(ExtensionsSchema);
export type LoadBoard = z.infer<typeof LoadBoardSchema>;

/**
 * Represents a button on the board.
 */
export const ButtonSchema = z
  .object({
    /** Unique identifier for the button. */
    id: IDSchema,
    /** Label text displayed on the button. */
    label: z.string().optional(),
    /** Alternative text for vocalization when the button is activated. */
    vocalization: z.string().optional(),
    /** Identifier of the image associated with the button. */
    image_id: IDSchema.optional(),
    /** Identifier of the sound associated with the button. */
    sound_id: IDSchema.optional(),
    /** Action associated with the button. */
    action: ButtonActionSchema.optional(),
    /** List of multiple actions for the button, executed in order. */
    actions: z.array(ButtonActionSchema).optional(),
    /** Information to load another board when this button is activated. */
    load_board: LoadBoardSchema.optional(),
    /** Background color of the button in 'rgb' or 'rgba' format. */
    background_color: z.string().optional(),
    /** Border color of the button in 'rgb' or 'rgba' format. */
    border_color: z.string().optional(),
    /** Vertical position for absolute positioning (0.0 to 1.0). */
    top: z.number().min(0).max(1).optional(),
    /** Horizontal position for absolute positioning (0.0 to 1.0). */
    left: z.number().min(0).max(1).optional(),
    /** Width of the button for absolute positioning (0.0 to 1.0). */
    width: z.number().min(0).max(1).optional(),
    /** Height of the button for absolute positioning (0.0 to 1.0). */
    height: z.number().min(0).max(1).optional(),
  })
  .and(ExtensionsSchema);
export type Button = z.infer<typeof ButtonSchema>;

/**
 * Grid layout information for the board.
 */
export const GridSchema = z.object({
  /** Number of rows in the grid. */
  rows: z.number().int().min(1),
  /** Number of columns in the grid. */
  columns: z.number().int().min(1),
  /**
   * 2D array representing the order of buttons by their IDs.
   * Each sub-array corresponds to a row, and each element is a button ID or null for empty slots.
   */
  order: z.array(z.array(z.union([IDSchema, z.null()]))),
});
export type Grid = z.infer<typeof GridSchema>;

/**
 * Represents the root object of an OBF file, defining the structure and layout of a board.
 */
export const BoardSchema = z
  .object({
    /** Format version of the Open Board Format, e.g., 'open-board-0.1'. */
    format: FormatVersionSchema,
    /** Unique identifier for the board. */
    id: IDSchema,
    /** Locale of the board as a BCP 47 language tag, e.g., 'en', 'en-US'. */
    locale: LocaleCodeSchema.optional(),
    /** List of buttons on the board. */
    buttons: z.array(ButtonSchema),
    /** URL where the board can be accessed or downloaded. */
    url: z.url().optional(),
    /** Name of the board. */
    name: z.string().optional(),
    /** Description of the board in HTML format. */
    description_html: z.string().optional(),
    /** Grid layout information for arranging buttons. */
    grid: GridSchema,
    /** List of images used in the board. */
    images: z.array(ImageSchema).optional(),
    /** List of sounds used in the board. */
    sounds: z.array(SoundSchema).optional(),
    /** Licensing information for the board. */
    license: LicenseSchema.optional(),
    /** String translations for multiple locales. */
    strings: StringsSchema.optional(),
  })
  .and(ExtensionsSchema);
export type Board = z.infer<typeof BoardSchema>;

/**
 * Manifest file in an .obz package.
 */
export const ManifestSchema = z.object({
  /** Format version of the Open Board Format, e.g., 'open-board-0.1'. */
  format: FormatVersionSchema,
  /** Path to the root board within the .obz package. */
  root: z.string(),
  /** Mapping of IDs to paths for boards, images, and sounds. */
  paths: z.object({
    /** Mapping of board IDs to their file paths. */
    boards: z.record(z.string(), z.string()),
    /** Mapping of image IDs to their file paths. */
    images: z.record(z.string(), z.string()),
    /** Mapping of sound IDs to their file paths. */
    sounds: z.record(z.string(), z.string()),
  }),
});
export type Manifest = z.infer<typeof ManifestSchema>;
