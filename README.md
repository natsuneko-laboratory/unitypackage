# @natsuneko-laboratory/unitypackage

Archive / Extract / Search UnityPackage from Node.js, written in TypeScript. No platform dependency.

## Requirements

- Node.js >= 18

## Install

```bash
$ npm add @natsuneko-laboratory/unitypackage
$ yarn add @natsuneko-laboratory/unitypackage
$ pnpm add @natsuneko-laboratory/unitypackage
```

## Usage

```typescript
import { archive, extract } from "@natsuneko-laboratory/unitypackage";

// create a unitypackage
await archive({
  files: [
    // files to archive
    "/path/to/assets/MonoBehaviour.cs",
    "/path/to/assets/Prefab.prefab",
  ],
  root: "/path/to", // unity project root
  dest: "/path/to/archive.unitypackage", // destination path
  transform: (path) => join("Assets", join), // transform path (optional)
});

// extract a unitypackage
await extract({
  file: "/path/to/archive.unitypackage",
  root: "/path/to", // unity project root
  transform: (path) => join("Assets", join), // transform path (optional)
});
```

## Development

```bash
# prepare
$ pnpm install

# publish
$ npm publish --access public
```

## License

MIT by [@6jz](https://twitter.com/6jz)
