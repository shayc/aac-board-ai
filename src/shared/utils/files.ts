export function openFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".obz,.obf,application/zip,application/json";

    input.addEventListener("change", () => {
      resolve(input.files ? Array.from(input.files) : []);
    });

    input.addEventListener("cancel", () => {
      resolve([]);
    });

    input.click();
  });
}
