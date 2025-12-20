export function openFile(): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".obz,.obf,application/zip,application/json";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      resolve(file);
    });

    input.addEventListener("cancel", () => {
      resolve(undefined);
    });

    input.click();
  });
}
