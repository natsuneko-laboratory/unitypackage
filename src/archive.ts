import AdmZip from "adm-zip";
import { promises } from "fs";
import mkdirp from "mkdirp";
import path from "path";
import _tar from "tar";

import { createTempDir, readUnityMeta, MetaFile } from "./utils";

const writeAsset = async (meta: MetaFile, root: string, temp: string) => {
  const assetPath = path.join(temp, meta.meta.guid);

  await mkdirp(assetPath);

  await promises.copyFile(meta.path, path.join(assetPath, "asset.meta"));

  if (meta.meta.folderAsset !== "yes") {
    const actual = path.join(
      path.dirname(meta.path),
      path.basename(meta.path, ".meta")
    );

    await promises.copyFile(actual, path.join(assetPath, "asset"));
  }

  const relative = path.relative(root, meta.path);
  const pathname = path
    .join(path.dirname(relative), path.basename(relative, ".meta"))
    .replace(/\\/g, "/");

  await promises.writeFile(path.join(assetPath, "pathname"), pathname);
};

const getDirFiles = async (
  dir: string,
  files: string[] = []
): Promise<string[]> => {
  const entries = await promises.readdir(dir, { withFileTypes: true });
  const dirs = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const entry of entries) {
    if (entry.isDirectory()) dirs.push(`${dir}/${entry.name}`);
    else if (entry.isFile()) files.push(`${dir}/${entry.name}`);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const d of dirs) {
    // eslint-disable-next-line
    files = await getDirFiles(d, files);
  }

  return files;
};

const archiveAsTar = async (dir: string): Promise<string> => {
  const output = path.join(dir, "..", "archtemp.tar");
  const files = await getDirFiles(dir);

  return new Promise((resolve, reject) => {
    _tar.create(
      { gzip: false, file: output, cwd: dir },
      files.map((w) => path.relative(dir, w)),
      (err) => {
        if (err) return reject();
        return resolve(output);
      }
    );
  });
};

const archiveAsZip = async (filepath: string): Promise<string> => {
  const output = `${filepath}.gz`;
  const zip = new AdmZip();
  zip.addFile("archtemp.tar", await promises.readFile(filepath));

  return new Promise((resolve, reject) => {
    zip.writeZip(output, (err) => {
      if (err) return reject(err);
      return resolve(output);
    });
  });
};

/**
 * Archive files and folders as UnityPackage.
 * @param files .meta paths to archive
 * @param root  Unity root directory
 * @param dist  destination path
 */
const archive = async (
  files: string[],
  root: string,
  dist: string
): Promise<void> => {
  const temp = await createTempDir();
  const dir = path.join(temp.dir, "archive");
  const meta = await Promise.all(
    files.map((w) => readUnityMeta(path.join(root, w)))
  );

  await Promise.all(meta.map((w) => writeAsset(w, root, dir)));
  const tar = await archiveAsTar(dir);
  const pkg = await archiveAsZip(tar);

  await promises.copyFile(pkg, dist);
  await temp.clean();
};

export default archive;
