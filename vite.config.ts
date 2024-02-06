// https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1270716220
import type {} from "vite";

import { defineConfig } from "@natsuneko-laboratory/kiana/vite";

export default defineConfig({
  externals: [
    "node:fs/promises",
    "node:os",
    "node:path",
    "node:zlib",
    "adm-zip",
    "mkdirp",
    "normalize-path",
    "tar",
    "vitest",
  ],
});
