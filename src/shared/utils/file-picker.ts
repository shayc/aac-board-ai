export interface OpenFilesOptions {
  accept?: string;
  multiple?: boolean;
}

export function openFiles({
  accept,
  multiple = false,
}: OpenFilesOptions = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;

    if (accept) {
      input.accept = accept;
    }

    input.addEventListener(
      "change",
      () => {
        resolve(input.files ? Array.from(input.files) : []);
      },
      { once: true },
    );

    input.addEventListener(
      "cancel",
      () => {
        resolve([]);
      },
      { once: true },
    );

    input.click();
  });
}
