import Backbone from 'backbone';

import ModelRef from './ModelRef.ts';
import type { PresentLoadingStateParameters } from './types.ts';

// Package formats share a constructor only on the same Backbone instance and package version.
const modelRefRegistryKey: unique symbol = Symbol.for(`backbone-modelref.ModelRef@${ModelRef.VERSION}`);

type InstalledBackbone = typeof Backbone & {
  ModelRef: typeof ModelRef;
  [modelRefRegistryKey]?: typeof ModelRef;
};

interface InstalledModelPrototype {
  model(...args: [] | [never]): Backbone.Model;
  isLoaded(): boolean;
  bindLoadingStates(params: PresentLoadingStateParameters): Backbone.Model;
  unbindLoadingStates(params: PresentLoadingStateParameters): Backbone.Model;
}

const modelPrototype = Backbone.Model.prototype as unknown as InstalledModelPrototype;

modelPrototype.model = function (this: Backbone.Model, ...args: [] | [never]) {
  if (args.length === 0) return this;
  throw new Error('cannot set a Backbone.Model');
};

modelPrototype.isLoaded = function (this: Backbone.Model) {
  return true;
};

modelPrototype.bindLoadingStates = function (this: Backbone.Model, params) {
  if (typeof params === 'function') {
    params(this);
  } else if (params.loaded) {
    params.loaded(this);
  }
  return this;
};

modelPrototype.unbindLoadingStates = function (this: Backbone.Model, _params) {
  return this;
};

const installedBackbone = Backbone as InstalledBackbone;
const installedModelRef = installedBackbone[modelRefRegistryKey] || ModelRef;
installedBackbone[modelRefRegistryKey] = installedModelRef;
installedBackbone.ModelRef = installedModelRef;

export default installedModelRef;
