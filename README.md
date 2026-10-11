# backbone-modelref

Backbone-ModelRef.js provides a mechanism to respond to lazy-loaded Backbone.js models.

It keeps a reference to a model ID in a collection and emits `loaded` and `unloaded` as that model enters or leaves the collection. Importing the package also installs the legacy `Backbone.ModelRef` namespace and the `model`, `isLoaded`, `bindLoadingStates`, and `unbindLoadingStates` helpers on `Backbone.Model.prototype`.

## Install

```sh
npm install backbone-modelref backbone
```

The declared dependency range is Backbone `>=1.2.3 <2`. The verified matrix currently includes Backbone 1.2.3, 1.3.3, 1.4.1, and 1.6.1. The tested Node.js floor is 18.19; the library code has no known Node 18-only API requirement, but older runtimes are outside the verified support range. Browser consumers use the UMD build.

## Usage

```ts
import Backbone from 'backbone';
import ModelRef from 'backbone-modelref';

class Dog extends Backbone.Model {}

const dogs = new Backbone.Collection<Dog>();
const dogRef = new ModelRef<Dog>(dogs, 'dog');

dogRef.on('loaded', (dog) => {
  if (dog) console.log('loaded', dog.id);
});

dogRef.on('unloaded', (dog) => {
  console.log('unloaded', dog.id);
});

dogs.add(new Dog({ id: 'dog' }));
```

CommonJS uses the same default export. For a script-tag build, load Underscore and Backbone first, then `backbone-modelref/umd`. The build installs `Backbone.ModelRef`.

## API parity

`Backbone.ModelRef` preserves the small common API historically shared with `Backbone.Model`:

| Function | `Backbone.Model` | `Backbone.ModelRef` |
| --- | --- | --- |
| `get('id')` | Returns the model ID | Returns the referenced ID; other attributes throw |
| `model()` | Returns itself | Returns the concrete model; `null` when ID-less or cleared, and `undefined` when an identified model is absent |
| `isLoaded()` | Returns `true` | Delegates to the model's `isLoaded()` when present |
| `bindLoadingStates(...)` | Calls `loaded` immediately | Calls `loaded` immediately when present and binds future state events |
| `unbindLoadingStates(...)` | Returns the model | Unbinds the supplied state callbacks |

A `ModelRef` starts with one owner. `retain()` adds an owner and returns the reference. `release()` removes one owner, returning `undefined` until the final release and the reference on final release. Final release removes only the reference's listeners; it never destroys or removes a model.

## Compatibility notes

This TypeScript port intentionally changes these published 0.1.5 lifecycle behaviors:

- Numeric ID `0` is tracked through load and unload transitions.
- Removal is detected with Backbone 1.2.3, whose `remove` event fires before `collection.get(id)` stops returning the removed model. Reads made inside the `unloaded` callback remain absent.
- A collection reset that replaces a model with a different instance of the same ID emits `unloaded(oldModel)` followed by `loaded(newModel)` and follows the replacement. Resetting with the same instance emits neither event. If an application callback removes or supersedes the replacement, the reference follows that newer state instead of emitting a stale load.

The regression suite also covers the two constructor forms, namespace and prototype installation, callback contexts, `null`/`undefined` absence values, and retain/release ownership semantics. Backbone's numeric/string-equivalent collection lookup behavior is preserved for referenced IDs.

## Development

```sh
npm install
npm run build
npm test
npm run test:engines
```

`npm run prepublishOnly` runs formatting, type validation, dependency checks, the build, and documentation generation. Publishing and versioning remain maintainer actions.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the historical release notes.
