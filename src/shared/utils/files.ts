export async function openFile(): Promise<File | undefined> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Open Board Format files",
          accept: {
            "application/zip": [".obz"],
            "application/json": [".obf"],
          },
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false,
    });

    const file = await handle.getFile();
    return file;
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error(error);
    }
  }
}
