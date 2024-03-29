import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import tar from "tar";

import { archive } from "./archive";
import {
  createTempDirectory,
  getDirectories,
  isDirectoryExists,
  isFileExists,
} from "./fs";
import { afterEach } from "node:test";

const context = describe;

describe("isPathsHasMetaFile", () => {
  context("if does not has .meta file", () => {
    it("throws error", async () => {
      await expect(
        archive({
          files: [
            "./src/fixtures/Assets/MonoBehaviourAsset.cs",
            "./src/fixtures/Assets/NotFoundMonoBehaviour.cs",
          ],
          root: "./src/fixtures",
          dest: "",
        })
      ).rejects.toThrowError(
        /^meta not found: .\/src\/fixtures\/Assets\/NotFoundMonoBehaviour.cs$/
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
            "./src/fixtures/Assets/MonoBehaviourAsset.cs",
            "./src/fixtures/Assets/FolderAsset/OtherMonoBehaviourAsset.cs",
          ],
          root: "./src/fixtures/Assets/FolderAsset",
          dest: "",
        })
      ).rejects.toThrowError(
        /^path not inside in project: .\/src\/fixtures\/Assets\/MonoBehaviourAsset.cs$/
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

  type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;

  let temp: UnwrapPromise<ReturnType<typeof createTempDirectory>>;

  const extract = async (path: string): Promise<string> => {
    await tar.extract({
      file: path,
      cwd: dirname(path),
    });

    return dirname(path);
  };

  const verify = async (
    root: string,
    contents: PackageContent[]
  ): Promise<void> => {
    const dirs = await getDirectories({ root });
    expect(dirs.length).toBe(contents.length);

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
    temp = await createTempDirectory();
  });

  context("with nested items", () => {
    context("transform", () => {
      it("successful archived with valid structure", async () => {
        const path = join(temp.path, "test1.unitypackage");

        await archive({
          files: [
            "src/fixtures/Assets/MonoBehaviourAsset.cs",
            "src/fixtures/Assets/FolderAsset/OtherMonoBehaviourAsset.cs",
          ],
          root: "./src/fixtures",
          dest: path,
          transform: (path) =>
            join(
              "Packages",
              "com.natsuneko.test1",
              ...path.split("/").splice(1)
            ),
        });

        const root = await extract(path);
        await verify(root, [
          {
            guid: "456bc8eb3f133524aad6204de5d9c325",
            pathname: "Packages/com.natsuneko.test1/MonoBehaviourAsset.cs",
            hasAsset: true,
          },
          {
            guid: "bafb03973cae39b4c9811b82bf5b2273",
            pathname: "Packages/com.natsuneko.test1/FolderAsset",
            hasAsset: false,
          },
          {
            guid: "456bc8eb3f135524aad6204de5d9c32c",
            pathname:
              "Packages/com.natsuneko.test1/FolderAsset/OtherMonoBehaviourAsset.cs",
            hasAsset: true,
          },
        ]);
      });
    });

    context("no transform", () => {
      it("successful archived with valid structure", async () => {
        const path = join(temp.path, "test2.unitypackage");

        await archive({
          files: [
            "src/fixtures/Assets/MonoBehaviourAsset.cs",
            "src/fixtures/Assets/FolderAsset/OtherMonoBehaviourAsset.cs",
          ],
          root: "./src/fixtures",
          dest: path,
        });

        const root = await extract(path);
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
  });

  context("without nested items", () => {
    context("transform", () => {
      it("successful archived with valid structure", async () => {
        const path = join(temp.path, "test3.unitypackage");

        await archive({
          files: ["src/fixtures/Assets/FolderAsset/OtherMonoBehaviourAsset.cs"],
          root: "./src/fixtures",
          dest: path,
          transform: (path) =>
            join(
              "Packages",
              "com.natsuneko.test3",
              ...path.split("/").splice(1)
            ),
        });

        const root = await extract(path);
        await verify(root, [
          {
            guid: "bafb03973cae39b4c9811b82bf5b2273",
            pathname: "Packages/com.natsuneko.test3/FolderAsset",
            hasAsset: false,
          },
          {
            guid: "456bc8eb3f135524aad6204de5d9c32c",
            pathname:
              "Packages/com.natsuneko.test3/FolderAsset/OtherMonoBehaviourAsset.cs",
            hasAsset: true,
          },
        ]);
      });
    });

    context("no transform", () => {
      it("successful archived with valid structure", async () => {
        const path = join(temp.path, "test3.unitypackage");

        await archive({
          files: ["src/fixtures/Assets/MonoBehaviourAsset.cs"],
          root: "./src/fixtures",
          dest: path,
        });

        const root = await extract(path);
        await verify(root, [
          {
            guid: "456bc8eb3f133524aad6204de5d9c325",
            pathname: "Assets/MonoBehaviourAsset.cs",
            hasAsset: true,
          },
        ]);
      });
    });
  });

  afterEach(async () => {
    await temp.dispose();
  });
});
