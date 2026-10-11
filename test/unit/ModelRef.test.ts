import assert from 'assert';
import Backbone from 'backbone';
import ModelRef from 'backbone-modelref';

class TestModel extends Backbone.Model {
  model_loaded?: number;
  model_unloaded?: number;
  model_ref_loaded?: number;
  model_ref_unloaded?: number;
  model_ref2_loaded?: number;
  model_ref2_unloaded?: number;
}

class TestCollection extends Backbone.Collection<TestModel> {
  model = TestModel;
}

type CounterName = 'model_loaded' | 'model_unloaded' | 'model_ref_loaded' | 'model_ref_unloaded' | 'model_ref2_loaded' | 'model_ref2_unloaded';

function createCounter(counter: CounterName) {
  return (model: TestModel | null | undefined) => {
    assert.ok(model);
    model[counter] = (model[counter] ?? 0) + 1;
  };
}

function assertReplacementRead(read: (ref: ModelRef<TestModel>) => unknown, expectedRead: (replacement: TestModel) => unknown) {
  const original = new TestModel({ id: 'dog', name: 'original' });
  const replacement = new TestModel({ id: 'dog', name: 'replacement' });
  const collection = new TestCollection([original]);
  const modelRef = new ModelRef<TestModel>(collection, 'dog');
  const events: Array<[string, TestModel]> = [];
  let callbackRead: unknown;
  modelRef.on('unloaded', (model) => {
    events.push(['unloaded', model]);
    callbackRead = read(modelRef);
  });
  modelRef.on('loaded', (model) => {
    assert.ok(model);
    events.push(['loaded', model]);
  });

  collection.reset([replacement]);

  assert.strictEqual(callbackRead, expectedRead(replacement));
  assert.strictEqual(modelRef.model(), replacement);
  assert.deepStrictEqual(events, [
    ['unloaded', original],
    ['loaded', replacement],
  ]);
}

describe('ModelRef legacy behavior', () => {
  it('installs its dependencies and namespace', () => {
    assert.ok(Backbone);
    assert.ok(Backbone.ModelRef);
    assert.ok(ModelRef);
  });

  it('tracks a model without event subscribers', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    assert.equal(modelRef.isLoaded(), false, 'model_ref is not yet loaded');
    assert.ok(!modelRef.getModel(), 'model_ref is not yet loaded');

    collection.add({ id: 'cat' });
    assert.equal(modelRef.isLoaded(), false, 'model_ref is not yet loaded');
    assert.ok(!modelRef.getModel(), 'model_ref is not yet loaded');

    collection.add({ id: 'dog' });
    assert.equal(modelRef.isLoaded(), true, 'model_ref is loaded');
    assert.equal(modelRef.getModel(), collection.get('dog'), 'model_ref is loaded');

    collection.remove(collection.get('dog') as TestModel);
    assert.equal(modelRef.isLoaded(), false, 'model_ref is no longer loaded');
    assert.ok(!modelRef.getModel(), 'model_ref is no longer loaded');

    collection.add({ id: 'dog' });
    assert.equal(modelRef.isLoaded(), true, 'model_ref is loaded again');
    assert.equal(modelRef.getModel(), collection.get('dog'), 'model_ref is loaded again');

    collection.reset();
    assert.equal(modelRef.isLoaded(), false, 'model_ref is no longer loaded');
    assert.ok(!modelRef.getModel(), 'model_ref is no longer loaded');
  });

  it('tracks a model with loaded and unloaded events', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    let testModel: TestModel | null = null;
    let loadedCount = 0;
    modelRef.bind('loaded', (model) => {
      loadedCount++;
      assert.equal(model, testModel, 'loaded model matches');
    });
    modelRef.bind('unloaded', (model) => {
      loadedCount--;
      assert.equal(model, testModel, 'unloaded model matches');
    });
    assert.equal(loadedCount, 0, 'test model is not loaded');

    testModel = new TestModel({ id: 'dog' });
    assert.equal(loadedCount, 0, 'test model is not loaded');
    collection.add(testModel);
    assert.equal(loadedCount, 1, 'test model is loaded');
    collection.remove(testModel);
    assert.equal(loadedCount, 0, 'test model is not loaded again');
    collection.add(testModel);
    assert.equal(loadedCount, 1, 'test model is loaded again');
    collection.reset();
    assert.equal(loadedCount, 0, 'test model is not loaded again, again');
  });

  it('supports a retained reference in a view', () => {
    class TestView {
      isWaiting = true;
      modelRef: ModelRef<TestModel> | null;

      constructor(modelRef: ModelRef<TestModel>) {
        this.modelRef = modelRef.retain();
        modelRef.bind('loaded', this.render, this);
        modelRef.bind('unloaded', this.renderWaiting, this);
        if (modelRef.isLoaded()) this.render();
        else this.renderWaiting();
      }

      render() {
        this.isWaiting = false;
      }

      renderWaiting() {
        this.isWaiting = true;
      }

      destroy() {
        this.modelRef?.release();
        this.modelRef = null;
      }
    }

    const collection = new TestCollection();
    const view = new TestView(new ModelRef<TestModel>(collection, 'dog'));
    assert.equal(view.isWaiting, true, 'view is in waiting state');
    collection.add({ id: 'dog' });
    assert.equal(view.isWaiting, false, 'view is in render state');
    const model = collection.get('dog') as TestModel;
    collection.reset();
    assert.equal(view.isWaiting, true, 'view is in waiting state again');
    collection.add(model);
    assert.equal(view.isWaiting, false, 'view is in render state again');
    view.destroy();
  });

  it('emulates the simple Backbone.Model API signatures', () => {
    const collection = new TestCollection();
    const model = new TestModel({ id: 'dog', name: 'Rover' });
    const modelRef = new ModelRef<TestModel>(collection, 'dog');

    assert.equal(model.get('id'), 'dog', 'can get an id');
    assert.equal(modelRef.get('id'), 'dog', 'can get an id');
    assert.equal(model.get('name'), 'Rover', 'can get an attribute');
    assert.throws(() => (modelRef.get as (attribute: string) => unknown)('name'), Error);
    assert.equal(model.model(), model, 'can get self');
    assert.equal(modelRef.model(), null, 'model is not yet loaded');
    assert.equal(model.isLoaded(), true, 'model is always loaded');
    assert.equal(modelRef.isLoaded(), false, 'model is not yet loaded');

    collection.add(model);
    assert.equal(model.get('id'), 'dog', 'can get an id');
    assert.equal(modelRef.get('id'), 'dog', 'can get an id');
    assert.equal(model.get('name'), 'Rover', 'can get an attribute');
    assert.throws(() => (modelRef.get as (attribute: string) => unknown)('name'), Error);
    assert.equal(model.model(), model, 'can get self');
    assert.equal(modelRef.model(), model, 'model is now loaded');
    assert.equal(model.isLoaded(), true, 'model is always loaded');
    assert.equal(modelRef.isLoaded(), true, 'model is now loaded');

    collection.reset();
    assert.equal(model.get('id'), 'dog', 'can get an id');
    assert.equal(modelRef.get('id'), 'dog', 'can get an id');
    assert.equal(model.get('name'), 'Rover', 'can get an attribute');
    assert.throws(() => (modelRef.get as (attribute: string) => unknown)('name'), Error);
    assert.equal(model.model(), model, 'can get self');
    assert.equal(modelRef.model(), null, 'model is not yet loaded');
    assert.equal(model.isLoaded(), true, 'model is always loaded');
    assert.equal(modelRef.isLoaded(), false, 'model is not yet loaded');
  });

  it('preserves null and undefined absence distinctions', () => {
    const collection = new TestCollection();
    const idlessRef = new ModelRef<TestModel>(collection, null);
    const missingRef = new ModelRef<TestModel>(collection, 'missing');

    assert.strictEqual(idlessRef.model(), null);
    assert.strictEqual(idlessRef.getModel(), null);
    assert.strictEqual(missingRef.model(), undefined);
    assert.strictEqual(missingRef.getModel(), undefined);

    const dog = collection.add({ id: 'dog' });
    const loadedRef = new ModelRef<TestModel>(collection, 'dog');
    assert.strictEqual(loadedRef.model(), dog);
    assert.strictEqual(loadedRef.model(null), undefined);
    assert.strictEqual(loadedRef.get('id'), null);
    assert.strictEqual(loadedRef.model(), null);
    assert.strictEqual(loadedRef.getModel(), null);
  });

  it('emulates loading-state binding', () => {
    const collection = new TestCollection();
    const model = new TestModel({ id: 'dog', name: 'Rover' });
    const modelRef = new ModelRef<TestModel>(collection, 'dog');

    model.bindLoadingStates(createCounter('model_loaded'));
    assert.equal(model.model_loaded, 1, 'loaded model callback is immediate');

    model.bindLoadingStates({
      loaded: createCounter('model_loaded'),
      unloaded: createCounter('model_unloaded'),
    });
    assert.equal(model.model_loaded, 2, 'loaded model callback is immediate');
    assert.equal(model.model_unloaded, undefined, 'model never unloads');

    modelRef.bindLoadingStates(createCounter('model_ref_loaded'));
    assert.equal((modelRef as unknown as { model_ref_loaded?: number }).model_ref_loaded, undefined, 'unloaded ref is not called immediately');
    collection.add(model);
    assert.equal(modelRef.isLoaded(), true, 'model ref is loaded');
    assert.equal(model.model_ref_loaded, 1, 'model is now loaded');
    collection.reset();
    assert.equal(modelRef.isLoaded(), false, 'model ref not loaded');
    assert.equal(model.model_ref_loaded, 1, 'unload does not call a loaded callback');

    modelRef.bindLoadingStates({
      loaded: createCounter('model_ref_loaded'),
      unloaded: createCounter('model_ref_unloaded'),
    });
    assert.equal(model.model_ref_loaded, 1, 'model still unloaded');
    assert.equal(model.model_ref_unloaded, undefined, 'unloaded callback not yet called');
    collection.add(model);
    assert.equal(modelRef.isLoaded(), true, 'model ref is loaded');
    assert.equal(model.model_ref_loaded, 3, 'both loaded bindings were called');
    assert.equal(model.model_ref_unloaded, undefined, 'unloaded callback not yet called');
    collection.reset();
    assert.equal(modelRef.isLoaded(), false, 'model ref not loaded');
    assert.equal(model.model_ref_loaded, 3, 'unload does not call loaded callbacks');
    assert.equal(model.model_ref_unloaded, 1, 'unload is recorded');

    const modelRef2 = new ModelRef<TestModel>(collection, 'dog');
    collection.add(model);
    modelRef2.bindLoadingStates({
      loaded: createCounter('model_ref2_loaded'),
      unloaded: createCounter('model_ref2_unloaded'),
    });
    assert.equal(modelRef2.isLoaded(), true, 'model ref is loaded');
    assert.equal(model.model_ref2_loaded, 1, 'already-loaded callback is immediate');
    assert.equal(model.model_ref2_unloaded, undefined, 'unloaded callback not yet called');
    collection.reset();
    assert.equal(modelRef2.isLoaded(), false, 'model ref not loaded');
    assert.equal(model.model_ref2_loaded, 1, 'unload does not call loaded callback');
    assert.equal(model.model_ref2_unloaded, 1, 'unload is recorded');
  });

  it('changes the referenced model', () => {
    const collection = new TestCollection();
    const dog = new TestModel({ id: 'dog', name: 'Rover' });
    const cat = new TestModel({ id: 'cat', name: 'Kitty' });
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    modelRef.bindLoadingStates({
      loaded: createCounter('model_ref_loaded'),
      unloaded: createCounter('model_ref_unloaded'),
    });
    const modelRef2 = new ModelRef<TestModel>(collection, 'dog');

    assert.equal((modelRef as unknown as { model_ref_loaded?: number }).model_ref_loaded, undefined, 'model is not loaded');
    collection.add(dog);
    assert.equal(modelRef.isLoaded(), true, 'model ref is loaded');
    assert.equal(dog.model_ref_loaded, 1, 'dog is loaded');
    collection.reset();
    assert.equal(modelRef.isLoaded(), false, 'model ref not loaded');
    assert.equal(dog.model_ref_loaded, 1, 'dog unload did not call loaded');
    assert.equal(dog.model_ref_unloaded, 1, 'dog was unloaded');

    collection.add([dog, cat]);
    assert.equal(modelRef.isLoaded(), true, 'model ref is loaded');
    assert.equal(dog.model_ref_loaded, 2, 'dog is loaded again');
    modelRef.model(cat);
    assert.equal(dog.model_ref_unloaded, 2, 'dog was unloaded');
    assert.equal(modelRef.isLoaded(), true, 'model ref is loaded');
    assert.equal(cat.model_ref_loaded, 1, 'cat was loaded');
    collection.reset();
    assert.equal(modelRef.isLoaded(), false, 'model ref is unloaded');
    assert.equal(cat.model_ref_unloaded, 1, 'cat was unloaded');

    collection.add([dog, cat]);
    modelRef.model(modelRef2);
    assert.equal(cat.model_ref_unloaded, 2, 'cat was unloaded');
    assert.equal(modelRef.isLoaded(), true, 'model ref is loaded');
    assert.equal(dog.model_ref_loaded, 3, 'dog was loaded');
    collection.reset();
    assert.equal(modelRef.isLoaded(), false, 'model ref is unloaded');
    assert.equal(dog.model_ref_unloaded, 3, 'dog was unloaded');
  });

  it('preserves expected errors', () => {
    assert.throws(() => new ModelRef<TestModel>(null as unknown as TestCollection, 'dog'), /collection is missing/);

    let modelRef = new ModelRef(new Backbone.Collection(), null, new Backbone.Model({ id: 'hello' }));
    assert.equal(modelRef.get('id'), 'hello', 'gets the cached model id');
    assert.throws(() => (modelRef.get as (attribute: string) => unknown)('foo'), /only id is permitted/);
    modelRef.release();
    assert.throws(() => modelRef.release(), /ref count is corrupt/);

    modelRef = new ModelRef(new Backbone.Collection(), 'hello');
    assert.equal(modelRef.get('id'), 'hello', 'gets the requested id');
    assert.throws(() => (modelRef.get as (attribute: string) => unknown)('foo'), /only id is permitted/);
  });
});

describe('ModelRef corrected lifecycle behavior', () => {
  it('preserves immediate and event callback contexts and returns', () => {
    const dog = new TestModel({ id: 'dog' });
    const collection = new TestCollection([dog]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const contexts: unknown[] = [];
    const states = {
      loaded(this: unknown, model: TestModel | null | undefined) {
        assert.ok(model);
        contexts.push(this);
        assert.equal(model, dog);
      },
      unloaded(this: unknown, model: TestModel) {
        contexts.push(this);
        assert.equal(model, dog);
      },
    };
    assert.equal(modelRef.bindLoadingStates(states), dog);
    assert.equal(contexts[0], states);
    collection.remove(dog);
    assert.equal(contexts[1], modelRef);
    assert.equal(modelRef.unbindLoadingStates(states), undefined);
  });

  it('uses explicit contexts for on, bind, once, and event maps', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const onContext = { calls: 0 };
    const bindContext = { calls: 0 };
    const onceContext = { calls: 0 };
    const mapContext = { calls: 0 };

    modelRef.on(
      'loaded',
      function (model) {
        assert.ok(model);
        assert.strictEqual(this, onContext);
        this.calls++;
      },
      onContext
    );
    modelRef.bind(
      'loaded',
      function (model) {
        assert.ok(model);
        assert.strictEqual(this, bindContext);
        this.calls++;
      },
      bindContext
    );
    modelRef.once(
      'loaded',
      function (model) {
        assert.ok(model);
        assert.strictEqual(this, onceContext);
        this.calls++;
      },
      onceContext
    );
    modelRef.on(
      {
        loaded(model) {
          assert.ok(model);
          assert.strictEqual(this, mapContext);
          this.calls++;
        },
      },
      mapContext
    );

    collection.add({ id: 'dog' });
    collection.reset();
    collection.add({ id: 'dog' });

    assert.deepStrictEqual([onContext.calls, bindContext.calls, onceContext.calls, mapContext.calls], [2, 2, 1, 2]);
  });

  it('tracks ID 0 through add and remove', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 0);
    const model = new TestModel({ id: 0 });
    const events: string[] = [];
    modelRef.on('loaded', () => events.push('loaded'));
    modelRef.on('unloaded', () => events.push('unloaded'));
    collection.add(model);
    assert.equal(modelRef.model(), model);
    collection.remove(model);
    assert.equal(modelRef.model(), undefined);
    assert.deepEqual(events, ['loaded', 'unloaded']);
  });

  it('uses collection lookup semantics for numeric and string IDs', () => {
    for (const [referenceId, modelId] of [
      ['1', 1],
      [1, '1'],
    ] as const) {
      const collection = new TestCollection();
      const modelRef = new ModelRef<TestModel>(collection, referenceId);
      const model = new TestModel({ id: modelId });
      const loaded: Array<TestModel | null | undefined> = [];
      modelRef.on('loaded', (loadedModel) => loaded.push(loadedModel));

      collection.add(model);

      assert.equal(modelRef.model(), model);
      assert.deepEqual(loaded, [model]);
    }
  });

  it('tracks a cached ID 0 model through removal', () => {
    const model = new TestModel({ id: 0 });
    const collection = new TestCollection([model]);
    const modelRef = new ModelRef<TestModel>(collection, null, model);
    collection.remove(model);
    assert.equal(modelRef.isLoaded(), false);
    assert.equal(modelRef.model(), undefined);
  });

  it('uses the remove event model on Backbone 1.2.3-compatible timing', () => {
    const model = new TestModel({ id: 'dog' });
    const collection = new TestCollection([model]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    collection.remove(model);
    assert.equal(modelRef.isLoaded(), false);
    assert.equal(modelRef.model(), undefined);
  });

  it('cannot recache a removed model from an unloaded callback', () => {
    const model = new TestModel({ id: 'dog' });
    const collection = new TestCollection([model]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const callbackState: Array<[TestModel | null | undefined, boolean]> = [];
    const events: string[] = [];
    modelRef.on('loaded', () => events.push('loaded'));
    modelRef.on('unloaded', () => {
      events.push('unloaded');
      callbackState.push([modelRef.model(), modelRef.isLoaded()]);
    });

    collection.remove(model);

    assert.deepEqual(callbackState, [[undefined, false]]);
    assert.equal(collection.length, 0);
    assert.equal(modelRef.model(), undefined);
    assert.equal(modelRef.isLoaded(), false);

    collection.add(model);
    assert.equal(modelRef.model(), model);
    assert.deepEqual(events, ['unloaded', 'loaded']);
  });

  it('unloads the old instance and loads the replacement on same-ID reset', () => {
    const original = new TestModel({ id: 'dog', name: 'original' });
    const replacement = new TestModel({ id: 'dog', name: 'replacement' });
    const collection = new TestCollection([original]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const events: Array<[string, TestModel]> = [];
    modelRef.on('unloaded', (model) => events.push(['unloaded', model]));
    modelRef.on('loaded', (model) => {
      assert.ok(model);
      events.push(['loaded', model]);
    });
    collection.reset([replacement]);
    assert.equal(modelRef.model(), replacement);
    assert.deepEqual(events, [
      ['unloaded', original],
      ['loaded', replacement],
    ]);
  });

  it('finishes a same-ID replacement after model() is read during unloaded', () => {
    assertReplacementRead(
      (modelRef) => modelRef.model(),
      (replacement) => replacement
    );
  });

  it('finishes a same-ID replacement after getModel() is read during unloaded', () => {
    assertReplacementRead(
      (modelRef) => modelRef.getModel(),
      (replacement) => replacement
    );
  });

  it('finishes a same-ID replacement after isLoaded() is read during unloaded', () => {
    assertReplacementRead(
      (modelRef) => modelRef.isLoaded(),
      () => true
    );
  });

  it('does not load a replacement removed during the unloaded callback', () => {
    const original = new TestModel({ id: 'dog', name: 'original' });
    const replacement = new TestModel({ id: 'dog', name: 'replacement' });
    const collection = new TestCollection([original]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const events: Array<[string, TestModel]> = [];
    modelRef.on('unloaded', (model) => {
      events.push(['unloaded', model]);
      collection.remove(replacement);
    });
    modelRef.on('loaded', (model) => {
      assert.ok(model);
      events.push(['loaded', model]);
    });

    collection.reset([replacement]);

    assert.equal(collection.length, 0);
    assert.equal(modelRef.model(), undefined);
    assert.deepEqual(events, [['unloaded', original]]);
  });

  it('lets a nested reset supersede an outer same-ID replacement', () => {
    const original = new TestModel({ id: 'dog', name: 'original' });
    const outerReplacement = new TestModel({ id: 'dog', name: 'outer' });
    const nestedReplacement = new TestModel({ id: 'dog', name: 'nested' });
    const collection = new TestCollection([original]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const events: Array<[string, TestModel]> = [];
    modelRef.on('unloaded', (model) => {
      events.push(['unloaded', model]);
      collection.reset([nestedReplacement]);
    });
    modelRef.on('loaded', (model) => {
      assert.ok(model);
      events.push(['loaded', model]);
    });

    collection.reset([outerReplacement]);

    assert.equal(modelRef.model(), nestedReplacement);
    assert.deepEqual(events, [
      ['unloaded', original],
      ['loaded', nestedReplacement],
    ]);
  });

  it('lets an explicit model switch supersede an outer reset', () => {
    const original = new TestModel({ id: 'dog', name: 'original' });
    const outerReplacement = new TestModel({ id: 'dog', name: 'outer' });
    const cat = new TestModel({ id: 'cat', name: 'cat' });
    const collection = new TestCollection([original, cat]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const events: Array<[string, TestModel]> = [];
    modelRef.on('unloaded', (model) => {
      events.push(['unloaded', model]);
      modelRef.model(cat);
    });
    modelRef.on('loaded', (model) => {
      assert.ok(model);
      events.push(['loaded', model]);
    });

    collection.reset([outerReplacement, cat]);

    assert.equal(modelRef.get('id'), 'cat');
    assert.equal(modelRef.model(), cat);
    assert.deepEqual(events, [
      ['unloaded', original],
      ['loaded', cat],
    ]);
  });

  it('preserves loaded(undefined) when switching to an absent reference', () => {
    const dog = new TestModel({ id: 'dog' });
    const collection = new TestCollection([dog]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    const absentRef = new ModelRef<TestModel>(collection, 'cat');
    const loaded: Array<TestModel | null | undefined> = [];
    modelRef.on('loaded', (model) => loaded.push(model));

    assert.equal(modelRef.model(absentRef), modelRef);
    assert.equal(modelRef.get('id'), 'cat');
    assert.equal(modelRef.model(), undefined);
    assert.deepEqual(loaded, [undefined]);
  });

  it('does not churn when reset retains the same instance', () => {
    const model = new TestModel({ id: 'dog' });
    const collection = new TestCollection([model]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    let events = 0;
    modelRef.on('unloaded', () => events++);
    modelRef.on('loaded', () => events++);
    collection.reset([model]);
    assert.equal(modelRef.model(), model);
    assert.equal(events, 0);
  });

  it('does not unload when an unrelated model is removed', () => {
    const dog = new TestModel({ id: 'dog' });
    const cat = new TestModel({ id: 'cat' });
    const collection = new TestCollection([dog, cat]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    let unloaded = 0;
    modelRef.on('unloaded', () => unloaded++);
    collection.remove(cat);
    assert.equal(modelRef.model(), dog);
    assert.equal(unloaded, 0);
  });

  it('upgrades an unsaved cached model when its ID is assigned', () => {
    const draft = new TestModel({ name: 'draft' });
    const collection = new TestCollection([draft]);
    const modelRef = new ModelRef<TestModel>(collection, null, draft);
    assert.equal(modelRef.get('id'), undefined);
    draft.set('id', 'saved');
    assert.equal(modelRef.get('id'), 'saved');
    collection.remove(draft);
    assert.equal(modelRef.model(), undefined);
  });

  it('keeps shared ownership until the final release', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    assert.equal(modelRef.retain(), modelRef);
    assert.equal(modelRef.release(), undefined);
    const dog = collection.add({ id: 'dog' });
    assert.equal(modelRef.model(), dog);
    assert.equal(modelRef.release(), modelRef);
    assert.equal(modelRef.collection, null);
  });

  it('rejects over-release', () => {
    const modelRef = new ModelRef<TestModel>(new TestCollection(), 'dog');
    assert.equal(modelRef.release(), modelRef);
    assert.throws(() => modelRef.release(), /ref count is corrupt/);
  });

  it('removes exactly its collection listeners on final release', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    let unrelatedAdds = 0;
    const unrelated = () => unrelatedAdds++;
    collection.on('add', unrelated);
    type EventRegistry = Record<string, Array<{ callback: unknown }>>;
    const before = (collection as unknown as { _events: EventRegistry })._events;
    assert.equal(before.add.length, 2);
    assert.equal(before.remove.length, 1);
    assert.equal(before.reset.length, 1);
    modelRef.release();
    const after = (collection as unknown as { _events: EventRegistry })._events;
    assert.equal(after.add.length, 1);
    assert.equal(after.add[0]?.callback, unrelated);
    assert.equal(after.remove, undefined);
    assert.equal(after.reset, undefined);
    collection.add({ id: 'dog' });
    assert.equal(unrelatedAdds, 1);
    assert.equal(modelRef.model(), null);
    assert.equal(modelRef.collection, null);
  });

  it('does not reattach after final release from a loaded callback', () => {
    const collection = new TestCollection();
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    let loaded = 0;
    let unloaded = 0;
    modelRef.on('loaded', function () {
      loaded++;
      assert.equal(this, modelRef);
      modelRef.release();
    });
    modelRef.on('unloaded', () => unloaded++);
    collection.add({ id: 'dog' });
    collection.reset();
    collection.add({ id: 'dog' });
    assert.equal(loaded, 1);
    assert.equal(unloaded, 0);
    assert.equal(modelRef.collection, null);
  });

  it('does not load a replacement after final release from unloaded', () => {
    const original = new TestModel({ id: 'dog' });
    const replacement = new TestModel({ id: 'dog' });
    const collection = new TestCollection([original]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    let unloaded = 0;
    let loaded = 0;
    modelRef.on('unloaded', function (model) {
      unloaded++;
      assert.equal(this, modelRef);
      assert.equal(model, original);
      modelRef.release();
    });
    modelRef.on('loaded', () => loaded++);
    collection.reset([replacement]);
    collection.reset([original]);
    assert.equal(unloaded, 1);
    assert.equal(loaded, 0);
    assert.equal(modelRef.collection, null);
  });

  it('never destroys model persistence on release', () => {
    class PersistentModel extends TestModel {
      destroyCalls = 0;

      override destroy(): false {
        this.destroyCalls++;
        return false;
      }
    }

    const model = new PersistentModel({ id: 'dog' });
    const collection = new TestCollection([model]);
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    modelRef.release();
    assert.equal(model.destroyCalls, 0);
    assert.equal(collection.get('dog'), model);
  });

  it('does not retain or release collection ownership', () => {
    const collection = new TestCollection() as TestCollection & {
      retain(): void;
      release(): void;
    };
    let retains = 0;
    let releases = 0;
    collection.retain = () => {
      retains++;
    };
    collection.release = () => {
      releases++;
    };
    const modelRef = new ModelRef<TestModel>(collection, 'dog');
    modelRef.release();
    assert.equal(retains, 0);
    assert.equal(releases, 0);
  });
});
