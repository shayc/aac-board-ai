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
export const OBFIDSchema = z.coerce.string();
export type OBFID = z.infer<typeof OBFIDSchema>;

/**
 * Format version of the Open Board Format, e.g., 'open-board-0.1'.
 */
export const OBFFormatVersionSchema = z.string().regex(/^open-board-.+$/);
export type OBFFormatVersion = z.infer<typeof OBFFormatVersionSchema>;

/**
 * Locale code as per BCP 47 language tags, e.g., 'en', 'en-US', 'fr-CA'.
 */
export const OBFLocaleCodeSchema = z.string();
export type OBFLocaleCode = z.infer<typeof OBFLocaleCodeSchema>;

/**
 * Mapping of string keys to localized string values.
 */
export const OBFLocalizedStringsSchema = z.record(z.string(), z.string());
export type OBFLocalizedStrings = z.infer<typeof OBFLocalizedStringsSchema>;

/**
 * String translations for multiple locales.
 */
export const OBFStringsSchema = z.record(z.string(), OBFLocalizedStringsSchema);
export type OBFStrings = z.infer<typeof OBFStringsSchema>;

/**
 * Represents custom actions for spelling.
 * Prefixed with '+' followed by the text to append.
 */
export const OBFSpellingActionSchema = z.string();
export type OBFSpellingAction = z.infer<typeof OBFSpellingActionSchema>;

/**
 * Represents specialty actions.
 * Standard actions are prefixed with ':'.
 * Custom actions start with ':ext_'.
 */
export const OBFSpecialtyActionSchema = z.enum([
  ":space",
  ":clear",
  ":home",
  ":speak",
  ":backspace",
]);
export type OBFSpecialtyAction = z.infer<typeof OBFSpecialtyActionSchema>;

/**
 * Possible actions associated with a button.
 */
export const OBFButtonActionSchema = z.union([
  OBFSpellingActionSchema,
  OBFSpecialtyActionSchema,
]);
export type OBFButtonAction = z.infer<typeof OBFButtonActionSchema>;

/**
 * Licensing information for a resource.
 */
export const OBFLicenseSchema = z.object({
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
});

export type OBFLicense = z.infer<typeof OBFLicenseSchema>;

/**
 * Common properties for media resources (images and sounds).
 *
 * When multiple references are provided, they should be used in the following order:
 * 1. data
 * 2. path
 * 3. url
 */
export const OBFMediaSchema = z.object({
  /** Unique identifier for the media resource. */
  id: OBFIDSchema,
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
  license: OBFLicenseSchema.optional(),
});

export type OBFMedia = z.infer<typeof OBFMediaSchema>;

/**
 * Information about a symbol from a proprietary symbol set.
 */
export const OBFSymbolInfoSchema = z.object({
  /** Name of the symbol set, e.g., 'symbolstix'. */
  set: z.string(),
  /** Filename of the symbol within the set. */
  filename: z.string(),
});
export type OBFSymbolInfo = z.infer<typeof OBFSymbolInfoSchema>;

/**
 * Represents an image resource.
 *
 * When resolving the image, if multiple references are provided, they should be used in the following order:
 * 1. data
 * 2. path
 * 3. url
 * 4. symbol
 */
export const OBFImageSchema = OBFMediaSchema.and(
  z.object({
    /** Information about a symbol from a proprietary symbol set. */
    symbol: OBFSymbolInfoSchema.optional(),
    /** Width of the image in pixels. */
    width: z.number().optional(),
    /** Height of the image in pixels. */
    height: z.number().optional(),
  })
);
export type OBFImage = z.infer<typeof OBFImageSchema>;

/**
 * Represents a sound resource.
 */
export const OBFSoundSchema = OBFMediaSchema; // No additional properties.
export type OBFSound = z.infer<typeof OBFSoundSchema>;

/**
 * Information needed to load another board.
 */
export const OBFLoadBoardSchema = z.object({
  /** Unique identifier of the board to load. */
  id: OBFIDSchema.optional(),
  /** Name of the board to load. */
  name: z.string().optional(),
  /** Data URL to fetch the board programmatically. */
  data_url: z.url().optional(),
  /** URL to access the board via a web browser. */
  url: z.url().optional(),
  /** Path to the board within an .obz package. */
  path: z.string().optional(),
});

export type OBFLoadBoard = z.infer<typeof OBFLoadBoardSchema>;

/**
 * Represents a button on the board.
 */
export const OBFButtonSchema = z.object({
  /** Unique identifier for the button. */
  id: OBFIDSchema,
  /** Label text displayed on the button. */
  label: z.string().optional(),
  /** Alternative text for vocalization when the button is activated. */
  vocalization: z.string().optional(),
  /** Identifier of the image associated with the button. */
  image_id: OBFIDSchema.optional(),
  /** Identifier of the sound associated with the button. */
  sound_id: OBFIDSchema.optional(),
  /** Action associated with the button. */
  action: OBFButtonActionSchema.optional(),
  /** List of multiple actions for the button, executed in order. */
  actions: z.array(OBFButtonActionSchema).optional(),
  /** Information to load another board when this button is activated. */
  load_board: OBFLoadBoardSchema.optional(),
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
});

export type OBFButton = z.infer<typeof OBFButtonSchema>;

/**
 * Grid layout information for the board.
 */
export const OBFGridSchema = z.object({
  /** Number of rows in the grid. */
  rows: z.number().int().min(1),
  /** Number of columns in the grid. */
  columns: z.number().int().min(1),
  /**
   * 2D array representing the order of buttons by their IDs.
   * Each sub-array corresponds to a row, and each element is a button ID or null for empty slots.
   */
  order: z.array(z.array(z.union([OBFIDSchema, z.null()]))),
});
export type OBFGrid = z.infer<typeof OBFGridSchema>;

/**
 * Represents the root object of an OBF file, defining the structure and layout of a board.
 */
export const OBFBoardSchema = z.object({
  /** Format version of the Open Board Format, e.g., 'open-board-0.1'. */
  format: OBFFormatVersionSchema,
  /** Unique identifier for the board. */
  id: OBFIDSchema,
  /** Locale of the board as a BCP 47 language tag, e.g., 'en', 'en-US'. */
  locale: OBFLocaleCodeSchema.optional(),
  /** List of buttons on the board. */
  buttons: z.array(OBFButtonSchema),
  /** URL where the board can be accessed or downloaded. */
  url: z.url().optional(),
  /** Name of the board. */
  name: z.string().optional(),
  /** Description of the board in HTML format. */
  description_html: z.string().optional(),
  /** Grid layout information for arranging buttons. */
  grid: OBFGridSchema,
  /** List of images used in the board. */
  images: z.array(OBFImageSchema).optional(),
  /** List of sounds used in the board. */
  sounds: z.array(OBFSoundSchema).optional(),
  /** Licensing information for the board. */
  license: OBFLicenseSchema.optional(),
  /** String translations for multiple locales. */
  strings: OBFStringsSchema.optional(),
});

export type OBFBoard = z.infer<typeof OBFBoardSchema>;

/**
 * Manifest file in an .obz package.
 */
export const OBFManifestSchema = z.object({
  /** Format version of the Open Board Format, e.g., 'open-board-0.1'. */
  format: OBFFormatVersionSchema,
  /** Path to the root board within the .obz package. */
  root: z.string(),
  /** Mapping of IDs to paths for boards, images, and sounds. */
  paths: z.object({
    /** Mapping of board IDs to their file paths. */
    boards: z.record(z.string(), z.string()),
    /** Mapping of image IDs to their file paths. */
    images: z.record(z.string(), z.string()),
    /** Mapping of sound IDs to their file paths. */
    sounds: z.record(z.string(), z.string()).optional(),
  }),
});
export type OBFManifest = z.infer<typeof OBFManifestSchema>;
