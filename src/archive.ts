import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve as absolute, dirname } from "node:path";

import AdmZip from "adm-zip";
import normalize from "normalize-path";
import tar from "tar";

import { createTempDirectory, getDirectoryFiles, isFileExists } from "./fs";
import { read } from "./meta";

const isPathsHasMetaFile = async (paths: string[]): Promise<void> => {
  const ret = await Promise.all(paths.map((w) => isFileExists(`${w}.meta`)));
  if (ret.some((w) => !w)) {
    const notFound = ret
      .map((w, i) => (w ? undefined : i))
      .filter((w) => !!w)
      .map((w) => w as number)
      .map((w) => paths[w]);

    throw new Error(`meta not found: ${notFound.join(",")}`);
  }
};

const isPathsInsideProjectRoot = async ({
  paths,
  root,
}: {
  paths: string[];
  root: string;
}): Promise<void> => {
  const r = normalize(absolute(root));
  const ret = await Promise.all(
    paths.map((w) => normalize(absolute(w))).map((w) => w.includes(r))
  );

  if (ret.some((w) => !w)) {
    const notInside = ret
      .map((w, i) => (w ? undefined : i))
      .filter((w) => w !== undefined)
      .map((w) => w as number)
      .map((w) => paths[w]);

    throw new Error(`path not inside in project: ${notInside.join(",")}`);
  }
};

const write = async ({
  path,
  root,
  arch,
  filter,
}: {
  /** actual asset path */
  path: string;
  /** unity project root */
  root: string;
  /** archive root */
  arch: string;
  /** filter */
  filter?: (path: string) => string;
}): Promise<void> => {
  const meta = await read(`${path}.meta`);
  const directory = join(arch, meta.guid);

  await mkdir(directory, { recursive: true });
  await copyFile(meta.path, join(directory, "asset.meta"));

  if (!meta.isFolderAsset) {
    await copyFile(path, join(directory, "asset"));
  }

  const pathname = normalize(relative(root, path));
  await writeFile(
    join(directory, "pathname"),
    filter ? normalize(filter(pathname)) : pathname
  );
};

const toTarGz = async (dir: string): Promise<string> => {
  const files = await getDirectoryFiles({ root: dir });
  const o = join(dir, "..", "archtemp.tar");

  await new Promise((resolve, reject) =>
    tar.create(
      { gzip: false, file: o, cwd: dir },
      files.map((w) => relative(dir, w)),
      (err) => {
        if (err) {
          return reject();
        }

        return resolve(o);
      }
    )
  );

  const zip = new AdmZip();
  zip.addFile("archtemp.tar", await readFile(o));

  return await new Promise((resolve, reject) => {
    zip.writeZip(`${o}.gz`, (err) => {
      if (err) {
        return reject();
      }

      return resolve(`${o}.gz`);
    });
  });
};

type ArchiveArgs = {
  /**
   * actual file paths to archive (not `.meta` file path)
   */
  files: string[];

  /**
   * unity project root directory
   */
  root: string;

  /**
   * archive (`.unitypackage`) destination path
   */
  dest: string;

  // extras

  /**
   * transform input paths on write
   * @param path input file path (relative on root)
   * @returns input file path (relative on root)
   * @example filter: (path) => join("..", "Packages", "com.natsuneko.unitypackage", path); // Assets/MonoBehaviour.cs → Packages/com.natsuneko.unitypackage/MonoBehaviour.cs
   */
  filter?: (path: string) => string;
};

/**
 * create a new unitypackage from `files` on `root`, to `dest`.
 * @param param0
 */
const archive = async ({
  files,
  root,
  dest,
  filter,
}: ArchiveArgs): Promise<void> => {
  // validate args
  await isPathsHasMetaFile(files);
  await isPathsInsideProjectRoot({ paths: files, root });

  const temp = await createTempDirectory();

  try {
    const dir = join(temp.path, "archive");

    // write actual assets
    await Promise.all(
      files.map((w) => write({ path: w, root, arch: dir, filter }))
    );

    // write virtual assets
    const virtual = files
      .map((w) => dirname(w))
      .filter((w) => !!relative(root, w));
    await Promise.all(
      Array.from(new Set(virtual)).map((w) =>
        write({ path: w, root, arch: dir, filter })
      )
    );

    const pkg = await toTarGz(dir);
    await copyFile(pkg, dest);
  } finally {
    await temp.dispose();
  }
};

export { archive };
