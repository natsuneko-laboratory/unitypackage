import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

import { getDirectoryFiles, isFileExists } from "./fs";

const context = describe;

describe("getDirectoryFiles", () => {
  context("if directory is empty", () => {
    const path = join(cwd(), "temp", "dir");

    beforeAll(async () => {
      await mkdir(path, { recursive: true });
    });

    it("returns empty array", async () => {
      await expect(getDirectoryFiles({ root: path })).resolves.toStrictEqual(
        []
      );
    });

    afterAll(async () => {
      await rmdir(path);
    });
  });

  context("if directory is not empty", () => {
    context("with nested", () => {
      it("returns five items array", async () => {
        await expect(
          getDirectoryFiles({ root: "./src/fixtures" })
        ).resolves.toStrictEqual([
          "src/fixtures/FolderAsset.meta",
          "src/fixtures/MonoBehaviourAsset.cs",
          "src/fixtures/MonoBehaviourAsset.cs.meta",
          "src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs",
          "src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs.meta",
        ]);
      });
    });

    context("without nested", () => {
      it("returns two items", async () => {
        await expect(
          getDirectoryFiles({ root: "./src/fixtures/FolderAsset" })
        ).resolves.toStrictEqual([
          "src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs",
          "src/fixtures/FolderAsset/OtherMonoBehaviourAsset.cs.meta",
        ]);
      });
    });
  });
});

describe("isFileExists", () => {
  context("if file exists", () => {
    it("returns true", async () => {
      await expect(
        isFileExists("./src/fixtures/FolderAsset.meta")
      ).resolves.toBeTruthy();
    });
  });

  context("if directory exists", () => {
    it("returns false", async () => {
      await expect(isFileExists("./src/fixtures")).resolves.toBeFalsy();
    });
  });

  context("if file and directory not exists", async () => {
    it("returns false", async () => {
      await expect(
        isFileExists("./src/fixtures_notfound")
      ).resolves.toBeFalsy();
    });
  });
});
