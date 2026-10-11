const assert = require('assert');
const ModelRef = require('backbone-modelref');
const packageJson = require('../../package.json');

describe('installed package version', () => {
  it('matches ModelRef.VERSION', () => {
    assert.equal(ModelRef.VERSION, packageJson.version);
  });
});
