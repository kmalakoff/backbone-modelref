'use strict';

const assert = require('assert');
const Backbone = require('backbone');
const ModelRef = require('backbone-modelref');

assert.strictEqual(typeof ModelRef, 'function');
assert.strictEqual(Backbone.ModelRef, ModelRef);
assert.strictEqual(typeof Backbone.Model.prototype.model, 'function');
const dog = new Backbone.Model({ id: 'dog' });
const collection = new Backbone.Collection([dog]);
assert.strictEqual(new ModelRef(collection, 'dog').model(), dog);
