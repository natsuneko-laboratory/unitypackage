import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { join } from "node:path";

import { extract } from "./extract";
import { createTempDirectory, isDirectoryExists, isFileExists } from "./fs";

const context = describe;

describe("extract", () => {
  type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
  type PackageContent = {
    pathname: string;
    isAsset: boolean;
  };

  let temp: UnwrapPromise<ReturnType<typeof createTempDirectory>>;

  const verify = async (
    root: string,
    contents: PackageContent[]
  ): Promise<void> => {
    for (const content of contents) {
      const asset = join(root, content.pathname);
      const isExists = content.isAsset
        ? await isFileExists(asset)
        : await isDirectoryExists(asset);
      expect(
        isExists,
        `${content.pathname} is ${
          content.isAsset ? "file" : "directory"
        } exists`
      ).toBeTruthy();

      const isMetaExists = await isFileExists(
        join(root, `${content.pathname}.meta`)
      );
      expect(
        isMetaExists,
        `is meta (${content.pathname}.meta) exists`
      ).toBeTruthy();
    }
  };

  beforeEach(async () => {
    temp = await createTempDirectory();
  });

  context("with not nested items", () => {
    it("successful extracted with valid structure", async () => {
      await extract({
        file: "./src/fixtures/NotNested.unitypackage",
        root: temp.path,
        transform: (w) =>
          w.startsWith("Assets") ? w.substring("Assets/".length) : w,
      });

      await verify(temp.path, [
        { pathname: "OtherMonoBehaviourAsset.cs", isAsset: true },
      ]);
    });
  });

  context("with nested items", () => {
    it("successful extracted with valid structure", async () => {
      await extract({
        file: "./src/fixtures/Nested.unitypackage",
        root: temp.path,
        transform: (w) =>
          w.startsWith("Assets") ? w.substring("Assets/".length) : w,
      });

      await verify(temp.path, [
        {
          pathname: "MonoBehaviourAsset.cs",
          isAsset: true,
        },
        {
          pathname: "FolderAsset",
          isAsset: false,
        },
        {
          pathname: "FolderAsset/OtherMonoBehaviourAsset.cs",
          isAsset: true,
        },
      ]);
    });
  });

  afterEach(async () => {
    await temp.dispose();
  });
});
