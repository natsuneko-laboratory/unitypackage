import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd } from "node:process";

import AdmZip from "adm-zip";
import tar from "tar";

import { archive } from "./archive";
import { isDirectoryExists, isFileExists } from "./fs";

const context = describe;

describe("isPathsHasMetaFile", () => {
  context("if does not has .meta file", () => {
    it("throws error", async () => {
      await expect(
        archive({
          files: [
            "./src/fixtures/MonoBehaviourAsset.cs",
            "./src/fixtures/NotFoundMonoBehaviour.cs",
          ],
          root: "./src/fixtures",
          dest: "",
        })
      ).rejects.toThrowError(
        /^meta not found: .\/src\/fixtures\/NotFoundMonoBehaviour.cs$/
      );
    });
  });
});

describe("isPathsInsideProjectRoot", () => {
  context("if does not has .meta file", () => {
    it("throws error", async () => {
      await expect(
        archive({
          files: [
            "./src/fixtures/MonoBehaviourAsset.cs",
            "./src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs",
          ],
          root: "./src/fixtures/FolderAsset",
          dest: "",
        })
      ).rejects.toThrowError(
        /^path not inside in project: .\/src\/fixtures\/MonoBehaviourAsset.cs$/
      );
    });
  });
});

describe("archive", () => {
  type PackageContent = {
    guid: string;
    pathname: string;
    hasAsset: boolean;
  };

  const path = join(cwd(), "temp");
  const dest = join(path, "test.unitypackage");

  const extract = async (path: string): Promise<string> => {
    const archtemp: string = await new Promise((resolve, reject) => {
      const zip = new AdmZip(path);
      const dest = join(dirname(path), "test");
      zip.extractAllToAsync(dest, true, false, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(join(dest, "archtemp.tar"));
      });
    });

    await tar.extract({
      file: archtemp,
      cwd: dirname(archtemp),
    });

    await rm(archtemp);

    return dirname(archtemp);
  };

  const verify = async (
    root: string,
    contents: PackageContent[]
  ): Promise<void> => {
    for (const content of contents) {
      const dir = join(root, content.guid);
      const isExistsDir = await isDirectoryExists(dir);

      expect(
        isExistsDir,
        `has ${content.guid} directory in archive`
      ).toBeTruthy();

      const pathname = await readFile(join(dir, "pathname"), "utf8");
      expect(pathname, `pathname content equals to ${pathname}`).toBe(
        content.pathname
      );

      const hasAsset = await isFileExists(join(dir, "asset"));
      expect(hasAsset, content.hasAsset ? "has asset" : "has not asset").toBe(
        content.hasAsset
      );
    }
  };

  beforeEach(async () => {
    await mkdir(path, { recursive: true });
  });

  context("with not nested items", () => {
    it("successful archived with valid structure", async () => {
      await archive({
        files: [
          "src/fixtures/MonoBehaviourAsset.cs",
          "src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs",
        ],
        root: "./src/fixtures",
        dest: dest,
        filter: (w) => join("Assets", w),
      });

      const root = await extract(dest);
      await verify(root, [
        {
          guid: "456bc8eb3f133524aad6204de5d9c325",
          pathname: "Assets/MonoBehaviourAsset.cs",
          hasAsset: true,
        },
        {
          guid: "bafb03973cae39b4c9811b82bf5b2273",
          pathname: "Assets/FolderAsset",
          hasAsset: false,
        },
        {
          guid: "456bc8eb3f135524aad6204de5d9c32c",
          pathname: "Assets/FolderAsset/OtherMonoBehaviourAsset.cs",
          hasAsset: true,
        },
      ]);
    });
  });

  context("with nested items", () => {
    it("successful archived with valid structure", async () => {
      await archive({
        files: ["src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs"],
        root: "./src/fixtures/FolderAsset",
        dest: dest,
        filter: (w) => join("Assets", w),
      });

      const root = await extract(dest);
      await verify(root, [
        {
          guid: "456bc8eb3f135524aad6204de5d9c32c",
          pathname: "Assets/OtherMonoBehaviourAsset.cs",
          hasAsset: true,
        },
      ]);
    });
  });

  afterAll(async () => {
    await rm(path, { recursive: true });
  });
});