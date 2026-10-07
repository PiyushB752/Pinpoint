
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const storageDirectory = path.resolve(process.cwd(), "uploads");

export async function storeDocument(
  buffer: Buffer,
  extension: string,
): Promise<{ storageKey: string; absolutePath: string }> {
  await mkdir(storageDirectory, { recursive: true });

  const storageKey = `${randomUUID()}${extension}`;
  const absolutePath = path.join(storageDirectory, storageKey);

  await writeFile(absolutePath, buffer, {
    flag: "wx",
    mode: 0o600,
  });

  return {
    storageKey,
    absolutePath,
  };
}

export async function removeStoredDocument(
  absolutePath: string,
): Promise<void> {
  await (await import("node:fs/promises")).unlink(absolutePath);
}