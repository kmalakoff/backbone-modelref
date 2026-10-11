import Backbone = require('backbone');
import ModelRef = require('backbone-modelref');

export class Dog extends Backbone.Model {
  bark() {
    return 'woof';
  }
}

const dogs = new Backbone.Collection<Dog>();

export const commonJsReference = new ModelRef<Dog>(dogs, 'dog');

export function acceptCommonJsReference(reference: ModelRef<Dog>) {
  const dog: Dog | null | undefined = reference.model();
  return dog?.bark();
}
