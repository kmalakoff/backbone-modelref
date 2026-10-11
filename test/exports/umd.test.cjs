const assert = require('assert');
const Backbone = require('backbone');
const ModelRef = require('backbone-modelref/umd');

describe('exports UMD', () => {
  it('exports and installs ModelRef', () => {
    assert.equal(typeof ModelRef, 'function');
    assert.equal(Backbone.ModelRef, ModelRef);
  });
});
