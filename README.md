# @natsuneko-laboratory/unitypackage

Create UnityPackage from Node.js, written in TypeScript. No platform dependency.

## Requirements

- Node.js >= 16

## Install

```
$ yarn add @natsuneko-laboratory/unitypackage
```

## Usage

```typescript
import { archive } from "@natsuneko-laboratory/unitypackage";

// archive as UnityPackage
const meta = [
  "/path/to/Assets/file1.meta",
  "/path/to/Assets/file2.meta",
  "/path/to/Assets/file3.meta",
];

await archive(meta, "/path/to", "./archive.unitypackage");
```

## License

MIT by [Natsune - @6jz](https://twitter.com/6jz)
