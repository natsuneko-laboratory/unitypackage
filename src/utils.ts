import { promises } from "fs";
import os from "os";
import path from "path";

const UNITY_GUID_REGEX = /^guid: (?<guid>[a-z0-9]{32})$/gm;
const UNITY_FOLDER_ASSET_REGEX = /^folderAsset: yes$/g;

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

const loadYamlPoorly = (
  content: string
): { guid: string; folderAsset: "yes" | undefined } => {
  const isFolderAsset = UNITY_FOLDER_ASSET_REGEX.test(content);
  const ret = UNITY_GUID_REGEX.exec(content);

  return {
    guid: ret!.groups!.guid,
    folderAsset: isFolderAsset ? "yes" : undefined,
  };
};

const readUnityMeta = async (meta: string): Promise<MetaFile> => {
  if (await isFileExists(meta)) {
    const metaContent = await promises.readFile(meta, "utf8");
    // Unity's meta is INVALID YAML format, f**k Unity Technologies.
    return { meta: loadYamlPoorly(metaContent), path: meta } as MetaFile;
  }

  throw new Error(`meta file not found : ${meta}`);
};

export { createTempDir, isFileExists, readUnityMeta };
