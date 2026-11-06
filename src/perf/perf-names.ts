export const spanNames = [
  "load:app:board",
  "route:board:open",
  "flow:message:add-tile",
  "flow:message:play",
  "flow:library:open",
  "flow:library:import",
  "flow:settings:open",
  "flow:settings:label-placement",
] as const;

export const operationNames = [
  "op:board:unzip",
  "op:board:store",
  "op:board:load",
] as const;

export const componentNames = [
  "App",
  "AppHeader",
  "LibraryDrawer",
  "SettingsDrawer",
  "CommunicationBoard",
  "MessageBar",
  "Grid",
  "Tile",
] as const;

export const routePatterns = [
  "/sets/:boardSetId/boards/:boardId",
  "/sets/:boardSetId",
] as const;

export type SpanName = (typeof spanNames)[number];
export type OperationName = (typeof operationNames)[number];
export type ComponentName = (typeof componentNames)[number];
