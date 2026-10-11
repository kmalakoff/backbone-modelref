import assert from 'assert';
import Backbone from 'backbone';
import ModelRef from 'backbone-modelref';

describe('legacy Backbone installation', () => {
  it('installs ModelRef on the Backbone namespace', () => {
    assert.equal(typeof ModelRef, 'function');
    assert.equal(Backbone.ModelRef, ModelRef);
  });

  it('installs the model prototype helpers with legacy returns and contexts', () => {
    const model = new Backbone.Model({ id: 'dog' });
    let functionArgument: Backbone.Model | undefined;
    let functionContext: unknown;
    const functionReturn = model.bindLoadingStates(function (argument) {
      functionArgument = argument;
      functionContext = this;
    });
    assert.equal(functionArgument, model);
    assert.equal(functionContext, undefined);
    assert.equal(functionReturn, model);

    const states = {
      called: false,
      loaded(argument: Backbone.Model) {
        this.called = argument === model;
        assert.equal(this, states);
      },
    };
    assert.equal(model.bindLoadingStates(states), model);
    assert.equal(states.called, true);
    assert.equal(model.unbindLoadingStates(states), model);
    assert.equal(model.model(), model);
    assert.equal(model.isLoaded(), true);
    assert.throws(() => (model.model as (...args: unknown[]) => unknown)(model), /cannot set/);
  });
});
