export interface ObjectUrlRegistry {
  create(blob: Blob): string;
  revokeAll(): void;
}

export function createObjectUrlRegistry(): ObjectUrlRegistry {
  const urls = new Set<string>();

  return {
    create(blob: Blob): string {
      const url = URL.createObjectURL(blob);
      urls.add(url);

      return url;
    },

    revokeAll(): void {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }

      urls.clear();
    },
  };
}
