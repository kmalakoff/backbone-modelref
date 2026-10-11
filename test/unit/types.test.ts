import assert from 'assert';
import Backbone from 'backbone';
import ModelRef, { type LoadingStates, type ModelRefValue } from 'backbone-modelref';

class Dog extends Backbone.Model {
  bark() {
    return 'woof';
  }
}

class Cat extends Backbone.Model {
  meow() {
    return 'meow';
  }
}

function assertNegativeTypes(ref: ModelRef<Dog>) {
  // @ts-expect-error ModelRef only exposes the id attribute.
  ref.get('name');
  // @ts-expect-error A base Backbone.Model is not guaranteed to be a Dog.
  ref.model(new Backbone.Model({ id: 'dog' }));

  ref.on('loaded', (model) => {
    // @ts-expect-error The legacy loaded event may carry an absent model.
    model.bark();
  });

  const catCallback = (model: Cat) => model.meow();
  // @ts-expect-error A Dog reference cannot load a Cat.
  ref.on('loaded', catCallback);
  // @ts-expect-error A Dog reference cannot unload a Cat.
  ref.on('unloaded', catCallback);
  // @ts-expect-error The bind alias retains concrete lifecycle event typing.
  ref.bind('loaded', catCallback);
  // @ts-expect-error The once alias retains concrete lifecycle event typing.
  ref.once('loaded', catCallback);
  // @ts-expect-error Event-map lifecycle callbacks retain concrete model typing.
  ref.on({ loaded: catCallback });
  // @ts-expect-error Bind event maps retain concrete model typing.
  ref.bind({ loaded: catCallback });
  // @ts-expect-error Once event maps retain concrete model typing.
  ref.once({ loaded: catCallback });

  const unsafeStates: LoadingStates<Dog> = {
    loaded(model) {
      // @ts-expect-error Loading-state callbacks may receive an absent model.
      model.bark();
    },
  };
  void unsafeStates;

  const context = { calls: 0 };
  const wrongContextCallback = function (this: { wrong: true }, _model: Dog | null | undefined) {};
  // @ts-expect-error An explicit context controls callback this for on.
  ref.on('loaded', wrongContextCallback, context);
  // @ts-expect-error An explicit context controls callback this for bind.
  ref.bind('loaded', wrongContextCallback, context);
  // @ts-expect-error An explicit context controls callback this for once.
  ref.once('loaded', wrongContextCallback, context);
  // @ts-expect-error Event-map callbacks use the supplied context type.
  ref.on({ loaded: wrongContextCallback }, context);
}

void assertNegativeTypes;

describe('public types', () => {
  it('preserves concrete models and honest absence', () => {
    const dogs = new Backbone.Collection<Dog>();
    const ref = new ModelRef<Dog>(dogs, 'dog');
    const absent: Dog | null | undefined = ref.model();
    assert.equal(absent, undefined);

    const dog = dogs.add(new Dog({ id: 'dog' }));
    const present: Dog | null | undefined = ref.model();
    assert.equal(present?.bark(), 'woof');
    const value: ModelRefValue<Dog> = ref;
    assert.equal(value, ref);

    const states: LoadingStates<Dog> = {
      loaded(model) {
        assert.ok(model);
        assert.equal(model.bark(), 'woof');
      },
      unloaded(model) {
        assert.equal(model.bark(), 'woof');
      },
    };
    assert.equal(ref.bindLoadingStates(states), dog);

    const context = { calls: 0 };
    ref.on(
      'loaded',
      function (model) {
        if (model) model.bark();
        this.calls++;
      },
      context
    );
    ref.bind(
      'unloaded',
      function (model) {
        model.bark();
        this.calls++;
      },
      context
    );
    ref.once(
      {
        loaded(model) {
          if (model) model.bark();
          this.calls++;
        },
      },
      context
    );
  });

  it('rejects unsupported attributes and model types at compile time', () => {
    const dogs = new Backbone.Collection<Dog>();
    const ref = new ModelRef<Dog>(dogs, 'dog');
    assert.equal(ref.get('id'), 'dog');
  });
});
