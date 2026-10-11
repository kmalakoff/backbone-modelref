const assert = require('assert');
const Backbone = require('backbone');
const ModelRef = require('backbone-modelref');

describe('exports .cjs', () => {
  it('exports and installs ModelRef', () => {
    assert.equal(typeof ModelRef, 'function');
    assert.equal(typeof Backbone.ModelRef, 'function');
  });
});
