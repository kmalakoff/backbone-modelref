'use strict';

const assert = require('assert');
const path = require('path');
const { createRequire } = require('module');

const localRequire = createRequire(path.join(process.cwd(), 'package.json'));
const Backbone = localRequire('backbone');
const ModelRef = localRequire('backbone-modelref');
const underscore = localRequire('underscore');

assert.strictEqual(ModelRef.VERSION, '0.1.5');
assert.strictEqual(Backbone.ModelRef, ModelRef);

function normalLifecycle() {
  const collection = new Backbone.Collection();
  const ref = new ModelRef(collection, 'dog');
  const events = [];
  const callbacks = {
    loaded(model) {
      events.push({ name: 'loaded', modelIsDog: model.id === 'dog', thisIsRef: this === ref });
    },
    unloaded(model) {
      events.push({ name: 'unloaded', modelIsDog: model.id === 'dog', thisIsRef: this === ref });
    },
  };
  const initial = {
    isLoaded: ref.isLoaded(),
    modelIsUndefined: ref.model() === undefined,
    bindReturnIsNull: ref.bindLoadingStates(callbacks) === null,
  };
  const dog = new Backbone.Model({ id: 'dog' });
  collection.add(dog);
  const afterAdd = { isLoaded: ref.isLoaded(), modelIsDog: ref.model() === dog };
  collection.remove(dog);
  const afterRemove = { isLoaded: ref.isLoaded(), modelIsUndefined: ref.model() === undefined };
  collection.reset([dog]);
  const afterReset = { isLoaded: ref.isLoaded(), modelIsDog: ref.model() === dog };

  return { initial, afterAdd, afterRemove, afterReset, events };
}

function idZeroLifecycle() {
  const collection = new Backbone.Collection();
  const absentRef = new ModelRef(collection, 0);
  const events = [];
  absentRef.on('loaded', (model) => events.push({ name: 'loaded', id: model.id }));
  absentRef.on('unloaded', (model) => events.push({ name: 'unloaded', id: model.id }));
  const zero = new Backbone.Model({ id: 0 });
  collection.add(zero);

  const afterAdd = {
    isLoaded: absentRef.isLoaded(),
    modelIsZero: absentRef.model() === zero,
    events: events.slice(),
  };

  const cachedRef = new ModelRef(collection, null, zero);
  collection.remove(zero);

  return {
    afterAdd,
    afterRemove: {
      isLoaded: absentRef.isLoaded(),
      modelIsZero: absentRef.model() === zero,
      events: events.slice(),
    },
    cachedThenRemoved: {
      isLoaded: cachedRef.isLoaded(),
      modelIsRemovedZero: cachedRef.model() === zero,
    },
  };
}

function sameIdReplacement() {
  const original = new Backbone.Model({ id: 'dog', name: 'original' });
  const replacement = new Backbone.Model({ id: 'dog', name: 'replacement' });
  const collection = new Backbone.Collection([original]);
  const ref = new ModelRef(collection, 'dog');
  const events = [];
  ref.on('loaded', (model) => events.push({ event: 'loaded', modelName: model.get('name') }));
  ref.on('unloaded', (model) => events.push({ event: 'unloaded', modelName: model.get('name') }));

  collection.reset([replacement]);

  return {
    collectionUsesReplacement: collection.get('dog') === replacement,
    refUsesOriginal: ref.model() === original,
    refUsesReplacement: ref.model() === replacement,
    events,
  };
}

function removalTiming() {
  const dog = new Backbone.Model({ id: 'dog' });
  const collection = new Backbone.Collection([dog]);
  let observation;
  collection.on('remove', (model, source) => {
    observation = {
      getStillReturnsRemovedModel: source.get('dog') === model,
      modelsStillContainsRemovedModel: source.models.indexOf(model) !== -1,
    };
  });
  const ref = new ModelRef(collection, 'dog');
  collection.remove(dog);

  return {
    duringRemove: observation,
    refIsLoadedAfterRemove: ref.isLoaded(),
    refStillUsesRemovedModel: ref.model() === dog,
  };
}

function unsavedModelLifecycle() {
  const draft = new Backbone.Model({ name: 'draft' });
  const collection = new Backbone.Collection([draft]);
  const ref = new ModelRef(collection, null, draft);
  const beforeAssignment = {
    modelIsDraft: ref.model() === draft,
    idIsUndefined: ref.get('id') === undefined,
  };
  draft.set('id', 'saved');
  const afterAssignment = {
    id: ref.get('id'),
    collectionFindsDraft: collection.get('saved') === draft,
  };
  collection.remove(draft);

  return {
    beforeAssignment,
    afterAssignment,
    afterRemove: {
      isLoaded: ref.isLoaded(),
      modelIsUndefined: ref.model() === undefined,
    },
  };
}

function absenceDistinctions() {
  const collection = new Backbone.Collection();
  const idlessRef = new ModelRef(collection, null);
  const missingRef = new ModelRef(collection, 'missing');
  const dog = collection.add({ id: 'dog' });
  const loadedRef = new ModelRef(collection, 'dog');
  const loadedModelWasDog = loadedRef.model() === dog;
  const clearReturn = loadedRef.model(null);

  return {
    idlessModelIsNull: idlessRef.model() === null,
    idlessGetModelIsNull: idlessRef.getModel() === null,
    missingModelIsUndefined: missingRef.model() === undefined,
    missingGetModelIsUndefined: missingRef.getModel() === undefined,
    loadedModelWasDog,
    clearReturnIsUndefined: clearReturn === undefined,
    clearedIdIsNull: loadedRef.get('id') === null,
    clearedModelIsNull: loadedRef.model() === null,
    clearedGetModelIsNull: loadedRef.getModel() === null,
  };
}

function callbacksAndReturns() {
  const model = new Backbone.Model({ id: 'dog' });
  const collection = new Backbone.Collection([model]);
  const ref = new ModelRef(collection, 'dog');
  const functionCall = {};
  const functionReturn = model.bindLoadingStates(function (argument) {
    functionCall.argumentIsModel = argument === model;
    functionCall.thisIsUndefined = this === undefined;
  });
  const params = {
    loaded(argument) {
      this.argumentIsModel = argument === model;
      this.thisIsParams = this === params;
    },
  };
  const objectReturn = model.bindLoadingStates(params);
  const immediate = {};
  const loadingStates = {
    loaded(argument) {
      immediate.argumentIsModel = argument === model;
      immediate.thisIsParams = this === loadingStates;
      immediate.thisIsRef = this === ref;
    },
  };
  const refBindReturn = ref.bindLoadingStates(loadingStates);
  const retainReturn = ref.retain();
  const firstReleaseReturn = ref.release();
  const finalReleaseReturn = ref.release();
  let overReleaseError;
  try {
    ref.release();
  } catch (error) {
    overReleaseError = error.message;
  }

  return {
    functionCallback: functionCall,
    functionReturnIsModel: functionReturn === model,
    objectCallback: {
      argumentIsModel: params.argumentIsModel,
      thisIsParams: params.thisIsParams,
    },
    objectReturnIsModel: objectReturn === model,
    refImmediateCallback: immediate,
    refBindReturnIsModel: refBindReturn === model,
    retainReturnIsRef: retainReturn === ref,
    firstReleaseReturnIsUndefined: firstReleaseReturn === undefined,
    finalReleaseReturnIsRef: finalReleaseReturn === ref,
    finalReleaseClearsCollection: ref.collection === null,
    overReleaseError,
  };
}

function collectionOwnership() {
  const collection = new Backbone.Collection();
  let retains = 0;
  let releases = 0;
  collection.retain = () => {
    retains += 1;
  };
  collection.release = () => {
    releases += 1;
  };
  const ref = new ModelRef(collection, 'dog');
  ref.release();
  return { retains, releases };
}

const sideEffects = {
  namespaceInstalled: Backbone.ModelRef === ModelRef,
  model: typeof Backbone.Model.prototype.model,
  isLoaded: typeof Backbone.Model.prototype.isLoaded,
  bindLoadingStates: typeof Backbone.Model.prototype.bindLoadingStates,
  unbindLoadingStates: typeof Backbone.Model.prototype.unbindLoadingStates,
};

const result = {
  package: {
    modelref: ModelRef.VERSION,
    backbone: Backbone.VERSION,
    underscore: underscore.VERSION,
  },
  sideEffects,
  normalLifecycle: normalLifecycle(),
  idZeroLifecycle: idZeroLifecycle(),
  sameIdReplacement: sameIdReplacement(),
  removalTiming: removalTiming(),
  unsavedModelLifecycle: unsavedModelLifecycle(),
  absenceDistinctions: absenceDistinctions(),
  callbacksAndReturns: callbacksAndReturns(),
  collectionOwnership: collectionOwnership(),
};

assert.deepStrictEqual(result.package, {
  modelref: '0.1.5',
  backbone: Backbone.VERSION,
  underscore: '1.13.7',
});
assert.ok(['1.2.3', '1.3.3', '1.4.1', '1.6.1'].includes(Backbone.VERSION));
assert.deepStrictEqual(sideEffects, {
  namespaceInstalled: true,
  model: 'function',
  isLoaded: 'function',
  bindLoadingStates: 'function',
  unbindLoadingStates: 'function',
});
assert.deepStrictEqual(result.normalLifecycle.initial, {
  isLoaded: false,
  modelIsUndefined: true,
  bindReturnIsNull: true,
});
assert.deepStrictEqual(result.normalLifecycle.afterAdd, { isLoaded: true, modelIsDog: true });
assert.deepStrictEqual(
  result.normalLifecycle.events,
  Backbone.VERSION === '1.2.3'
    ? [{ name: 'loaded', modelIsDog: true, thisIsRef: true }]
    : [
        { name: 'loaded', modelIsDog: true, thisIsRef: true },
        { name: 'unloaded', modelIsDog: true, thisIsRef: true },
        { name: 'loaded', modelIsDog: true, thisIsRef: true },
      ]
);
assert.deepStrictEqual(result.normalLifecycle.afterReset, { isLoaded: true, modelIsDog: true });
assert.deepStrictEqual(result.idZeroLifecycle, {
  afterAdd: { isLoaded: false, modelIsZero: false, events: [] },
  afterRemove: { isLoaded: false, modelIsZero: false, events: [] },
  cachedThenRemoved: { isLoaded: true, modelIsRemovedZero: true },
});
assert.deepStrictEqual(result.sameIdReplacement, {
  collectionUsesReplacement: true,
  refUsesOriginal: true,
  refUsesReplacement: false,
  events: [],
});
assert.deepStrictEqual(result.callbacksAndReturns, {
  functionCallback: { argumentIsModel: true, thisIsUndefined: true },
  functionReturnIsModel: true,
  objectCallback: { argumentIsModel: true, thisIsParams: true },
  objectReturnIsModel: true,
  refImmediateCallback: { argumentIsModel: true, thisIsParams: true, thisIsRef: false },
  refBindReturnIsModel: true,
  retainReturnIsRef: true,
  firstReleaseReturnIsUndefined: true,
  finalReleaseReturnIsRef: true,
  finalReleaseClearsCollection: true,
  overReleaseError: 'Backbone.ModelRef.release(): ref count is corrupt',
});
assert.deepStrictEqual(result.collectionOwnership, { retains: 0, releases: 0 });
assert.deepStrictEqual(result.unsavedModelLifecycle.beforeAssignment, {
  modelIsDraft: true,
  idIsUndefined: true,
});
assert.deepStrictEqual(result.unsavedModelLifecycle.afterAssignment, {
  id: 'saved',
  collectionFindsDraft: true,
});
assert.deepStrictEqual(result.absenceDistinctions, {
  idlessModelIsNull: true,
  idlessGetModelIsNull: true,
  missingModelIsUndefined: true,
  missingGetModelIsUndefined: true,
  loadedModelWasDog: true,
  clearReturnIsUndefined: true,
  clearedIdIsNull: true,
  clearedModelIsNull: true,
  clearedGetModelIsNull: true,
});

if (Backbone.VERSION === '1.2.3') {
  assert.deepStrictEqual(result.normalLifecycle.afterRemove, { isLoaded: true, modelIsUndefined: false });
  assert.deepStrictEqual(result.removalTiming, {
    duringRemove: { getStillReturnsRemovedModel: true, modelsStillContainsRemovedModel: false },
    refIsLoadedAfterRemove: true,
    refStillUsesRemovedModel: true,
  });
  assert.deepStrictEqual(result.unsavedModelLifecycle.afterRemove, {
    isLoaded: true,
    modelIsUndefined: false,
  });
} else {
  assert.deepStrictEqual(result.normalLifecycle.afterRemove, { isLoaded: false, modelIsUndefined: true });
  assert.deepStrictEqual(result.removalTiming, {
    duringRemove: { getStillReturnsRemovedModel: false, modelsStillContainsRemovedModel: false },
    refIsLoadedAfterRemove: false,
    refStillUsesRemovedModel: false,
  });
  assert.deepStrictEqual(result.unsavedModelLifecycle.afterRemove, {
    isLoaded: false,
    modelIsUndefined: true,
  });
}

console.log(JSON.stringify(result, null, 2));
