import { readFile } from "node:fs/promises";

import { isFileExists } from "./fs";

type Meta = {
  path: string;
  guid: string;
  isFolderAsset: boolean;
};

const read = async (path: string): Promise<Meta> => {
  if (await isFileExists(path)) {
    const UNITY_GUID_PATTERN = /^guid:\s+(?<guid>[a-z0-9]{32})$/gm;
    const UNITY_FOLDER_ASSET_PATTERN = /^folderAsset: yes$/gm;

    const content = await readFile(path, "utf8");
    const guid = UNITY_GUID_PATTERN.exec(content)?.groups?.guid;
    const isFolderAsset = UNITY_FOLDER_ASSET_PATTERN.test(content);

    if (guid) {
      return {
        path,
        guid,
        isFolderAsset,
      };
    }

    throw new Error(`invalid meta: ${path}`);
  }

  throw new Error(`meta file not found: ${path}`);
};

export { read };
