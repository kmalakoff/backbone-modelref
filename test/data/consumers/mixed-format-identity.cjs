'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');

const order = process.argv[2];

if (!order) {
  for (const loadingOrder of ['cjs-first', 'esm-first']) {
    const result = spawnSync(process.execPath, [__filename, loadingOrder], {
      encoding: 'utf8',
    });
    assert.strictEqual(result.status, 0, `${loadingOrder}\n${result.stdout}${result.stderr}`);
  }
  console.log('mixed-format identity passed in both loading orders');
} else {
  verify(order).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function verify(loadingOrder) {
  const Backbone = require('backbone');
  const unrelatedModelRef = function UnrelatedModelRef() {};
  Backbone.ModelRef = unrelatedModelRef;
  const dog = new Backbone.Model({ id: 'dog' });
  const collection = new Backbone.Collection([dog]);

  let CjsModelRef;
  let EsmModelRef;
  let existingReference;
  let newReference;
  if (loadingOrder === 'cjs-first') {
    CjsModelRef = require('backbone-modelref');
    existingReference = new CjsModelRef(collection, 'dog');
    EsmModelRef = (await import('backbone-modelref')).default;
    newReference = new EsmModelRef(collection, 'dog');
  } else {
    EsmModelRef = (await import('backbone-modelref')).default;
    existingReference = new EsmModelRef(collection, 'dog');
    CjsModelRef = require('backbone-modelref');
    newReference = new CjsModelRef(collection, 'dog');
  }

  assert.notStrictEqual(CjsModelRef, unrelatedModelRef);
  assert.strictEqual(CjsModelRef, EsmModelRef);
  assert.strictEqual(Backbone.ModelRef, CjsModelRef);

  assert.strictEqual(existingReference.model(), dog);
  assert.strictEqual(newReference.model(), dog);
  for (const reference of [existingReference, newReference]) {
    assert.ok(reference instanceof CjsModelRef);
    assert.ok(reference instanceof EsmModelRef);
    assert.ok(reference instanceof Backbone.ModelRef);
  }
}
