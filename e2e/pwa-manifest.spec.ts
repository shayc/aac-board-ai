import { expect, type Page, test } from "@playwright/test";

interface ManifestImage {
  src: string;
  sizes: string;
  form_factor?: string;
}

interface Manifest {
  icons: ManifestImage[];
  screenshots: ManifestImage[];
}

test("the manifest's icons and screenshots match their declared sizes", async ({
  page,
}) => {
  await page.goto("/");
  const response = await page.request.get("/manifest.webmanifest");
  const manifest = (await response.json()) as Manifest;

  // Chrome shows its richer install dialog only with a screenshot for the
  // device's form factor, and ignores one whose file doesn't match `sizes`.
  expect(
    new Set(manifest.screenshots.map(({ form_factor }) => form_factor)),
  ).toEqual(new Set(["narrow", "wide"]));

  for (const image of [...manifest.icons, ...manifest.screenshots]) {
    const imageURL = new URL(image.src, response.url()).href;

    expect(await measureImage(page, imageURL), image.src).toBe(image.sizes);
  }
});

function measureImage(page: Page, imageURL: string): Promise<string> {
  return page.evaluate(async (url) => {
    const response = await fetch(url);
    const bitmap = await createImageBitmap(await response.blob());

    return `${bitmap.width}x${bitmap.height}`;
  }, imageURL);
}
