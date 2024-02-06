import { copyFile, mkdir, readFile } from "node:fs/promises";
import { resolve as absolute, join, dirname, normalize } from "node:path";

import tar from "tar";

import { createTempDirectory, getDirectories } from "./fs";
import { read } from "./meta";

const fromTarGz = async (from: string, to: string) => {
  await tar.extract({
    file: from,
    cwd: to,
  });

  return to;
};

const write = async ({
  path,
  root,
  transform,
}: {
  /** actual asset path (ends with guid) */
  path: string;
  /** unity project root */
  root: string;
  /** transform */
  transform?: (path: string) => string;
}): Promise<void> => {
  const meta = join(path, "asset.meta");
  const content = await read(join(path, "asset.meta"));
  const pathname = await readFile(join(path, "pathname"), "utf8");
  const t = transform ? transform : (w: string) => w;

  const dest = normalize(join(root, t(pathname)));

  if (content.isFolderAsset) {
    await mkdir(dest, { recursive: true });
    await copyFile(meta, `${dest}.meta`);
  } else {
    const directory = dirname(dest);
    const asset = join(path, "asset");

    await mkdir(directory, { recursive: true });
    await copyFile(meta, `${dest}.meta`);
    await copyFile(asset, dest);
  }
};

type ExtractArgs = {
  /**
   * file path to unitypackage
   */
  file: string;

  /**
   * unity project root directory
   */
  root: string;

  /**
   * transform input paths on write
   * @param path input file path (relative on root)
   * @returns input file path (relative on root)
   * @example filter: (path) => join("..", "Packages", "com.natsuneko.unitypackage", path); // Assets/MonoBehaviour.cs → Packages/com.natsuneko.unitypackage/MonoBehaviour.cs
   */
  transform?: (path: string) => string;
};

const extract = async ({
  file,
  root,
  transform,
}: ExtractArgs): Promise<void> => {
  const temp = await createTempDirectory();

  try {
    const dir = temp.path;

    // extract
    await fromTarGz(normalize(absolute(file)), dir);

    const dirs = await getDirectories({ root: dir });
    await Promise.all(dirs.map((w) => write({ path: w, root, transform })));
  } finally {
    await temp.dispose();
  }
};

export { extract };
