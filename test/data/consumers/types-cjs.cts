import Backbone = require('backbone');
import ModelRef = require('backbone-modelref');

class Dog extends Backbone.Model {
  bark() {
    return 'woof';
  }
}

const dogs = new Backbone.Collection<Dog>();
const ref = new ModelRef<Dog>(dogs, 'dog');
const value: ModelRef<Dog> = ref;

ref.once('loaded', (dog) => {
  if (dog) dog.bark();
});
const context = { calls: 0 };
ref.bind(
  'unloaded',
  function (dog) {
    dog.bark();
    this.calls++;
  },
  context,
);
ref.once({
  unloaded(dog) {
    dog.bark();
  },
});

// @ts-expect-error A Dog reference cannot be assigned to an unrelated model type.
const invalidReference: ModelRef<Backbone.Model & { meow(): string }> = ref;

void value;
void invalidReference;
