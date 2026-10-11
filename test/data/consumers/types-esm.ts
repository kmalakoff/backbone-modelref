import Backbone from 'backbone';
import ModelRef, { type LoadingStates } from 'backbone-modelref';

class Dog extends Backbone.Model {
  bark() {
    return 'woof';
  }
}

const dogs = new Backbone.Collection<Dog>();
const ref = new ModelRef<Dog>(dogs, 'dog');
const maybeDog: Dog | null | undefined = ref.model();
const idlessDog: Dog | null | undefined = new ModelRef<Dog>(dogs, null).model();

ref.on('loaded', (dog) => {
  if (dog) dog.bark();
});
ref.on('unloaded', (dog) => dog.bark());
const context = { calls: 0 };
ref.on(
  'loaded',
  function (dog) {
    if (dog) dog.bark();
    this.calls++;
  },
  context,
);

const states: LoadingStates<Dog> = {
  loaded(dog) {
    if (dog) dog.bark();
  },
  unloaded(dog) {
    dog.bark();
  },
};
ref.bindLoadingStates(states);

void maybeDog;
void idlessDog;
