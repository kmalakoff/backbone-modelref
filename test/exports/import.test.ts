import assert from 'assert';
import Backbone from 'backbone';
import ModelRef from 'backbone-modelref';

describe('exports .ts', () => {
  it('exports and installs ModelRef', () => {
    assert.equal(typeof ModelRef, 'function');
    assert.equal(typeof Backbone.ModelRef, 'function');
  });
});
