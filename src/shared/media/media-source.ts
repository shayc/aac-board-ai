// Local blobs are immutable snapshots: retaining one keeps its contents available
// even after the originating board is unloaded or deleted from IndexedDB.
export type MediaSource = string | Blob;
