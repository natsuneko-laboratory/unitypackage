import archiver from "archiver";
import { createWriteStream, promises } from "fs";
import mkdirp from "mkdirp";
import path from "path";

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

const archiveAsTar = (dir: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const output = path.join(dir, "..", "archtemp.tar");
    const stream = createWriteStream(output);
    const archive = archiver("tar");

    archive.on("error", reject);
    archive.on("finish", () => resolve(output));

    archive.pipe(stream);
    archive.directory(dir, false);
    archive.finalize();
  });

const archiveAsZip = async (filepath: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const output = `${filepath}.gz`;
    const stream = createWriteStream(output);
    const archive = archiver("zip");

    archive.on("error", reject);
    archive.on("finish", () => resolve(output));

    archive.pipe(stream);
    archive.file(filepath, { name: "archtemp.tar" });
    archive.finalize();
  });

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
