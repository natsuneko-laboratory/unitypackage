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
import { archive, extract, search } from "@natsuneko-laboratory/unitypackage";

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

// search unitypackage entries
await search({
  path: "Assets/MonoBehaviour.cs", // search by path
  guid: "456bc8eb3f133524aad6204de5d9c325", // search by guid
}); // => { guid: "xxx", path: "xxx", asset?: Buffer }[]

// alias of search({ path: "xxx" })
await searchByPath("xxx");

// alias of search({ guid: "xxx" })
await searchByGuid("xxx");
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
