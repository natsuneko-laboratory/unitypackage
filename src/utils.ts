import { promises } from "fs";
import { load } from "js-yaml";
import os from "os";
import path from "path";

export type MetaFile = {
  path: string;
  meta: { guid: string; folderAsset: "yes" | undefined };
};

export type TempDir = {
  dir: string;
  clean: () => Promise<void>;
};

const createTempDir = async (): Promise<TempDir> => {
  const dir = await promises.mkdtemp(path.join(os.tmpdir(), "unity-package-"));
  const clean = async (): Promise<void> => {
    await promises.rm(dir, { recursive: true });
  };

  return {
    dir,
    clean,
  };
};

const isFileExists = async (filepath: string): Promise<boolean> => {
  try {
    return (await promises.lstat(filepath)).isFile();
  } catch (e) {
    return false;
  }
};

const readUnityMeta = async (meta: string): Promise<MetaFile> => {
  if (await isFileExists(meta)) {
    const metaContent = await promises.readFile(meta, "utf8");
    return { meta: load(metaContent, {}), path: meta } as MetaFile;
  }

  throw new Error(`meta file not found : ${meta}`);
};

export { createTempDir, isFileExists, readUnityMeta };
