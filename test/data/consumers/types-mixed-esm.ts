import Backbone from 'backbone';
import ModelRef from 'backbone-modelref';

import { acceptCommonJsReference, commonJsReference, type Dog } from './types-mixed-cjs.cjs';

class Cat extends Backbone.Model {
  meow() {
    return 'meow';
  }
}

const exchangedReference: ModelRef<Dog> = commonJsReference;
acceptCommonJsReference(exchangedReference);
const esmReference = new ModelRef<Dog>(new Backbone.Collection<Dog>(), 'dog');
acceptCommonJsReference(esmReference);

exchangedReference.on('loaded', (dog) => {
  if (dog) dog.bark();
});

exchangedReference.on('loaded', (dog) => {
  // @ts-expect-error A loaded event can carry an absent model.
  dog.bark();
});

const catCallback = (cat: Cat) => cat.meow();
// @ts-expect-error A Dog reference cannot load a Cat callback.
exchangedReference.on('loaded', catCallback);

// @ts-expect-error Concrete ModelRef types remain distinct across conditions.
const wrongReference: ModelRef<Cat> = commonJsReference;

void wrongReference;
