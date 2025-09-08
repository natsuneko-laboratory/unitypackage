import { lstat, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import normalize from "normalize-path";

type TempDirectory = {
  path: string;
  dispose: () => Promise<void>;
};

const createTempDirectory = async (): Promise<TempDirectory> => {
  const dir = await mkdtemp(join(tmpdir(), "unitypackage-"));
  const dispose = async () => {
    await rm(dir, { recursive: true });
  };

  return { path: dir, dispose };
};

const getDirectoryFiles = async ({
  root,
}: {
  root: string;
}): Promise<string[]> => {
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  return entries
    .filter((w) => w.isFile())
    .map((w) => normalize(join(w.parentPath, w.name)));
};

const getDirectories = async ({
  root,
}: {
  root: string;
}): Promise<string[]> => {
  const entries = await readdir(root, {
    withFileTypes: true,
    recursive: false,
  });
  return entries
    .filter((w) => w.isDirectory())
    .map((w) => normalize(join(w.parentPath, w.name)));
};

const isFileExists = async (path: string): Promise<boolean> => {
  try {
    return (await lstat(path)).isFile();
  } catch {
    return false;
  }
};

const isDirectoryExists = async (path: string): Promise<boolean> => {
  try {
    return (await lstat(path)).isDirectory();
  } catch {
    return false;
  }
};

export {
  createTempDirectory,
  getDirectories,
  getDirectoryFiles,
  isFileExists,
  isDirectoryExists,
};
