interface PickFilesOptions {
  accept?: string;
  multiple?: boolean;
}

export function pickFiles({
  accept,
  multiple = false,
}: PickFilesOptions = {}): Promise<File[]> {
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
        resolve(Array.from(input.files ?? []));
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

    input.showPicker();
  });
}
