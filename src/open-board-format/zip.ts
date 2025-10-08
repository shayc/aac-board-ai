import { unzip as fflateUnzip, zip as fflateZip } from "fflate";

export function unzip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    const input = new Uint8Array(buffer);

    fflateUnzip(input, (error, result) => {
      if (error) {
        reject(new Error(`Failed to unzip: ${error.message ?? String(error)}`));
        return;
      }

      const files = new Map<string, Uint8Array>();
      for (const [path, bytes] of Object.entries(result)) {
        files.set(path, bytes);
      }

      resolve(files);
    });
  });
}

export function zip(
  files: Map<string, Uint8Array | ArrayBuffer>
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const input: Record<string, Uint8Array> = {};

    for (const [path, content] of files) {
      input[path] =
        content instanceof Uint8Array ? content : new Uint8Array(content);
    }

    fflateZip(input, { level: 6 }, (error, result) => {
      if (error) {
        reject(new Error(`Failed to zip: ${error.message ?? String(error)}`));
        return;
      }

      resolve(result);
    });
  });
}

export function isZip(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  return view.length >= 2 && view[0] === 0x50 && view[1] === 0x4b;
}
