import { describe, expect, it } from "vitest";

import { read } from "./meta";

const context = describe;

describe("read", () => {
  context("when file/directory exists", () => {
    context("when meta is file asset", () => {
      it("isFolderAsset is false", async () => {
        const meta = await read(
          "./src/fixtures/Assets/MonoBehaviourAsset.cs.meta"
        );

        expect(meta.guid).toBe("456bc8eb3f133524aad6204de5d9c325");
        expect(meta.isFolderAsset).toBeFalsy();
      });
    });

    context("when meta is directory asset", () => {
      it("isFolderAsset is true", async () => {
        const meta = await read("./src/fixtures/Assets/FolderAsset.meta");

        expect(meta.guid).toBe("bafb03973cae39b4c9811b82bf5b2273");
        expect(meta.isFolderAsset).toBeTruthy();
      });
    });
  });

  context("when file/directory not exists", () => {
    it("throw errors", async () => {
      expect(read("./src/fixtures/NotFound.meta")).rejects.toThrowError(
        /meta file not found/
      );
    });
  });
});
