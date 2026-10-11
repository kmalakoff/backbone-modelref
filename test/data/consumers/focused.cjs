'use strict';

const assert = require('assert');
const path = require('path');
const { createRequire } = require('module');

const consumerRequire = createRequire(path.join(process.cwd(), 'package.json'));
const Backbone = consumerRequire('backbone');
const ModelRef = consumerRequire('backbone-modelref');

function verifyEquivalentIds(referenceId, modelId) {
  const collection = new Backbone.Collection();
  const ref = new ModelRef(collection, referenceId);
  const model = new Backbone.Model({ id: modelId });
  const loaded = [];
  ref.on('loaded', (value) => loaded.push(value));
  collection.add(model);
  assert.deepStrictEqual(loaded, [model]);
  assert.strictEqual(ref.model(), model);
}

verifyEquivalentIds('1', 1);
verifyEquivalentIds(1, '1');
verifyEquivalentIds(0, 0);

{
  const collection = new Backbone.Collection();
  const idlessRef = new ModelRef(collection, null);
  const missingRef = new ModelRef(collection, 'missing');
  assert.strictEqual(idlessRef.model(), null);
  assert.strictEqual(idlessRef.getModel(), null);
  assert.strictEqual(missingRef.model(), undefined);
  assert.strictEqual(missingRef.getModel(), undefined);

  const dog = collection.add({ id: 'dog' });
  const loadedRef = new ModelRef(collection, 'dog');
  assert.strictEqual(loadedRef.model(), dog);
  assert.strictEqual(loadedRef.model(null), undefined);
  assert.strictEqual(loadedRef.get('id'), null);
  assert.strictEqual(loadedRef.model(), null);
  assert.strictEqual(loadedRef.getModel(), null);
}

{
  const model = new Backbone.Model({ id: 'remove' });
  const collection = new Backbone.Collection([model]);
  const ref = new ModelRef(collection, 'remove');
  let callbackModel;
  let callbackLoaded;
  let loadedCount = 0;
  ref.on('loaded', () => loadedCount++);
  ref.on('unloaded', () => {
    callbackModel = ref.model();
    callbackLoaded = ref.isLoaded();
  });
  collection.remove(model);
  assert.strictEqual(callbackModel, undefined);
  assert.strictEqual(callbackLoaded, false);
  assert.strictEqual(ref.model(), undefined);
  assert.strictEqual(ref.isLoaded(), false);
  collection.add(model);
  assert.strictEqual(ref.model(), model);
  assert.strictEqual(loadedCount, 1);
}

{
  const original = new Backbone.Model({ id: 'replace', name: 'original' });
  const replacement = new Backbone.Model({ id: 'replace', name: 'replacement' });
  const collection = new Backbone.Collection([original]);
  const ref = new ModelRef(collection, 'replace');
  const events = [];
  ref.on('unloaded', (model) => {
    events.push(['unloaded', model]);
    collection.remove(replacement);
  });
  ref.on('loaded', (model) => events.push(['loaded', model]));
  collection.reset([replacement]);
  assert.strictEqual(collection.length, 0);
  assert.strictEqual(ref.model(), undefined);
  assert.deepStrictEqual(events, [['unloaded', original]]);
}

function verifyReplacementRead(read, expectedRead) {
  const original = new Backbone.Model({ id: 'read', name: 'original' });
  const replacement = new Backbone.Model({ id: 'read', name: 'replacement' });
  const collection = new Backbone.Collection([original]);
  const ref = new ModelRef(collection, 'read');
  const events = [];
  let callbackRead;
  ref.on('unloaded', (model) => {
    events.push(['unloaded', model]);
    callbackRead = read(ref);
  });
  ref.on('loaded', (model) => events.push(['loaded', model]));
  collection.reset([replacement]);
  assert.strictEqual(callbackRead, expectedRead(replacement));
  assert.strictEqual(ref.model(), replacement);
  assert.deepStrictEqual(events, [
    ['unloaded', original],
    ['loaded', replacement],
  ]);
}

verifyReplacementRead(
  (ref) => ref.model(),
  (replacement) => replacement,
);
verifyReplacementRead(
  (ref) => ref.getModel(),
  (replacement) => replacement,
);
verifyReplacementRead(
  (ref) => ref.isLoaded(),
  () => true,
);

{
  const original = new Backbone.Model({ id: 'nested', name: 'original' });
  const outer = new Backbone.Model({ id: 'nested', name: 'outer' });
  const nested = new Backbone.Model({ id: 'nested', name: 'nested' });
  const collection = new Backbone.Collection([original]);
  const ref = new ModelRef(collection, 'nested');
  const events = [];
  ref.on('unloaded', (model) => {
    events.push(['unloaded', model]);
    collection.reset([nested]);
  });
  ref.on('loaded', (model) => events.push(['loaded', model]));
  collection.reset([outer]);
  assert.strictEqual(ref.model(), nested);
  assert.deepStrictEqual(events, [
    ['unloaded', original],
    ['loaded', nested],
  ]);
}

{
  const original = new Backbone.Model({ id: 'switch', name: 'original' });
  const outer = new Backbone.Model({ id: 'switch', name: 'outer' });
  const explicit = new Backbone.Model({ id: 'explicit' });
  const collection = new Backbone.Collection([original, explicit]);
  const ref = new ModelRef(collection, 'switch');
  ref.on('unloaded', () => ref.model(explicit));
  collection.reset([outer, explicit]);
  assert.strictEqual(ref.get('id'), 'explicit');
  assert.strictEqual(ref.model(), explicit);
}

console.log(`focused lifecycle pass: Backbone ${Backbone.VERSION}`);
